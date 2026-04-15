# Requirements Document

## Introduction

NexWriter Production Tools Expansion adds production-oriented modules alongside the existing screenwriting features. The expansion includes a Shot List Builder for planning camera work per scene, a Model Release and Agreement Templates system for managing production paperwork with digital signatures, a Scene-by-Scene Lighting Diagram Tool using a canvas-based editor, a TMDB-powered Mood Board for visual reference collection, an Admin Panel for platform management and content authoring, a Feature Gating System for toggling features globally, and TMDB Attribution compliance. All modules share the existing React 18 / TypeScript / TipTap / Zustand / Supabase / Vite stack, the same Supabase project (ozzjcuamqslxjcfgtfhj), and all new tables are prefixed with `sw_`. File uploads (images, PDFs, signatures) use Supabase Storage. The TMDB API is used under free non-commercial terms with required attribution.

## Glossary

- **Shot_List_Builder**: The module for creating and managing shot lists linked to scenes or projects
- **Shot_Entry**: A single row in a shot list containing shot number, shot type, description, camera angle, camera movement, lens, notes, and optional reference image
- **Shot_Type**: One of Wide, Medium, Close-Up, Extreme Close-Up, Over-the-Shoulder, POV, Insert, Establishing, Two-Shot, or Aerial
- **Agreement_Manager**: The module for managing model releases, location releases, crew deal memos, and custom agreement PDFs
- **Agreement_Template**: A built-in or user-uploaded PDF template with fill-in-the-blank fields
- **Digital_Signature**: A user-drawn signature captured on a canvas element and stored as a PNG in Supabase Storage
- **Lighting_Diagram_Tool**: The canvas-based drawing tool for creating per-scene lighting setup diagrams
- **Lighting_Symbol**: A draggable icon representing a lighting instrument or modifier (key light, fill light, back light, bounce, flag, diffusion, etc.)
- **Mood_Board**: A collection of saved TMDB movie stills and backdrops with user notes and tags
- **TMDB_Service**: The service layer that queries the TMDB API for movie search, stills, and backdrops
- **Admin_Panel**: The platform management interface accessible only to admin users
- **Feature_Flag**: A row in sw_feature_flags that controls whether a specific feature is enabled or disabled globally
- **Feature_Gate_Service**: The client-side service that reads feature flags on app load and gates UI accordingly
- **Blog_Editor**: The TipTap-based WYSIWYG editor used in the Admin Panel for creating and editing blog posts
- **TMDB_Attribution**: The required legal attribution text, logo, and link for TMDB API usage
- **Supabase_Storage**: The file storage service used for uploaded images, PDFs, and signature PNGs
- **Admin_User**: A user whose email or role in sw_user_profiles grants access to the Admin Panel

## Requirements

### Requirement 1: Shot List Builder — CRUD and Data Model

**User Story:** As a filmmaker, I want to create and manage shot lists for my scenes and projects, so that I can plan my camera work before production.

#### Acceptance Criteria

1. THE Shot_List_Builder SHALL allow the user to create a new shot list associated with a specific scene or with the project as a whole
2. WHEN the user adds a shot entry, THE Shot_List_Builder SHALL capture: shot number, shot type, description, camera angle, camera movement, lens, and notes
3. THE Shot_List_Builder SHALL auto-assign sequential shot numbers starting from 1 within each shot list
4. WHEN the user edits a shot entry field, THE Shot_List_Builder SHALL persist the change to the sw_shot_entries table via the ShotListRepository
5. WHEN the user deletes a shot entry, THE Shot_List_Builder SHALL remove the entry from sw_shot_entries and renumber remaining shots sequentially
6. THE Shot_List_Builder SHALL store shot lists in the sw_shot_lists table and shot entries in the sw_shot_entries table, both prefixed with sw_

### Requirement 2: Shot List Builder — Image Upload and TMDB Reference

**User Story:** As a filmmaker, I want to attach reference images to my shots from my device or from my TMDB mood boards, so that I can visually communicate my vision.

#### Acceptance Criteria

1. WHEN the user uploads an image from a device, THE Shot_List_Builder SHALL store the image in Supabase_Storage under a shots/ prefix and save the storage path in the shot entry record
2. WHEN the user selects a reference image from an existing Mood_Board, THE Shot_List_Builder SHALL link the TMDB image URL to the shot entry record
3. THE Shot_List_Builder SHALL display the reference image as a thumbnail within the shot entry row
4. IF the image upload exceeds 5 MB, THEN THE Shot_List_Builder SHALL reject the upload and display a file size error message

### Requirement 3: Shot List Builder — Reordering and Scene Linking

**User Story:** As a filmmaker, I want to reorder my shots via drag-and-drop and link them to specific screenplay scenes, so that my shot list reflects the shooting plan.

#### Acceptance Criteria

1. THE Shot_List_Builder SHALL support drag-and-drop reordering of shot entries within a shot list
2. WHEN the user completes a drag-and-drop reorder, THE Shot_List_Builder SHALL update the shot_order column for all affected entries and renumber shot numbers sequentially
3. THE Shot_List_Builder SHALL allow the user to link a shot list to a specific scene by selecting a SCENE_HEADING from the current screenplay
4. WHEN a shot list is linked to a scene, THE Shot_List_Builder SHALL display the scene heading text as a label on the shot list

### Requirement 4: Shot List Builder — PDF Export

**User Story:** As a filmmaker, I want to export my shot list as a PDF, so that I can share it with my crew on set.

#### Acceptance Criteria

1. WHEN the user requests a PDF export of a shot list, THE Shot_List_Builder SHALL generate a PDF containing all shot entries with their shot number, shot type, description, camera angle, camera movement, lens, notes, and reference image thumbnails
2. THE Shot_List_Builder SHALL format the PDF with a table layout, the project title as a header, and the linked scene heading as a subheader when applicable
3. THE Shot_List_Builder SHALL trigger a browser file download for the generated PDF

### Requirement 5: Agreement Manager — Built-in Templates

**User Story:** As a filmmaker, I want built-in agreement templates for common production documents, so that I can quickly generate paperwork without starting from scratch.

#### Acceptance Criteria

1. THE Agreement_Manager SHALL provide a built-in model release template with fill-in-the-blank fields for: model name, production title, producer name, date, usage rights description, and compensation terms
2. THE Agreement_Manager SHALL provide a built-in location release template with fill-in-the-blank fields for: location owner name, location address, production title, date range, and access terms
3. THE Agreement_Manager SHALL provide a built-in crew deal memo template with fill-in-the-blank fields for: crew member name, role, production title, start date, end date, rate, and payment terms
4. THE Agreement_Manager SHALL store template definitions in the sw_agreement_templates table

### Requirement 6: Agreement Manager — Custom Upload and Field Entry

**User Story:** As a filmmaker, I want to upload my own agreement PDFs and fill in fields on any template, so that I can use my preferred legal documents.

#### Acceptance Criteria

1. WHEN the user uploads a custom agreement PDF, THE Agreement_Manager SHALL store the file in Supabase_Storage under an agreements/ prefix and create a record in sw_agreement_templates with template_type set to "custom"
2. IF the uploaded file is not a valid PDF or exceeds 10 MB, THEN THE Agreement_Manager SHALL reject the upload and display a descriptive error message
3. WHEN the user opens a template (built-in or custom), THE Agreement_Manager SHALL display all fill-in-the-blank fields as editable form inputs
4. WHEN the user fills in a field and saves, THE Agreement_Manager SHALL persist the field values to the sw_agreement_instances table

### Requirement 7: Agreement Manager — Digital Signature and PDF Export

**User Story:** As a filmmaker, I want to capture digital signatures and export completed agreements as PDFs, so that I have signed documents ready for production.

#### Acceptance Criteria

1. THE Agreement_Manager SHALL provide a canvas-based signature capture area where the user can draw a signature using touch or mouse input
2. WHEN the user confirms a signature, THE Agreement_Manager SHALL save the signature as a PNG image in Supabase_Storage under a signatures/ prefix
3. WHEN the user requests a PDF export of a completed agreement, THE Agreement_Manager SHALL generate a PDF containing all filled-in field values and the captured signature image
4. THE Agreement_Manager SHALL store completed and signed agreement records in the sw_agreement_instances table with a reference to the signature image path
5. THE Agreement_Manager SHALL trigger a browser file download for the generated PDF

### Requirement 8: Lighting Diagram Tool — Canvas Editor

**User Story:** As a filmmaker, I want a canvas-based drawing tool for each scene, so that I can plan my lighting setups visually.

#### Acceptance Criteria

1. THE Lighting_Diagram_Tool SHALL render a canvas workspace using the Canvas API or Konva.js for each scene
2. THE Lighting_Diagram_Tool SHALL provide a palette of draggable Lighting_Symbols including: key light, fill light, back light, hair light, bounce, flag, diffusion, gel, and practical
3. THE Lighting_Diagram_Tool SHALL provide a camera position marker that the user can place on the canvas
4. THE Lighting_Diagram_Tool SHALL provide actor position markers that the user can place and label on the canvas
5. THE Lighting_Diagram_Tool SHALL provide simple shape tools for walls, windows, and doors
6. WHEN the user places or moves an element on the canvas, THE Lighting_Diagram_Tool SHALL update the diagram state in real time

### Requirement 9: Lighting Diagram Tool — Persistence and Export

**User Story:** As a filmmaker, I want to save my lighting diagrams per scene and export them, so that I can reference them during production.

#### Acceptance Criteria

1. THE Lighting_Diagram_Tool SHALL serialize the canvas state (all element positions, types, labels, and properties) as JSON and store the diagram in the sw_lighting_diagrams table linked to a scene
2. WHEN the user reopens a scene diagram, THE Lighting_Diagram_Tool SHALL deserialize the stored JSON and restore all elements to their saved positions
3. FOR ALL valid diagram JSON states, serializing then deserializing SHALL produce a diagram state equivalent to the original (round-trip property)
4. WHEN the user requests a PNG export, THE Lighting_Diagram_Tool SHALL render the canvas to a PNG image and trigger a browser file download
5. WHEN the user requests a PDF export, THE Lighting_Diagram_Tool SHALL render the canvas to a PDF document with the scene heading as a title and trigger a browser file download

### Requirement 10: Mood Board — TMDB Search and Browse

**User Story:** As a filmmaker, I want to search TMDB for movies and browse their stills and backdrops, so that I can find visual references for my project.

#### Acceptance Criteria

1. WHEN the user enters a search query, THE TMDB_Service SHALL query the TMDB API search/movie endpoint with the query text and return matching movie results with title, year, and poster thumbnail
2. THE TMDB_Service SHALL support filtering search results by genre and year range
3. WHEN the user selects a movie from search results, THE TMDB_Service SHALL fetch the movie's images (stills and backdrops) from the TMDB API movie/{id}/images endpoint
4. THE Mood_Board SHALL display fetched images in a responsive grid layout with lazy loading
5. WHEN the user clicks an image in the grid, THE Mood_Board SHALL display the image in a lightbox overlay at full resolution

### Requirement 11: Mood Board — Collections and Notes

**User Story:** As a filmmaker, I want to save TMDB images to mood board collections with notes and tags, so that I can organize my visual references by theme or scene.

#### Acceptance Criteria

1. THE Mood_Board SHALL allow the user to create multiple named mood board collections per project, stored in the sw_mood_boards table
2. WHEN the user saves an image to a mood board, THE Mood_Board SHALL store the TMDB image path, movie ID, and mood board ID in the sw_mood_board_images table
3. THE Mood_Board SHALL allow the user to add a text note and comma-separated tags to each saved image, stored in the sw_mood_board_images table
4. WHEN the user edits a note or tags on a saved image, THE Mood_Board SHALL persist the changes to sw_mood_board_images
5. THE Mood_Board SHALL display saved images in a grid layout with note and tag previews visible on hover

### Requirement 12: Mood Board — TMDB Attribution

**User Story:** As a platform owner, I want to comply with TMDB API terms of use, so that the app can legally display TMDB content.

#### Acceptance Criteria

1. THE Application SHALL display an About/Credits section accessible from the main navigation or settings
2. THE About/Credits section SHALL include the text: "This product uses the TMDB API but is not endorsed or certified by TMDB."
3. THE About/Credits section SHALL include the text: "Movie and TV metadata and images are provided by TMDB."
4. THE About/Credits section SHALL display the approved TMDB logo at a size less prominent than the NexWriter application branding
5. THE About/Credits section SHALL include a clickable link to https://www.themoviedb.org
6. THE Application SHALL refer to the data source only as "TMDB" or "The Movie Database" in all user-facing text
7. THE TMDB_Service SHALL isolate all TMDB API calls and attribution logic into a dedicated module so that licensing terms can be revisited when monetization is added

### Requirement 13: Admin Panel — Access Control

**User Story:** As a platform owner, I want the admin panel accessible only to authorized admin users, so that regular users cannot access management features.

#### Acceptance Criteria

1. THE Admin_Panel SHALL be accessible only to users whose email matches a hardcoded admin email list or whose role column in sw_user_profiles is set to "admin"
2. WHEN a non-admin user attempts to navigate to an admin route, THE Application SHALL redirect the user to the Dashboard
3. THE Admin_Panel SHALL be accessible via a /admin route protected by an AdminGuard component
4. WHILE a user is authenticated as an admin, THE Application SHALL display an "Admin" link in the main navigation

### Requirement 14: Admin Panel — Dashboard Analytics

**User Story:** As a platform owner, I want to see key metrics about my platform, so that I can understand usage and growth.

#### Acceptance Criteria

1. WHEN an admin navigates to the Admin_Panel dashboard, THE Admin_Panel SHALL display the total number of registered users from sw_user_profiles
2. WHEN an admin navigates to the Admin_Panel dashboard, THE Admin_Panel SHALL display the total number of scripts from sw_scripts
3. WHEN an admin navigates to the Admin_Panel dashboard, THE Admin_Panel SHALL display the count of active users who have updated a script within the last 7 days
4. THE Admin_Panel SHALL compute all analytics metrics via Supabase queries executed at page load time

### Requirement 15: Admin Panel — User Management

**User Story:** As a platform owner, I want to view and manage user accounts, so that I can handle support issues and enforce policies.

#### Acceptance Criteria

1. THE Admin_Panel SHALL display a paginated list of all users showing: email, display name, tier, script count, created date, and account status (active or locked)
2. WHEN an admin clicks "Lock" on a user row, THE Admin_Panel SHALL set the user's locked_at column in sw_user_profiles to the current timestamp
3. WHEN an admin clicks "Unlock" on a locked user row, THE Admin_Panel SHALL set the user's locked_at column in sw_user_profiles to null
4. WHILE a user account has a non-null locked_at value, THE Authentication_System SHALL prevent that user from logging in and display a "Your account has been locked" message

### Requirement 16: Admin Panel — Feature Flags

**User Story:** As a platform owner, I want to toggle features on or off globally from the admin panel, so that I can control feature rollout and disable features if needed.

#### Acceptance Criteria

1. THE Admin_Panel SHALL display a list of all feature flags from the sw_feature_flags table with their current enabled/disabled status
2. WHEN an admin toggles a feature flag, THE Admin_Panel SHALL update the is_enabled column in sw_feature_flags
3. THE Feature_Gate_Service SHALL read all feature flags from sw_feature_flags on application load and cache them in a Zustand store
4. WHEN a feature flag is disabled, THE Feature_Gate_Service SHALL render a "Coming Soon" or "Feature Unavailable" placeholder in place of the gated feature component
5. THE sw_feature_flags table SHALL contain a row for each gatable feature: shot_lists, agreements, lighting_diagrams, mood_boards, and stripe_payments

### Requirement 17: Admin Panel — Stripe Payment Toggle

**User Story:** As a platform owner, I want to switch from free beta mode to paid mode via a feature flag, so that I can activate Stripe checkout when ready.

#### Acceptance Criteria

1. WHEN the stripe_payments feature flag is disabled, THE Application SHALL hide all PaywallModal upgrade prompts and treat all users as having full feature access
2. WHEN the stripe_payments feature flag is enabled, THE Application SHALL enforce tier-based gating and display PaywallModal upgrade prompts as defined in the existing requirements
3. WHEN an admin toggles the stripe_payments flag from disabled to enabled, THE Feature_Gate_Service SHALL activate Stripe checkout flows on the next client page load

### Requirement 18: Admin Panel — Blog Content Management

**User Story:** As a platform owner, I want to create and manage blog posts from the admin panel using a rich text editor, so that I can publish content to the Learn Hub without direct database access.

#### Acceptance Criteria

1. THE Admin_Panel SHALL display a list of all blog posts from sw_blog_posts showing: title, category, published status, and created date
2. WHEN an admin clicks "New Post", THE Admin_Panel SHALL display a blog post editor form with fields for: title, slug, category, author, and a TipTap-based WYSIWYG content editor
3. THE Blog_Editor SHALL use the TipTap editor library already installed in the project for rich text editing with support for headings, bold, italic, links, and lists
4. WHEN an admin saves a blog post, THE Admin_Panel SHALL upsert the post to the sw_blog_posts table via the BlogRepository
5. WHEN an admin clicks "Publish" on a draft post, THE Admin_Panel SHALL set the published_at column to the current timestamp
6. WHEN an admin clicks "Unpublish" on a published post, THE Admin_Panel SHALL set the published_at column to null
7. THE Admin_Panel SHALL compute and store the read_time_minutes value based on the content word count (average 200 words per minute)

### Requirement 19: Feature Gating System — Data Model and Client Behavior

**User Story:** As a developer, I want a centralized feature flag system, so that features can be toggled without code deployments.

#### Acceptance Criteria

1. THE Application SHALL store global feature flags in the sw_feature_flags table with columns: id, feature_key, feature_label, is_enabled, and updated_at
2. THE Feature_Gate_Service SHALL fetch all feature flags from sw_feature_flags on application initialization and store them in a Zustand FeatureFlagStore
3. WHEN a feature flag is set to disabled, THE Feature_Gate_Service SHALL replace the gated component with a placeholder displaying "Coming Soon" and a brief description
4. WHEN a feature flag transitions from disabled to enabled, THE Feature_Gate_Service SHALL render the full feature component on the next page navigation or app reload
5. THE Feature_Gate_Service SHALL expose a `isFeatureEnabled(featureKey: string): boolean` method for use by any component or service

### Requirement 20: Supabase Schema — New Tables

**User Story:** As a developer, I want all new database tables clearly defined with RLS policies, so that the data layer for production tools is consistent and secure.

#### Acceptance Criteria

1. THE Application SHALL create the following new tables prefixed with sw_: sw_shot_lists, sw_shot_entries, sw_agreement_templates, sw_agreement_instances, sw_lighting_diagrams, sw_mood_boards, sw_mood_board_images, sw_feature_flags
2. THE Application SHALL enable Row Level Security on all new tables
3. THE Application SHALL create RLS policies so that users can only SELECT, INSERT, UPDATE, and DELETE their own rows in sw_shot_lists, sw_shot_entries, sw_agreement_instances, sw_lighting_diagrams, sw_mood_boards, and sw_mood_board_images (using auth.uid() = user_id)
4. THE Application SHALL create RLS policies on sw_agreement_templates so that all authenticated users can SELECT built-in templates and users can SELECT, INSERT, UPDATE, and DELETE their own custom templates
5. THE Application SHALL create RLS policies on sw_feature_flags so that all authenticated users can SELECT and only admin users can UPDATE
6. THE Application SHALL add a role column (text, default 'user', CHECK IN ('user', 'admin')) and a locked_at column (timestamptz, nullable) to the existing sw_user_profiles table

### Requirement 21: Mobile Responsiveness

**User Story:** As a user, I want all production tool features to work on mobile devices, so that I can access my production data on set from a phone or tablet.

#### Acceptance Criteria

1. THE Application SHALL render all production tool interfaces (Shot_List_Builder, Agreement_Manager, Lighting_Diagram_Tool, Mood_Board, Admin_Panel) responsively at viewport widths from 320px to 1920px
2. WHILE the viewport width is below 768px, THE Shot_List_Builder SHALL display shot entries in a stacked card layout instead of a table layout
3. WHILE the viewport width is below 768px, THE Mood_Board SHALL display images in a single-column grid
4. THE Lighting_Diagram_Tool SHALL support touch input for dragging elements on mobile devices
5. THE Admin_Panel SHALL use a collapsible sidebar navigation on viewports below 1024px

### Requirement 22: Supabase Storage — File Upload Conventions

**User Story:** As a developer, I want consistent file upload patterns across all modules, so that storage is organized and access is controlled.

#### Acceptance Criteria

1. THE Application SHALL use Supabase_Storage for all file uploads with the following bucket prefix conventions: shots/ for shot reference images, agreements/ for uploaded agreement PDFs, signatures/ for signature PNGs, and lighting/ for exported lighting diagram images
2. THE Application SHALL scope all storage paths by user ID (e.g., shots/{userId}/{filename}) to prevent cross-user file access
3. IF a file upload fails due to network error or storage quota, THEN THE Application SHALL display a descriptive error message and retain the user's form state
4. THE Application SHALL validate file types before upload: images (JPEG, PNG, WebP) for shots and mood boards, PDF for agreements, PNG for signatures
