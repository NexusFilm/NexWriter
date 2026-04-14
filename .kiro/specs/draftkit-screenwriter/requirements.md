# Requirements Document

## Introduction

DraftKit is a web-based screenwriting application built with React, TypeScript, and Supabase. It provides a full-featured screenplay editor with industry-standard formatting, an autosave system, export capabilities, and a Story Blueprint add-on for pre-writing story structure work. The app follows a freemium model with free, Writer, and Pro tiers gated via Stripe-based web payments. The backend uses an existing Supabase tenant (Viewfinder) with all tables prefixed `sw_`.

## Glossary

- **Editor**: The core screenplay editing interface where users compose and format screenplay elements
- **Dashboard**: The main landing view after login, displaying the user's scripts as cards
- **ScreenplayElement**: A single line/block in a screenplay, typed as one of the defined ElementTypes
- **ElementType**: One of SCENE_HEADING, ACTION, CHARACTER, DIALOGUE, PARENTHETICAL, TRANSITION, or TITLE_PAGE
- **ScenePanel**: A sidebar listing all scene headings parsed from the current script
- **CharacterTracker**: A sidebar listing all unique character names with appearance counts
- **BeatSheetOverlay**: A reference sidebar showing story structure templates (3-Act, Save the Cat, Hero's Journey)
- **AutosaveManager**: The service responsible for local, cloud, and version snapshot saving
- **ExportManager**: The service responsible for generating PDF, .fdx, and .fountain files from a script
- **PaywallModal**: The modal dialog shown when a free-tier user attempts a gated feature
- **StoryBlueprint**: The pre-writing add-on that guides users through story structure frameworks before drafting
- **SuggestionEngine**: A database-driven (non-AI) system that provides writing prompts, hints, and examples per framework beat
- **Framework**: A story structure model (e.g., 5P Model, Save the Cat) with ordered beats and guidance
- **Beat**: A single story structure point within a framework (e.g., "Catalyst" in Save the Cat)
- **OutlineSession**: A user's in-progress or completed Story Blueprint session tied to a script
- **ScriptRepository**: The service class that handles all Supabase CRUD operations for scripts
- **VersionHistory**: The feature allowing users to view, preview, and restore previous script snapshots
- **LearnHub**: The blog/article section fetching content from sw_blog_posts
- **Tier**: The user's subscription level — Free, Writer ($6.99/mo), or Pro ($13.99/mo)

## Requirements

### Requirement 1: Authentication

**User Story:** As a screenwriter, I want to sign up and log in securely, so that my scripts are tied to my account and accessible across sessions.

#### Acceptance Criteria

1. THE Authentication_System SHALL support email/password registration and login via Supabase Auth
2. THE Authentication_System SHALL support social login (Google, GitHub) via Supabase Auth
3. WHEN a user submits valid credentials, THE Authentication_System SHALL create an authenticated session and redirect the user to the Dashboard
4. WHEN a user submits invalid credentials, THE Authentication_System SHALL display a descriptive error message without revealing whether the email exists
5. WHEN a user clicks "Sign Out", THE Authentication_System SHALL destroy the session and redirect the user to the login screen
6. WHILE a user session is expired or missing, THE Authentication_System SHALL redirect the user to the login screen when any protected route is accessed

### Requirement 2: Dashboard

**User Story:** As a screenwriter, I want to see all my scripts in one place, so that I can quickly find and manage my work.

#### Acceptance Criteria

1. WHEN the user navigates to the Dashboard, THE Dashboard SHALL display all scripts belonging to the authenticated user as cards showing title, page count, and last-saved timestamp
2. WHEN the user opens the context menu on a script card, THE Dashboard SHALL display Rename, Duplicate, and Delete actions
3. WHEN the user selects Rename, THE Dashboard SHALL allow inline editing of the script title and persist the change via ScriptRepository
4. WHEN the user selects Duplicate, THE Dashboard SHALL create a copy of the script with the title appended with " (Copy)" and persist it via ScriptRepository
5. WHEN the user selects Delete, THE Dashboard SHALL prompt for confirmation and, upon confirmation, remove the script via ScriptRepository
6. WHEN the user clicks a script card, THE Dashboard SHALL navigate to the Editor with that script loaded

### Requirement 3: New Script Creation with Free-Tier Limit

**User Story:** As a screenwriter, I want to create new scripts, so that I can start writing new screenplays.

#### Acceptance Criteria

1. THE Dashboard SHALL display a "New Script" button
2. WHEN a free-tier user clicks "New Script" and owns fewer than 3 scripts, THE Dashboard SHALL create a new empty script and navigate to the Editor
3. WHEN a free-tier user clicks "New Script" and owns 3 or more scripts, THE Dashboard SHALL display the PaywallModal instead of creating a script
4. WHEN a Writer-tier or Pro-tier user clicks "New Script", THE Dashboard SHALL create a new empty script without any script count restriction

### Requirement 4: Screenplay Editor — Element Rendering and Formatting

**User Story:** As a screenwriter, I want my screenplay to be formatted according to industry standards automatically, so that I can focus on writing rather than formatting.

#### Acceptance Criteria

1. THE Editor SHALL render each ScreenplayElement according to its ElementType
2. THE Editor SHALL render SCENE_HEADING elements in uppercase, bold text
3. THE Editor SHALL render CHARACTER elements in uppercase, centered text
4. THE Editor SHALL render DIALOGUE elements with left and right indentation
5. THE Editor SHALL render PARENTHETICAL elements indented and wrapped in parentheses
6. THE Editor SHALL render TRANSITION elements in uppercase, right-aligned text
7. THE Editor SHALL render ACTION elements with standard left-aligned formatting
8. THE Editor SHALL render TITLE_PAGE elements centered on a dedicated first page
9. THE Editor SHALL use Courier Prime 12pt as the font for all screenplay text
10. FOR ALL ScreenplayElement arrays, rendering then parsing back to ScreenplayElement arrays SHALL produce an equivalent array (round-trip property)

### Requirement 5: Screenplay Editor — Keyboard Navigation

**User Story:** As a screenwriter, I want smart keyboard shortcuts to cycle element types and auto-advance, so that I can write quickly without reaching for the mouse.

#### Acceptance Criteria

1. WHEN the user presses Tab on a ScreenplayElement, THE Editor SHALL cycle the element type in the order: SCENE_HEADING → ACTION → CHARACTER → DIALOGUE → PARENTHETICAL → TRANSITION → SCENE_HEADING
2. WHEN the user presses Return after a CHARACTER element, THE Editor SHALL create a new DIALOGUE element below
3. WHEN the user presses Return after a DIALOGUE element, THE Editor SHALL create a new CHARACTER element below
4. WHEN the user presses Return on an empty ScreenplayElement, THE Editor SHALL convert the element to ACTION type
5. WHEN the user presses Return after a TRANSITION element, THE Editor SHALL create a new SCENE_HEADING element below
6. WHEN the user presses Return after an ACTION element, THE Editor SHALL create a new ACTION element below

### Requirement 6: Editor Toolbar

**User Story:** As a screenwriter, I want to see my script's title, page count, and save status at a glance, so that I always know the state of my work.

#### Acceptance Criteria

1. THE Editor_Toolbar SHALL display the script title as an editable text field
2. WHEN the user edits the title in the Editor_Toolbar, THE Editor SHALL persist the updated title via ScriptRepository
3. THE Editor_Toolbar SHALL display a live page count derived from the current script content
4. THE Editor_Toolbar SHALL display a save status indicator showing one of: "Saved", "Saving…", or "Unsaved changes"
5. THE Editor_Toolbar SHALL display a toggle button for the side panel (ScenePanel, CharacterTracker, BeatSheetOverlay)

### Requirement 7: Autosave System

**User Story:** As a screenwriter, I want my work saved automatically at multiple levels, so that I never lose progress.

#### Acceptance Criteria

1. WHEN the user makes an edit, THE AutosaveManager SHALL save the script to localStorage after a 1500ms debounce period (Layer 1)
2. WHILE the user has an active editing session, THE AutosaveManager SHALL sync the script to Supabase every 45 seconds (Layer 2) for Writer-tier and Pro-tier users
3. WHILE the user has been actively editing for 10 minutes since the last snapshot, THE AutosaveManager SHALL create a version snapshot in sw_script_versions (Layer 3)
4. WHEN the Editor loads a script, THE AutosaveManager SHALL compare the localStorage draft timestamp with the cloud version timestamp and restore whichever is newer
5. WHILE the user is on the free tier, THE AutosaveManager SHALL perform Layer 1 (local) saves only and skip cloud sync
6. FOR ALL script content, saving to localStorage then reading back SHALL produce content equivalent to the original (round-trip property)

### Requirement 8: Scene Panel

**User Story:** As a screenwriter, I want to see a list of all my scenes, so that I can navigate my script structure quickly.

#### Acceptance Criteria

1. THE ScenePanel SHALL parse all SCENE_HEADING elements from the current script and display them as an ordered list with scene index numbers
2. WHEN the user clicks a scene entry in the ScenePanel, THE Editor SHALL scroll to the corresponding SCENE_HEADING element
3. WHEN the user adds, removes, or edits a SCENE_HEADING element, THE ScenePanel SHALL update the scene list within 500ms

### Requirement 9: Character Tracker

**User Story:** As a screenwriter, I want to see all characters and how often they appear, so that I can track character usage across my script.

#### Acceptance Criteria

1. THE CharacterTracker SHALL parse all CHARACTER elements from the current script, deduplicate by name, and display each unique character with an appearance count
2. WHEN the user clicks a character entry in the CharacterTracker, THE Editor SHALL scroll to the first occurrence of that CHARACTER element
3. WHEN the user adds, removes, or edits a CHARACTER element, THE CharacterTracker SHALL update the character list within 500ms

### Requirement 10: Beat Sheet Overlay

**User Story:** As a screenwriter, I want a reference sidebar with story structure templates, so that I can keep my narrative on track while writing.

#### Acceptance Criteria

1. THE BeatSheetOverlay SHALL display beat sheet templates for 3-Act Structure, Save the Cat, and Hero's Journey
2. WHILE the user is on the free tier, THE BeatSheetOverlay SHALL display only the 3-Act Structure template and show a lock icon on other templates
3. WHEN a free-tier user selects a locked beat sheet template, THE BeatSheetOverlay SHALL display the PaywallModal
4. WHEN the user selects an available beat sheet template, THE BeatSheetOverlay SHALL display the ordered list of beats with descriptions

### Requirement 11: Version History

**User Story:** As a screenwriter, I want to view and restore previous versions of my script, so that I can recover earlier work if needed.

#### Acceptance Criteria

1. THE VersionHistory SHALL display a list of saved version snapshots for the current script, ordered by creation date descending
2. WHEN the user selects a version entry, THE VersionHistory SHALL display a read-only preview of that version's content
3. WHEN the user clicks "Restore" on a version entry, THE VersionHistory SHALL replace the current script content with the selected version's content and persist the change via ScriptRepository
4. WHILE the user is on the free tier, THE VersionHistory SHALL display a maximum of 5 versions and show the PaywallModal if the user attempts to access older versions
5. WHILE the user is on the Writer or Pro tier, THE VersionHistory SHALL display all available versions without restriction

### Requirement 12: Export

**User Story:** As a screenwriter, I want to export my script in industry-standard formats, so that I can share and submit my work professionally.

#### Acceptance Criteria

1. THE ExportManager SHALL generate a PDF file from the current script using Courier Prime 12pt, standard screenplay margins (1.5" left, 1" top/right/bottom), page numbers in the top-right corner, and a title page
2. THE ExportManager SHALL make PDF export available to all tiers
3. WHEN a free-tier user requests .fdx or .fountain export, THE ExportManager SHALL display the PaywallModal
4. WHEN a Writer-tier or Pro-tier user requests .fdx export, THE ExportManager SHALL generate a valid Final Draft XML (.fdx) file from the current script
5. WHEN a Writer-tier or Pro-tier user requests .fountain export, THE ExportManager SHALL generate a valid Fountain markup (.fountain) file from the current script
6. FOR ALL scripts, exporting to .fountain format then parsing the .fountain file back SHALL produce a ScreenplayElement array equivalent to the original (round-trip property)
7. FOR ALL scripts, exporting to .fdx format then parsing the .fdx file back SHALL produce a ScreenplayElement array equivalent to the original (round-trip property)

### Requirement 13: Learn/Blog Hub

**User Story:** As a screenwriter, I want to read articles about the craft, so that I can improve my writing skills.

#### Acceptance Criteria

1. THE LearnHub SHALL fetch and display blog posts from the sw_blog_posts table
2. THE LearnHub SHALL provide category filter controls to narrow displayed posts
3. WHEN the user selects a blog post, THE LearnHub SHALL navigate to an article detail view showing the full content, author, published date, and estimated read time
4. WHILE the user is on the free tier, THE LearnHub SHALL display advertisements in designated ad slots
5. WHILE the user is on the Writer or Pro tier, THE LearnHub SHALL hide all advertisements

### Requirement 14: Paywall

**User Story:** As a product owner, I want free users to see a clear upgrade path when they hit a gated feature, so that they understand the value of upgrading.

#### Acceptance Criteria

1. WHEN a free-tier user triggers a gated feature, THE PaywallModal SHALL display a comparison of Free, Writer, and Pro tiers with feature lists and pricing ($6.99/mo Writer, $13.99/mo Pro)
2. WHEN the user selects a paid tier in the PaywallModal, THE PaywallModal SHALL initiate a Stripe checkout session for the selected tier
3. WHEN the Stripe checkout completes successfully, THE PaywallModal SHALL update the user's tier in Supabase and unlock the gated features immediately
4. IF the Stripe checkout fails or is cancelled, THEN THE PaywallModal SHALL display an error message and keep the user on the free tier


### Requirement 15: Story Blueprint — Framework Selection

**User Story:** As a screenwriter, I want to choose a story structure framework before I start writing, so that I have a solid narrative foundation.

#### Acceptance Criteria

1. WHEN the user creates a new script and selects "Story Blueprint", THE StoryBlueprint SHALL display a framework selection screen listing: 5P Model, Save the Cat (15 beats), Dan Harmon Story Circle (8 steps), Hero's Journey (12 stages), 3-Act Structure, and 7-Point Story Structure
2. THE StoryBlueprint SHALL present the 5P Model as the default/signature framework with a "Recommended" badge
3. WHEN the user selects a framework, THE StoryBlueprint SHALL display a brief explanation of the framework and its beat list before proceeding
4. Each framework definition in sw_frameworks SHALL include: name, description, ordered beat list, and beat count

### Requirement 16: Story Blueprint — Genre and Tone Configuration

**User Story:** As a screenwriter, I want to specify my genre, format, and tone, so that the guided outline provides relevant suggestions.

#### Acceptance Criteria

1. WHEN the user has selected a framework, THE StoryBlueprint SHALL prompt the user to select a genre (e.g., Drama, Comedy, Thriller, Horror, Sci-Fi, Romance, Action), format (Feature, Short, Pilot), and tone (e.g., Dark, Light, Satirical, Grounded)
2. THE StoryBlueprint SHALL store the selected genre, format, and tone in the sw_outline_sessions table
3. THE SuggestionEngine SHALL use the selected genre, format, and tone to filter prompts and examples from sw_beat_prompts and sw_beat_examples

### Requirement 17: Story Blueprint — Guided Outline Wizard

**User Story:** As a screenwriter, I want to be guided through each story beat with prompts and examples, so that I can build a complete outline step by step.

#### Acceptance Criteria

1. THE StoryBlueprint SHALL present each beat of the selected framework sequentially as a wizard step
2. For each beat, THE StoryBlueprint SHALL display: the beat name, an explanation, guidance prompts, optional page range targets, genre-sensitive hints, and educational tooltips
3. THE SuggestionEngine SHALL retrieve guidance prompts from sw_beat_prompts filtered by framework, beat, genre, and story type
4. THE SuggestionEngine SHALL retrieve example hints from sw_beat_examples filtered by framework, beat, and genre
5. WHEN the user completes a beat step, THE StoryBlueprint SHALL save the user's answer to sw_outline_answers
6. WHEN the user completes all beats, THE StoryBlueprint SHALL generate a story summary, beat list, scene blueprints, and an editor scaffold from the collected answers

### Requirement 18: Story Blueprint — 5P Model Framework

**User Story:** As a screenwriter, I want to use the 5P Model to develop my story's core elements, so that I have a structured approach to character and plot.

#### Acceptance Criteria

1. THE StoryBlueprint SHALL implement the 5P Model with five sections: Person, Problem, Plan, Pivot, and Payoff
2. THE Person section SHALL prompt for: protagonist name, flaw, wound, desire, stakes, voice, and world
3. THE Problem section SHALL prompt for: central conflict, opposition, and urgency
4. THE Plan section SHALL prompt for: character's strategy and early actions
5. THE Pivot section SHALL prompt for: midpoint turn, revelation, and identity shift
6. THE Payoff section SHALL prompt for: climax, transformation, and resolution

### Requirement 19: Story Blueprint — Editor Integration

**User Story:** As a screenwriter, I want my completed blueprint to pre-populate the editor, so that I can start drafting with structure already in place.

#### Acceptance Criteria

1. WHEN the user completes a Story Blueprint session, THE Editor SHALL be pre-populated with beat markers as SCENE_HEADING elements at appropriate positions
2. THE Editor SHALL insert act break markers, scene placeholders, character goal reminders, and theme reminders derived from the blueprint answers
3. THE Editor SHALL display blueprint annotations (beat markers, reminders) as toggleable overlays that the user can show or hide
4. WHEN the user toggles blueprint annotations off, THE Editor SHALL hide all beat markers, reminders, and placeholders without removing them from the data model

### Requirement 20: Story Blueprint — Suggestion Engine

**User Story:** As a screenwriter, I want relevant writing prompts and examples without requiring AI, so that I get helpful guidance powered by curated content.

#### Acceptance Criteria

1. THE SuggestionEngine SHALL retrieve all suggestions from the Supabase tables sw_beat_prompts and sw_beat_examples without calling any external AI or LLM service
2. WHEN the user is on a specific beat step, THE SuggestionEngine SHALL query sw_beat_prompts with the current framework ID, beat ID, genre, and story type as filters
3. WHEN no exact match is found for the genre and story type combination, THE SuggestionEngine SHALL fall back to prompts matching only the framework and beat
4. THE SuggestionEngine SHALL return prompts, guided questions, and example hints as structured data to the StoryBlueprint wizard

### Requirement 21: Supabase Schema and Data Access

**User Story:** As a developer, I want all database tables and access patterns clearly defined, so that the data layer is consistent and maintainable.

#### Acceptance Criteria

1. THE ScriptRepository SHALL perform all Supabase operations on tables prefixed with `sw_` (sw_scripts, sw_script_versions, sw_blog_posts, sw_characters, sw_frameworks, sw_framework_beats, sw_beat_prompts, sw_beat_examples, sw_outline_sessions, sw_outline_answers, sw_scene_blueprints, sw_story_tags)
2. THE ScriptRepository SHALL store the Supabase URL and anon key in environment variables, not hardcoded in source
3. THE ScriptRepository SHALL use async/await for all Supabase calls
4. THE ScriptRepository SHALL implement shared error handling that surfaces descriptive error messages to the UI layer
5. THE Application SHALL place no business logic in view (React) components; all logic SHALL reside in service or repository classes

### Requirement 22: Design System

**User Story:** As a user, I want a consistent, visually cohesive dark-mode interface, so that the app feels polished and comfortable for long writing sessions.

#### Acceptance Criteria

1. THE Application SHALL use a dark-mode-only theme for v1
2. THE Application SHALL use the following color tokens: Editor background #0D0D0D, Dashboard background #111111, Surface #1A1A1A, Border #2A2A2A, Accent #E8A427, Text Primary #F0EDE6, Text Secondary #7A7A7A
3. THE Editor SHALL use Courier Prime 12pt for all screenplay text
4. THE Application SHALL use the system sans-serif font stack for all non-screenplay UI text
5. THE Application SHALL use a corner radius of 10px for all rounded UI elements
