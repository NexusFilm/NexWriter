# Implementation Plan: NexWriter Production Tools Expansion

## Overview

Incremental build of six new production modules for NexWriter: Shot List Builder, Agreement Manager, Lighting Diagram Tool, TMDB Mood Board, Admin Panel, and Feature Gating System. Build order: schema migration → feature flags → shot lists → agreements → mood board → lighting diagrams → admin panel → TMDB attribution → final integration. All modules use the existing React 18 / TypeScript / Zustand / Supabase / Vite stack with Konva.js added for the lighting diagram canvas.

## Tasks

- [x] 1. Schema migration, new types, and core interfaces
  - [x] 1.1 Create Supabase migration SQL for all new sw_ tables and ALTER statements
    - Create tables: sw_shot_lists, sw_shot_entries, sw_agreement_templates, sw_agreement_instances, sw_lighting_diagrams, sw_mood_boards, sw_mood_board_images, sw_feature_flags
    - ALTER sw_user_profiles: add `role` column (text, NOT NULL DEFAULT 'user', CHECK IN ('user','admin')) and `locked_at` column (timestamptz, nullable)
    - ALTER sw_blog_posts: add admin INSERT/UPDATE/DELETE RLS policies
    - Define all RLS policies per the design document (user-scoped for data tables, authenticated SELECT + admin UPDATE for feature flags)
    - Seed sw_feature_flags with initial rows: shot_lists, agreements, lighting_diagrams, mood_boards, stripe_payments
    - _Requirements: 20.1, 20.2, 20.3, 20.4, 20.5, 20.6_

  - [x] 1.2 Define new TypeScript types and interfaces
    - Create types: ShotType, FeatureKey, LightingSymbolType, DiagramElementType
    - Create interfaces: ShotList, ShotEntry, AgreementTemplate, TemplateField, AgreementInstance, DiagramElement, LightingDiagram, MoodBoard, MoodBoardImage, FeatureFlag, MovieSearchResult, TMDBImage, AdminUserRow
    - Create repository interfaces: IShotListRepository, IAgreementRepository, ILightingDiagramRepository, IMoodBoardRepository, IFeatureFlagRepository, IAdminRepository
    - Create service interfaces: ITMDBService, IFeatureGateService, IFileUploadService, ILightingSerializer, IReadTimeCalculator
    - Extend ErrorCode type with new codes: UPLOAD_FAILED, UPLOAD_FILE_TOO_LARGE, UPLOAD_INVALID_TYPE, TMDB_SEARCH_FAILED, TMDB_IMAGES_FAILED, SHOT_LIST_SAVE_FAILED, AGREEMENT_SAVE_FAILED, DIAGRAM_SAVE_FAILED, MOOD_BOARD_SAVE_FAILED, ADMIN_ACTION_FAILED, FEATURE_FLAG_LOAD_FAILED, ACCOUNT_LOCKED
    - _Requirements: 1.1, 1.2, 8.1, 8.2, 10.1, 11.1, 19.1, 20.1, 22.1_

  - [x] 1.3 Install Konva.js dependency
    - Install `konva` and `react-konva` packages
    - Add VITE_TMDB_API_KEY and VITE_TMDB_READ_ACCESS_TOKEN to .env.example
    - Add VITE_ADMIN_EMAILS to .env.example
    - _Requirements: 8.1_

- [x] 2. Checkpoint — Schema and types
  - Ensure all tests pass, ask the user if questions arise.

- [x] 3. Feature Flag System (gates all new modules)
  - [x] 3.1 Implement FeatureFlagRepository
    - Implement `getAllFlags()`: SELECT * FROM sw_feature_flags
    - Implement `updateFlag(flagId, isEnabled)`: UPDATE sw_feature_flags SET is_enabled
    - Follow existing AppError pattern for error handling
    - _Requirements: 19.1, 19.2, 16.1, 16.2_

  - [x] 3.2 Implement FeatureFlagStore (Zustand)
    - Manage `flags: Record<FeatureKey, boolean>`, `loaded: boolean`
    - Implement `setFlags(flags)`, `isEnabled(key)` methods
    - _Requirements: 19.2_

  - [x] 3.3 Implement FeatureGateService
    - Implement `initialize()`: fetch all flags via FeatureFlagRepository, populate FeatureFlagStore
    - Implement `isFeatureEnabled(featureKey)`: read from FeatureFlagStore, return false if key not present
    - Fail-open on load failure (default all features enabled)
    - _Requirements: 16.3, 16.4, 19.2, 19.3, 19.4, 19.5_

  - [ ]* 3.4 Write property test for Feature Flag Check (Property 7)
    - **Property 7: Feature Flag Check Correctness**
    - Generate random maps of FeatureKey → boolean and random feature keys, verify `isFeatureEnabled` returns stored value or false if key absent
    - **Validates: Requirements 16.4, 19.5**

  - [x] 3.5 Implement FeatureGate component
    - Wrap route children; render "Coming Soon" placeholder when feature disabled, render children when enabled
    - _Requirements: 16.4, 19.3, 19.4_

  - [x] 3.6 Implement Stripe payments disabled behavior
    - When stripe_payments flag is disabled: hide PaywallModal prompts, treat all users as full access
    - When stripe_payments flag is enabled: enforce existing tier-based gating
    - _Requirements: 17.1, 17.2, 17.3_

  - [ ]* 3.7 Write property test for Stripe Payments Disabled Access (Property 8)
    - **Property 8: Stripe Payments Disabled Grants Full Access**
    - Generate random user tiers and gated features, verify that when stripe_payments is disabled the combined access check returns true regardless of tier
    - **Validates: Requirements 17.1**

- [x] 4. Checkpoint — Feature flag system
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. File Upload Service (shared by Shot Lists, Agreements, Lighting)
  - [x] 5.1 Implement FileUploadService
    - Implement `uploadFile(bucket, path, file)`: upload to Supabase Storage with upsert
    - Implement `validateFileType(file, allowedTypes)`: check MIME type against allowed list
    - Implement `validateFileSize(file, maxSizeMB)`: check file.size <= maxSizeMB * 1024 * 1024
    - Implement `getPublicUrl(bucket, path)`: return Supabase Storage public URL
    - Implement `buildStoragePath(prefix, userId, filename)`: construct user-scoped path
    - Storage path conventions: shots/{userId}/{filename}, agreements/{userId}/{filename}, signatures/{userId}/{filename}, lighting/{userId}/{filename}
    - Error handling: descriptive AppError on failure, preserve form state
    - _Requirements: 22.1, 22.2, 22.3, 22.4_

  - [ ]* 5.2 Write property test for File Validation (Property 2)
    - **Property 2: File Validation Correctness**
    - Generate random file sizes and limits, verify `validateFileSize` returns true iff size <= limit. Generate random MIME types and allowed lists, verify `validateFileType` returns true iff type is in list
    - **Validates: Requirements 2.4, 6.2, 22.4**

  - [ ]* 5.3 Write property test for Storage Path Construction (Property 10)
    - **Property 10: Storage Path Construction**
    - Generate random userId and filename strings, verify constructed path matches `{prefix}/{userId}/{filename}` pattern for each defined prefix
    - **Validates: Requirements 22.2**

- [x] 6. Shot List Builder
  - [x] 6.1 Implement ShotListRepository
    - Implement `getShotLists`, `createShotList`, `deleteShotList`, `getShotEntries`, `insertShotEntry`, `updateShotEntry`, `deleteShotEntry`, `reorderShotEntries`
    - All operations on sw_shot_lists and sw_shot_entries tables
    - Follow existing AppError pattern
    - _Requirements: 1.1, 1.4, 1.5, 1.6_

  - [x] 6.2 Implement ShotListStore (Zustand)
    - Manage currentList, entries, loading state
    - Implement setCurrentList, setEntries, addEntry, updateEntry, removeEntry, reorderEntries
    - _Requirements: 1.1, 1.2_

  - [x] 6.3 Implement renumberShots pure function
    - Given ordered ShotEntry[], return new array with shotNumber = index + 1
    - Used after delete and drag-and-drop reorder
    - _Requirements: 1.3, 1.5_

  - [ ]* 6.4 Write property test for Shot Renumbering (Property 1)
    - **Property 1: Shot Renumbering Produces Sequential Numbers**
    - Generate random arrays of shot entries (length 0..N), verify renumberShots produces sequential 1-based shotNumbers and preserves array length
    - **Validates: Requirements 1.3, 1.5, 3.2**

  - [x] 6.5 Implement ShotListPage with ShotEntryTable and ShotEntryCard
    - ShotListToolbar: scene selector (link to SCENE_HEADING from screenplay), export PDF button, create new shot list
    - ShotEntryTable: table layout for desktop (>= 768px) with all shot fields
    - ShotEntryCard: stacked card layout for mobile (< 768px)
    - ShotTypeSelect dropdown with all 10 shot types
    - ReferenceImageThumbnail display within each entry row/card
    - ImageUploadButton: upload from device (max 5 MB, JPEG/PNG/WebP) or select from mood board
    - Drag-and-drop reordering via HTML5 Drag and Drop API, renumber on drop
    - Auto-assign sequential shot numbers on add
    - Inline editing of all shot entry fields with auto-persist
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 3.4, 21.1, 21.2_

  - [x] 6.6 Implement ShotListPDFService
    - Generate PDF with jsPDF: table layout, project title header, scene heading subheader, all shot entry fields, reference image thumbnails
    - Trigger browser file download
    - _Requirements: 4.1, 4.2, 4.3_

- [x] 7. Checkpoint — Shot List Builder
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Agreement Manager
  - [x] 8.1 Implement AgreementRepository
    - Implement `getTemplates(userId)`: fetch built-in (user_id IS NULL) + user's custom templates
    - Implement `createTemplate`, `getInstances`, `getInstance`, `createInstance`, `updateInstance`
    - All operations on sw_agreement_templates and sw_agreement_instances
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 6.1, 6.3, 6.4_

  - [x] 8.2 Seed built-in agreement templates
    - Model release template: fields for model name, production title, producer name, date, usage rights, compensation terms
    - Location release template: fields for location owner name, address, production title, date range, access terms
    - Crew deal memo template: fields for crew member name, role, production title, start/end date, rate, payment terms
    - Insert seed data into sw_agreement_templates with template_type and fields JSON
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

  - [x] 8.3 Implement SignatureCanvas component
    - Vanilla HTML5 Canvas for freehand drawing (mouse + touch input)
    - Clear button to reset canvas
    - Export to PNG Blob for upload to Supabase Storage under signatures/ prefix
    - _Requirements: 7.1, 7.2_

  - [x] 8.4 Implement AgreementListPage and AgreementEditorPage
    - AgreementListPage: TemplateGrid showing built-in + custom templates, AgreementInstanceList showing user's agreement instances
    - Custom upload: accept PDF only (max 10 MB), store in Supabase Storage under agreements/ prefix, create custom template record
    - AgreementEditorPage: FieldForm rendering dynamic fields from template definition as editable inputs
    - SignatureCanvas integration for capturing signatures
    - Save field values and signature path to sw_agreement_instances
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 6.1, 6.2, 6.3, 6.4, 7.1, 7.2, 7.4_

  - [x] 8.5 Implement AgreementPDFService
    - Generate PDF with jsPDF: all filled-in field values + captured signature image
    - Trigger browser file download
    - _Requirements: 7.3, 7.5_

- [x] 9. Checkpoint — Agreement Manager
  - Ensure all tests pass, ask the user if questions arise.

- [x] 10. Mood Board (TMDB Integration)
  - [x] 10.1 Implement TMDBService
    - Implement `searchMovies(query, options)`: query TMDB /search/movie endpoint, support genre and year range filtering
    - Implement `getMovieImages(movieId)`: fetch backdrops and stills from /movie/{id}/images
    - Implement `getImageUrl(path, size)`: construct TMDB image URL with size variant (w200, w500, original)
    - Client-side genre filtering from genreIds array
    - Error handling: network errors, rate limiting (429), invalid API key, empty results
    - Isolate all TMDB API calls in this dedicated module per TMDB ToS
    - _Requirements: 10.1, 10.2, 10.3, 12.7_

  - [ ]* 10.2 Write property test for TMDB Genre Filter (Property 4)
    - **Property 4: TMDB Genre Filter Returns Only Matching Movies**
    - Generate random MovieSearchResult[] and target genre ID, verify filter returns only results containing the genre and excludes none that match
    - **Validates: Requirements 10.2**

  - [x] 10.3 Implement MoodBoardRepository
    - Implement `getBoards`, `createBoard`, `deleteBoard`, `getImages`, `saveImage`, `updateImage`, `deleteImage`
    - All operations on sw_mood_boards and sw_mood_board_images
    - _Requirements: 11.1, 11.2, 11.3, 11.4_

  - [x] 10.4 Implement MoodBoardStore (Zustand)
    - Manage boards, currentBoard, images, searchResults, movieImages
    - _Requirements: 11.1_

  - [x] 10.5 Implement MoodBoardPage and MoodBoardDetailPage
    - TMDBSearchBar: text input for movie search
    - MovieResultGrid: display search results with title, year, poster thumbnail
    - MovieImageGrid: responsive grid of stills + backdrops with lazy loading
    - ImageLightbox: full-resolution overlay on image click
    - BoardCollectionSidebar: list of user's mood board collections, create new board
    - Save image to board: store TMDB image path, movie ID, board ID
    - MoodBoardDetailPage: SavedImageGrid with note + tags visible on hover, edit note/tags inline
    - Single-column grid on mobile (< 768px)
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 11.1, 11.2, 11.3, 11.4, 11.5, 21.1, 21.3_

- [x] 11. Checkpoint — Mood Board
  - Ensure all tests pass, ask the user if questions arise.

- [x] 12. Lighting Diagram Tool
  - [x] 12.1 Implement LightingSerializer service
    - Implement `serialize(elements, canvasWidth, canvasHeight)`: convert DiagramElement[] + dimensions to JSON string
    - Implement `deserialize(json)`: parse JSON back to { elements, canvasWidth, canvasHeight }
    - Pure functions for round-trip consistency
    - _Requirements: 9.1, 9.2_

  - [ ]* 12.2 Write property test for Lighting Diagram Round-Trip (Property 3)
    - **Property 3: Lighting Diagram Serialization Round-Trip**
    - Generate random DiagramElement[] with canvas dimensions, verify serialize then deserialize produces equivalent state
    - **Validates: Requirements 9.1, 9.2, 9.3**

  - [x] 12.3 Implement LightingDiagramRepository
    - Implement `getDiagram(scriptId, sceneIndex)`: SELECT with UNIQUE constraint on (user_id, script_id, scene_index)
    - Implement `saveDiagram`: INSERT or upsert diagram with serialized elements JSON
    - Implement `updateDiagram(diagramId, elements)`: UPDATE elements column
    - _Requirements: 9.1, 9.2_

  - [x] 12.4 Implement LightingStore (Zustand)
    - Manage diagram, selectedElementId
    - Implement setDiagram, addElement, updateElement, removeElement, selectElement
    - _Requirements: 8.6_

  - [x] 12.5 Implement LightingDiagramPage with Konva.js canvas
    - KonvaCanvas: react-konva Stage + Layer with background grid
    - SymbolPalette sidebar: draggable lighting symbols (key light, fill light, back light, hair light, bounce, flag, diffusion, gel, practical)
    - CameraMarker: draggable camera position marker
    - ActorMarker: draggable, labeled actor position markers
    - WallShape, WindowShape, DoorShape: simple shape tools for room layout
    - All elements draggable with onDragEnd updating LightingStore
    - Transformer for selected element resize/rotate
    - Touch input support for mobile drag operations
    - Auto-save diagram state on element changes via LightingDiagramRepository
    - Load existing diagram on mount, restore all elements from stored JSON
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 9.1, 9.2, 21.1, 21.4_

  - [x] 12.6 Implement lighting diagram export (PNG and PDF)
    - PNG export: render Konva stage to PNG image, trigger browser download
    - PDF export: render canvas to PDF with jsPDF, scene heading as title, trigger browser download
    - _Requirements: 9.4, 9.5_

- [x] 13. Checkpoint — Lighting Diagram Tool
  - Ensure all tests pass, ask the user if questions arise.

- [x] 14. Admin Panel
  - [x] 14.1 Implement AdminGuard component
    - Check user email against VITE_ADMIN_EMAILS env var (hardcoded list)
    - Fallback: check role column in sw_user_profiles for 'admin'
    - Redirect non-admin users to Dashboard (/)
    - _Requirements: 13.1, 13.2, 13.3_

  - [ ]* 14.2 Write property test for Admin Access Check (Property 5)
    - **Property 5: Admin Access Check Correctness**
    - Generate random email/role combinations, verify isAdmin returns true iff email is in admin list OR role is 'admin'
    - **Validates: Requirements 13.1**

  - [x] 14.3 Implement AdminRepository
    - Implement `getTotalUsers()`, `getTotalScripts()`, `getActiveUsersLast7Days()`: aggregate Supabase queries
    - Implement `getUsers(page, pageSize)`: paginated user list with email, displayName, tier, scriptCount, createdAt, lockedAt
    - Implement `lockUser(userId)`: set locked_at to current timestamp
    - Implement `unlockUser(userId)`: set locked_at to null
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 15.1, 15.2, 15.3_

  - [x] 14.4 Implement locked account login prevention
    - Modify AuthRepository.signIn to check locked_at column after authentication
    - If locked_at is non-null, reject login with ACCOUNT_LOCKED error and display "Your account has been locked" message
    - _Requirements: 15.4_

  - [ ]* 14.5 Write property test for Locked User Login Prevention (Property 6)
    - **Property 6: Locked User Login Prevention**
    - Generate random user records with nullable locked_at, verify auth check rejects when locked_at is non-null and allows when null
    - **Validates: Requirements 15.4**

  - [x] 14.6 Implement AdminStore (Zustand)
    - Manage metrics, users, userTotal, userPage, blogPosts, flags
    - _Requirements: 14.1, 14.2, 14.3_

  - [x] 14.7 Implement AdminDashboardPage
    - MetricsCardGrid: display total users, total scripts, active users (last 7 days)
    - Compute metrics via AdminRepository at page load
    - _Requirements: 14.1, 14.2, 14.3, 14.4_

  - [x] 14.8 Implement AdminUsersPage
    - UserTable: paginated list showing email, display name, tier, script count, created date, lock status
    - Lock/Unlock buttons per user row
    - _Requirements: 15.1, 15.2, 15.3_

  - [x] 14.9 Implement AdminFlagsPage
    - FeatureFlagList: display all flags with toggle switches
    - Toggle updates is_enabled via FeatureFlagRepository.updateFlag
    - _Requirements: 16.1, 16.2_

  - [x] 14.10 Implement admin blog management (AdminBlogListPage + AdminBlogEditorPage)
    - AdminBlogListPage: BlogPostTable showing title, category, published status, created date
    - AdminBlogEditorPage: BlogMetaForm (title, slug, category, author) + TipTapBlogEditor (WYSIWYG with headings, bold, italic, links, lists)
    - Save/upsert blog post via BlogRepository
    - Publish: set published_at to current timestamp; Unpublish: set published_at to null
    - Compute and store read_time_minutes based on content word count (200 wpm)
    - _Requirements: 18.1, 18.2, 18.3, 18.4, 18.5, 18.6, 18.7_

  - [ ]* 14.11 Write property test for Read Time Calculation (Property 9)
    - **Property 9: Read Time Calculation**
    - Generate random HTML strings, verify calculateReadTime returns Math.max(1, Math.ceil(wordCount / 200)) after stripping tags
    - **Validates: Requirements 18.7**

  - [x] 14.12 Wire admin navigation link
    - Display "Admin" link in main navigation when user is authenticated as admin
    - Collapsible sidebar navigation on viewports below 1024px
    - _Requirements: 13.4, 21.5_

- [x] 15. Checkpoint — Admin Panel
  - Ensure all tests pass, ask the user if questions arise.

- [x] 16. TMDB Attribution and Credits Page
  - [x] 16.1 Implement CreditsPage
    - Display text: "This product uses the TMDB API but is not endorsed or certified by TMDB."
    - Display text: "Movie and TV metadata and images are provided by TMDB."
    - Display approved TMDB logo at a size less prominent than NexWriter branding
    - Include clickable link to https://www.themoviedb.org
    - Refer to data source only as "TMDB" or "The Movie Database" in all user-facing text
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6_

  - [x] 16.2 Add Credits link to navigation
    - Add About/Credits section accessible from main navigation or settings
    - _Requirements: 12.1_

- [x] 17. Integration and wiring
  - [x] 17.1 Update React Router with all new routes
    - Add production tool routes: /shots/:scriptId, /agreements, /agreements/:instanceId, /lighting/:scriptId/:sceneIndex, /moodboard, /moodboard/:boardId, /credits
    - Add admin routes: /admin, /admin/users, /admin/flags, /admin/blog, /admin/blog/new, /admin/blog/:postId
    - Wrap production tool routes with FeatureGate component
    - Wrap admin routes with AdminGuard component
    - _Requirements: 13.3, 16.4, 19.3_

  - [x] 17.2 Initialize FeatureGateService on app load
    - Call FeatureGateService.initialize() in App component on mount
    - Ensure flags are loaded before rendering gated routes
    - _Requirements: 16.3, 19.2_

  - [x] 17.3 Wire navigation links for new modules
    - Add Shot Lists, Agreements, Lighting, Mood Board links to Dashboard or editor sidebar
    - Conditionally show links based on feature flag state
    - _Requirements: 1.1, 19.3, 19.4_

  - [ ]* 17.4 Write integration tests for critical flows
    - ShotListRepository CRUD against mock Supabase
    - AgreementRepository template fetch and instance save
    - TMDBService search with mocked API responses
    - FeatureGateService initialization and flag checks
    - AdminRepository metrics and user management
    - FileUploadService upload and validation
    - _Requirements: 1.4, 6.4, 9.1, 10.1, 16.3, 22.3_

- [x] 18. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation throughout the build
- Property tests validate the 10 universal correctness properties from the design document using fast-check
- The feature flag system is built first because it gates all other new modules
- Konva.js (react-konva) is the only new runtime dependency
- All business logic resides in service/repository classes — React components are purely presentational
- The tech stack is React 18 / TypeScript / TipTap / Zustand / Supabase / Konva.js / jsPDF / Vitest / fast-check
