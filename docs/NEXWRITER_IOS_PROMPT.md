# NexWriter iOS App — Xcode/Swift Build Prompt

## Overview

Build the iOS native companion app for NexWriter, a professional screenwriting and film production platform. The iOS app shares the same Supabase backend as the web version, ensuring scripts and data sync across devices.

## Backend (SHARED — do not recreate)

- **Supabase project**: `ozzjcuamqslxjcfgtfhj` (aiedu)
- **URL**: `https://ozzjcuamqslxjcfgtfhj.supabase.co`
- **All tables prefixed with `sw_`**: sw_scripts, sw_script_versions, sw_user_profiles, sw_blog_posts, sw_frameworks, sw_framework_beats, sw_beat_prompts, sw_beat_examples, sw_outline_sessions, sw_outline_answers, sw_scene_blueprints, sw_story_tags
- **Auth**: Supabase Auth with Google OAuth (client ID: `143418015838-vptc6hn5aj9k6ajjee2ncsskm97j8t5v.apps.googleusercontent.com`)
- **RLS policies**: Already configured per-user access on all tables
- **Stripe**: Writer ($6.99/mo), Pro ($13.99/mo) via Supabase Edge Function webhook

## Tech Stack for iOS

- **Language**: Swift 5.9+
- **UI Framework**: SwiftUI
- **Minimum iOS**: 17.0
- **Backend SDK**: supabase-swift (official Supabase Swift client)
- **Rich Text**: Custom attributed string editor or TextKit 2 for screenplay formatting
- **State Management**: @Observable / @Environment pattern
- **Payments**: StoreKit 2 for in-app subscriptions (mirror the web Stripe tiers)

## Core Features to Implement

### 1. Authentication
- Google Sign-In via Supabase Auth (ASWebAuthenticationSession)
- Email/password sign-up and sign-in
- Session persistence with Keychain storage
- Auto-refresh tokens

### 2. Dashboard
- Grid/list view of user's scripts from sw_scripts
- Create new script, rename, duplicate, delete
- Pull-to-refresh
- Free tier: max 3 scripts

### 3. Screenplay Editor
- Custom rich text editor with screenplay formatting:
  - SCENE_HEADING: uppercase, bold
  - ACTION: left-aligned
  - CHARACTER: uppercase, centered
  - DIALOGUE: indented
  - PARENTHETICAL: indented, italic
  - TRANSITION: uppercase, right-aligned
- Element type picker (toolbar above keyboard)
- Autocomplete system (same dictionary as web: INT./EXT., locations, times, character names, transitions)
- Tab to accept autocomplete
- Courier Prime font at 12pt
- Autosave: local (Core Data/UserDefaults) + cloud (Supabase upsert every 45s)

### 4. Export
- PDF export using UIGraphicsPDFRenderer with screenplay layout
- Share sheet for PDF, FDX, Fountain formats
- Tier-gated: FDX/Fountain require Writer/Pro

### 5. Side Panels
- Scene navigator (parsed from SCENE_HEADING elements)
- Character tracker (parsed from CHARACTER elements)
- Beat sheet overlay (3-Act free, others paid)

### 6. Version History
- List versions from sw_script_versions
- Preview and restore
- Free tier: 5 versions max

### 7. Story Blueprint
- Framework selection (5P Model, Save the Cat, etc.)
- Genre/tone configuration
- Beat-by-beat wizard with prompts from sw_beat_prompts
- Generate editor scaffold

### 8. Learn Hub
- Blog posts from sw_blog_posts
- Category filtering
- Ad slots for free tier

### 9. Settings
- Current tier display
- Subscription management (StoreKit 2)
- Sign out

### 10. Paywall
- Feature comparison table (same as web)
- StoreKit 2 subscription flow
- Sync tier to sw_user_profiles after purchase

## Data Models (match web exactly)

```swift
struct Script: Codable, Identifiable {
    let id: UUID
    let userId: UUID
    var title: String
    var elements: [ScreenplayElement]
    var pageCount: Int
    let createdAt: Date
    var updatedAt: Date
}

struct ScreenplayElement: Codable, Identifiable {
    let id: String
    var type: ElementType
    var text: String
    var order: Int
}

enum ElementType: String, Codable {
    case sceneHeading = "SCENE_HEADING"
    case action = "ACTION"
    case character = "CHARACTER"
    case dialogue = "DIALOGUE"
    case parenthetical = "PARENTHETICAL"
    case transition = "TRANSITION"
    case titlePage = "TITLE_PAGE"
}

struct ScriptVersion: Codable, Identifiable {
    let id: UUID
    let scriptId: UUID
    let elements: [ScreenplayElement]
    let createdAt: Date
}
```

## Supabase Swift Setup

```swift
import Supabase

let supabase = SupabaseClient(
    supabaseURL: URL(string: "https://ozzjcuamqslxjcfgtfhj.supabase.co")!,
    supabaseKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
)
```

## Google OAuth for iOS

Configure in Supabase Dashboard:
- Add iOS bundle ID to Google OAuth redirect URIs
- Use ASWebAuthenticationSession for the OAuth flow
- Redirect URI: `com.nexusmobiletech.nexwriter://callback`

## Design Guidelines

- Dark mode only (matching web: #0D0D0D editor bg, #1A1A1A surface, #E8A427 accent)
- Courier Prime font for screenplay text
- System sans-serif for UI
- Nostalgic typewriter aesthetic with modern interactions
- Clean SVG-style SF Symbols for icons (no emojis)
- 10px corner radius on cards/buttons

## Future Production Features (Phase 2)

These features should be planned for but not built in v1:
- Script Breakdown (tagging elements: cast, props, wardrobe, etc.)
- Shot Lists
- Storyboards
- Call Sheets
- Production Calendars
- Scheduling
- Script sharing and collaboration (read-only and edit permissions)
- Real-time collaboration via Supabase Realtime
- CRM for cast/crew contacts
