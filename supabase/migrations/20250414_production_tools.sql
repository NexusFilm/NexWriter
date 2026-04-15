-- ============================================================
-- Production Tools Expansion — Schema Migration
-- New sw_ tables, ALTER statements, RLS policies, seed data
-- ============================================================

-- ============================================================
-- 1. ALTER sw_user_profiles — add role and locked_at columns
-- ============================================================
ALTER TABLE sw_user_profiles
  ADD COLUMN role text NOT NULL DEFAULT 'user'
    CHECK (role IN ('user', 'admin'));

ALTER TABLE sw_user_profiles
  ADD COLUMN locked_at timestamptz;

-- ============================================================
-- 2. sw_shot_lists
-- ============================================================
CREATE TABLE sw_shot_lists (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid        NOT NULL REFERENCES sw_user_profiles(id) ON DELETE CASCADE,
  script_id     uuid        REFERENCES sw_scripts(id) ON DELETE SET NULL,
  scene_heading text,
  title         text        NOT NULL DEFAULT 'Untitled Shot List',
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE sw_shot_lists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can select own shot lists"
  ON sw_shot_lists FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own shot lists"
  ON sw_shot_lists FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own shot lists"
  ON sw_shot_lists FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own shot lists"
  ON sw_shot_lists FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- 3. sw_shot_entries
-- ============================================================
CREATE TABLE sw_shot_entries (
  id                   uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  shot_list_id         uuid        NOT NULL REFERENCES sw_shot_lists(id) ON DELETE CASCADE,
  shot_number          int         NOT NULL,
  shot_type            text        NOT NULL
                                   CHECK (shot_type IN (
                                     'wide','medium','close-up','extreme-close-up',
                                     'over-the-shoulder','pov','insert','establishing',
                                     'two-shot','aerial'
                                   )),
  description          text        NOT NULL DEFAULT '',
  camera_angle         text        NOT NULL DEFAULT '',
  camera_movement      text        NOT NULL DEFAULT '',
  lens                 text        NOT NULL DEFAULT '',
  camera_designation   text        NOT NULL DEFAULT '',
  notes                text        NOT NULL DEFAULT '',
  reference_image_path text,
  shot_order           int         NOT NULL,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE sw_shot_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can select own shot entries"
  ON sw_shot_entries FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM sw_shot_lists
      WHERE sw_shot_lists.id = sw_shot_entries.shot_list_id
        AND sw_shot_lists.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own shot entries"
  ON sw_shot_entries FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sw_shot_lists
      WHERE sw_shot_lists.id = sw_shot_entries.shot_list_id
        AND sw_shot_lists.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own shot entries"
  ON sw_shot_entries FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM sw_shot_lists
      WHERE sw_shot_lists.id = sw_shot_entries.shot_list_id
        AND sw_shot_lists.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sw_shot_lists
      WHERE sw_shot_lists.id = sw_shot_entries.shot_list_id
        AND sw_shot_lists.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own shot entries"
  ON sw_shot_entries FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM sw_shot_lists
      WHERE sw_shot_lists.id = sw_shot_entries.shot_list_id
        AND sw_shot_lists.user_id = auth.uid()
    )
  );

-- ============================================================
-- 4. sw_agreement_templates
-- ============================================================
CREATE TABLE sw_agreement_templates (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid        REFERENCES sw_user_profiles(id) ON DELETE CASCADE,
  template_type text        NOT NULL
                            CHECK (template_type IN (
                              'model_release','location_release','crew_deal_memo','custom'
                            )),
  name          text        NOT NULL,
  fields        jsonb       NOT NULL DEFAULT '[]'::jsonb,
  storage_path  text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE sw_agreement_templates ENABLE ROW LEVEL SECURITY;

-- All authenticated users can SELECT built-in templates (user_id IS NULL)
CREATE POLICY "Authenticated users can select built-in templates"
  ON sw_agreement_templates FOR SELECT
  USING (auth.role() = 'authenticated' AND user_id IS NULL);

-- Users can SELECT their own custom templates
CREATE POLICY "Users can select own custom templates"
  ON sw_agreement_templates FOR SELECT
  USING (auth.uid() = user_id);

-- Users can INSERT their own custom templates
CREATE POLICY "Users can insert own templates"
  ON sw_agreement_templates FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can UPDATE their own custom templates
CREATE POLICY "Users can update own templates"
  ON sw_agreement_templates FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can DELETE their own custom templates
CREATE POLICY "Users can delete own templates"
  ON sw_agreement_templates FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- 5. sw_agreement_instances
-- ============================================================
CREATE TABLE sw_agreement_instances (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid        NOT NULL REFERENCES sw_user_profiles(id) ON DELETE CASCADE,
  template_id    uuid        NOT NULL REFERENCES sw_agreement_templates(id),
  field_values   jsonb       NOT NULL DEFAULT '{}'::jsonb,
  signature_path text,
  status         text        NOT NULL DEFAULT 'draft'
                             CHECK (status IN ('draft', 'signed')),
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE sw_agreement_instances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can select own agreement instances"
  ON sw_agreement_instances FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own agreement instances"
  ON sw_agreement_instances FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own agreement instances"
  ON sw_agreement_instances FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own agreement instances"
  ON sw_agreement_instances FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- 6. sw_lighting_diagrams
-- ============================================================
CREATE TABLE sw_lighting_diagrams (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid        NOT NULL REFERENCES sw_user_profiles(id) ON DELETE CASCADE,
  script_id     uuid        NOT NULL REFERENCES sw_scripts(id) ON DELETE CASCADE,
  scene_index   int         NOT NULL,
  scene_heading text        NOT NULL,
  elements      jsonb       NOT NULL DEFAULT '[]'::jsonb,
  canvas_width  int         NOT NULL DEFAULT 800,
  canvas_height int         NOT NULL DEFAULT 600,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, script_id, scene_index)
);

ALTER TABLE sw_lighting_diagrams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can select own lighting diagrams"
  ON sw_lighting_diagrams FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own lighting diagrams"
  ON sw_lighting_diagrams FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own lighting diagrams"
  ON sw_lighting_diagrams FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own lighting diagrams"
  ON sw_lighting_diagrams FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- 7. sw_mood_boards
-- ============================================================
CREATE TABLE sw_mood_boards (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        NOT NULL REFERENCES sw_user_profiles(id) ON DELETE CASCADE,
  script_id  uuid        REFERENCES sw_scripts(id) ON DELETE SET NULL,
  name       text        NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE sw_mood_boards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can select own mood boards"
  ON sw_mood_boards FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own mood boards"
  ON sw_mood_boards FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own mood boards"
  ON sw_mood_boards FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own mood boards"
  ON sw_mood_boards FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- 8. sw_mood_board_images
-- ============================================================
CREATE TABLE sw_mood_board_images (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  mood_board_id  uuid        NOT NULL REFERENCES sw_mood_boards(id) ON DELETE CASCADE,
  tmdb_image_path text       NOT NULL,
  tmdb_movie_id  int         NOT NULL,
  note           text        NOT NULL DEFAULT '',
  tags           text        NOT NULL DEFAULT '',
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE sw_mood_board_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can select own mood board images"
  ON sw_mood_board_images FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM sw_mood_boards
      WHERE sw_mood_boards.id = sw_mood_board_images.mood_board_id
        AND sw_mood_boards.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own mood board images"
  ON sw_mood_board_images FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sw_mood_boards
      WHERE sw_mood_boards.id = sw_mood_board_images.mood_board_id
        AND sw_mood_boards.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own mood board images"
  ON sw_mood_board_images FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM sw_mood_boards
      WHERE sw_mood_boards.id = sw_mood_board_images.mood_board_id
        AND sw_mood_boards.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sw_mood_boards
      WHERE sw_mood_boards.id = sw_mood_board_images.mood_board_id
        AND sw_mood_boards.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own mood board images"
  ON sw_mood_board_images FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM sw_mood_boards
      WHERE sw_mood_boards.id = sw_mood_board_images.mood_board_id
        AND sw_mood_boards.user_id = auth.uid()
    )
  );

-- ============================================================
-- 9. sw_feature_flags
-- ============================================================
CREATE TABLE sw_feature_flags (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_key text        NOT NULL UNIQUE,
  feature_label text      NOT NULL,
  is_enabled  boolean     NOT NULL DEFAULT false,
  updated_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE sw_feature_flags ENABLE ROW LEVEL SECURITY;

-- All authenticated users can SELECT feature flags
CREATE POLICY "Authenticated users can select feature flags"
  ON sw_feature_flags FOR SELECT
  USING (auth.role() = 'authenticated');

-- Only admin users can UPDATE feature flags
CREATE POLICY "Admins can update feature flags"
  ON sw_feature_flags FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM sw_user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================
-- 10. ALTER sw_blog_posts — add admin write RLS policies
-- ============================================================
CREATE POLICY "Admins can insert blog posts"
  ON sw_blog_posts FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sw_user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update blog posts"
  ON sw_blog_posts FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM sw_user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete blog posts"
  ON sw_blog_posts FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM sw_user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================
-- 11. Seed sw_feature_flags with initial rows
-- ============================================================
INSERT INTO sw_feature_flags (feature_key, feature_label, is_enabled) VALUES
  ('shot_lists', 'Shot List Builder', true),
  ('agreements', 'Agreement Manager', true),
  ('lighting_diagrams', 'Lighting Diagram Tool', true),
  ('mood_boards', 'Mood Board', true),
  ('stripe_payments', 'Stripe Payments', false);

-- ============================================================
-- 12. Seed sw_agreement_templates with built-in templates
-- ============================================================
INSERT INTO sw_agreement_templates (user_id, template_type, name, fields) VALUES
  (
    NULL,
    'model_release',
    'Model Release',
    '[
      {"key": "model_name", "label": "Model Name", "type": "text", "required": true},
      {"key": "production_title", "label": "Production Title", "type": "text", "required": true},
      {"key": "producer_name", "label": "Producer Name", "type": "text", "required": true},
      {"key": "date", "label": "Date", "type": "date", "required": true},
      {"key": "usage_rights", "label": "Usage Rights", "type": "textarea", "required": true},
      {"key": "compensation_terms", "label": "Compensation Terms", "type": "textarea", "required": true}
    ]'::jsonb
  ),
  (
    NULL,
    'location_release',
    'Location Release',
    '[
      {"key": "location_owner_name", "label": "Location Owner Name", "type": "text", "required": true},
      {"key": "location_address", "label": "Location Address", "type": "text", "required": true},
      {"key": "production_title", "label": "Production Title", "type": "text", "required": true},
      {"key": "date_range_start", "label": "Start Date", "type": "date", "required": true},
      {"key": "date_range_end", "label": "End Date", "type": "date", "required": true},
      {"key": "access_terms", "label": "Access Terms", "type": "textarea", "required": true}
    ]'::jsonb
  ),
  (
    NULL,
    'crew_deal_memo',
    'Crew Deal Memo',
    '[
      {"key": "crew_member_name", "label": "Crew Member Name", "type": "text", "required": true},
      {"key": "role", "label": "Role", "type": "text", "required": true},
      {"key": "production_title", "label": "Production Title", "type": "text", "required": true},
      {"key": "start_date", "label": "Start Date", "type": "date", "required": true},
      {"key": "end_date", "label": "End Date", "type": "date", "required": true},
      {"key": "rate", "label": "Rate", "type": "text", "required": true},
      {"key": "payment_terms", "label": "Payment Terms", "type": "textarea", "required": true}
    ]'::jsonb
  );
