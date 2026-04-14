-- ============================================================
-- DraftKit Screenwriter — Initial Schema Migration
-- All tables prefixed with sw_ (shared Viewfinder tenant)
-- ============================================================

-- ============================================================
-- 1. sw_user_profiles
-- ============================================================
CREATE TABLE sw_user_profiles (
  id            uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email         text        NOT NULL,
  display_name  text,
  tier          text        NOT NULL DEFAULT 'free'
                            CHECK (tier IN ('free', 'writer', 'pro')),
  stripe_customer_id text   UNIQUE,
  script_count  int         NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE sw_user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON sw_user_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON sw_user_profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- INSERT is handled by the auth hook trigger (no direct client inserts)

-- ============================================================
-- 2. sw_scripts
-- ============================================================
CREATE TABLE sw_scripts (
  id                    uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               uuid        NOT NULL REFERENCES sw_user_profiles(id) ON DELETE CASCADE,
  title                 text        NOT NULL DEFAULT 'Untitled Script',
  elements              jsonb       NOT NULL DEFAULT '[]'::jsonb,
  page_count            int         NOT NULL DEFAULT 0,
  blueprint_session_id  uuid,
  show_annotations      boolean     NOT NULL DEFAULT true,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE sw_scripts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own scripts"
  ON sw_scripts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own scripts"
  ON sw_scripts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own scripts"
  ON sw_scripts FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own scripts"
  ON sw_scripts FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- 3. sw_script_versions
-- ============================================================
CREATE TABLE sw_script_versions (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  script_id   uuid        NOT NULL REFERENCES sw_scripts(id) ON DELETE CASCADE,
  elements    jsonb       NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE sw_script_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view versions of own scripts"
  ON sw_script_versions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM sw_scripts
      WHERE sw_scripts.id = sw_script_versions.script_id
        AND sw_scripts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert versions for own scripts"
  ON sw_script_versions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sw_scripts
      WHERE sw_scripts.id = sw_script_versions.script_id
        AND sw_scripts.user_id = auth.uid()
    )
  );

-- No DELETE policy — versions are immutable snapshots

-- ============================================================
-- 4. sw_blog_posts
-- ============================================================
CREATE TABLE sw_blog_posts (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  title             text        NOT NULL,
  slug              text        NOT NULL UNIQUE,
  content           text        NOT NULL,
  author            text        NOT NULL,
  category          text        NOT NULL,
  published_at      timestamptz,
  read_time_minutes int,
  created_at        timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE sw_blog_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view published posts"
  ON sw_blog_posts FOR SELECT
  USING (auth.role() = 'authenticated' AND published_at IS NOT NULL);

-- No INSERT/UPDATE/DELETE from client

-- ============================================================
-- 5. sw_frameworks
-- ============================================================
CREATE TABLE sw_frameworks (
  id          uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text    NOT NULL UNIQUE,
  description text    NOT NULL,
  beat_count  int     NOT NULL,
  sort_order  int     NOT NULL,
  is_default  boolean NOT NULL DEFAULT false
);

ALTER TABLE sw_frameworks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view frameworks"
  ON sw_frameworks FOR SELECT
  USING (auth.role() = 'authenticated');

-- No client mutations

-- ============================================================
-- 6. sw_framework_beats
-- ============================================================
CREATE TABLE sw_framework_beats (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  framework_id     uuid NOT NULL REFERENCES sw_frameworks(id) ON DELETE CASCADE,
  name             text NOT NULL,
  description      text NOT NULL,
  beat_order        int  NOT NULL,
  page_range_start int,
  page_range_end   int
);

ALTER TABLE sw_framework_beats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view framework beats"
  ON sw_framework_beats FOR SELECT
  USING (auth.role() = 'authenticated');

-- No client mutations

-- ============================================================
-- 7. sw_beat_prompts
-- ============================================================
CREATE TABLE sw_beat_prompts (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  framework_id  uuid NOT NULL REFERENCES sw_frameworks(id) ON DELETE CASCADE,
  beat_id       uuid NOT NULL REFERENCES sw_framework_beats(id) ON DELETE CASCADE,
  genre         text,
  story_type    text,
  prompt_text   text NOT NULL,
  sort_order    int  NOT NULL DEFAULT 0
);

ALTER TABLE sw_beat_prompts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view beat prompts"
  ON sw_beat_prompts FOR SELECT
  USING (auth.role() = 'authenticated');

-- No client mutations

-- ============================================================
-- 8. sw_beat_examples
-- ============================================================
CREATE TABLE sw_beat_examples (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  framework_id  uuid NOT NULL REFERENCES sw_frameworks(id) ON DELETE CASCADE,
  beat_id       uuid NOT NULL REFERENCES sw_framework_beats(id) ON DELETE CASCADE,
  genre         text,
  example_text  text NOT NULL,
  source_title  text,
  sort_order    int  NOT NULL DEFAULT 0
);

ALTER TABLE sw_beat_examples ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view beat examples"
  ON sw_beat_examples FOR SELECT
  USING (auth.role() = 'authenticated');

-- No client mutations

-- ============================================================
-- 9. sw_outline_sessions
-- ============================================================
CREATE TABLE sw_outline_sessions (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid        NOT NULL REFERENCES sw_user_profiles(id) ON DELETE CASCADE,
  framework_id  uuid        NOT NULL REFERENCES sw_frameworks(id),
  genre         text        NOT NULL,
  format        text        NOT NULL,
  tone          text        NOT NULL,
  status        text        NOT NULL DEFAULT 'in_progress'
                            CHECK (status IN ('in_progress', 'completed')),
  created_at    timestamptz NOT NULL DEFAULT now(),
  completed_at  timestamptz
);

ALTER TABLE sw_outline_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sessions"
  ON sw_outline_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions"
  ON sw_outline_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions"
  ON sw_outline_sessions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- 10. sw_outline_answers
-- ============================================================
CREATE TABLE sw_outline_answers (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id  uuid        NOT NULL REFERENCES sw_outline_sessions(id) ON DELETE CASCADE,
  beat_id     uuid        NOT NULL REFERENCES sw_framework_beats(id),
  answer_text text        NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE sw_outline_answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view answers for own sessions"
  ON sw_outline_answers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM sw_outline_sessions
      WHERE sw_outline_sessions.id = sw_outline_answers.session_id
        AND sw_outline_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert answers for own sessions"
  ON sw_outline_answers FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sw_outline_sessions
      WHERE sw_outline_sessions.id = sw_outline_answers.session_id
        AND sw_outline_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update answers for own sessions"
  ON sw_outline_answers FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM sw_outline_sessions
      WHERE sw_outline_sessions.id = sw_outline_answers.session_id
        AND sw_outline_sessions.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sw_outline_sessions
      WHERE sw_outline_sessions.id = sw_outline_answers.session_id
        AND sw_outline_sessions.user_id = auth.uid()
    )
  );

-- ============================================================
-- 11. sw_scene_blueprints
-- ============================================================
CREATE TABLE sw_scene_blueprints (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id   uuid NOT NULL REFERENCES sw_outline_sessions(id) ON DELETE CASCADE,
  scene_order  int  NOT NULL,
  heading      text NOT NULL,
  beat_id      uuid REFERENCES sw_framework_beats(id),
  notes        text
);

ALTER TABLE sw_scene_blueprints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view blueprints for own sessions"
  ON sw_scene_blueprints FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM sw_outline_sessions
      WHERE sw_outline_sessions.id = sw_scene_blueprints.session_id
        AND sw_outline_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert blueprints for own sessions"
  ON sw_scene_blueprints FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sw_outline_sessions
      WHERE sw_outline_sessions.id = sw_scene_blueprints.session_id
        AND sw_outline_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update blueprints for own sessions"
  ON sw_scene_blueprints FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM sw_outline_sessions
      WHERE sw_outline_sessions.id = sw_scene_blueprints.session_id
        AND sw_outline_sessions.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sw_outline_sessions
      WHERE sw_outline_sessions.id = sw_scene_blueprints.session_id
        AND sw_outline_sessions.user_id = auth.uid()
    )
  );

-- ============================================================
-- 12. sw_story_tags
-- ============================================================
CREATE TABLE sw_story_tags (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id  uuid NOT NULL REFERENCES sw_outline_sessions(id) ON DELETE CASCADE,
  tag_type    text NOT NULL,
  tag_value   text NOT NULL
);

ALTER TABLE sw_story_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view tags for own sessions"
  ON sw_story_tags FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM sw_outline_sessions
      WHERE sw_outline_sessions.id = sw_story_tags.session_id
        AND sw_outline_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert tags for own sessions"
  ON sw_story_tags FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sw_outline_sessions
      WHERE sw_outline_sessions.id = sw_story_tags.session_id
        AND sw_outline_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete tags for own sessions"
  ON sw_story_tags FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM sw_outline_sessions
      WHERE sw_outline_sessions.id = sw_story_tags.session_id
        AND sw_outline_sessions.user_id = auth.uid()
    )
  );

-- ============================================================
-- 13. Add deferred FK from sw_scripts to sw_outline_sessions
-- ============================================================
ALTER TABLE sw_scripts
  ADD CONSTRAINT fk_scripts_blueprint_session
  FOREIGN KEY (blueprint_session_id)
  REFERENCES sw_outline_sessions(id)
  ON DELETE SET NULL;

-- ============================================================
-- 14. Auth hook — auto-create sw_user_profiles on signup
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.sw_user_profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
