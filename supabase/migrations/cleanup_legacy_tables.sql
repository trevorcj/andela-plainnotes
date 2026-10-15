-- ========================================================
-- PlainNotes: Database Reset & Cleanup Script
-- Drops all legacy tables, views, and types from previous projects
-- Retains and secures ONLY public.plain_notes
-- ========================================================

-- 0. CRITICAL: Remove legacy auth triggers on auth.users
-- (Fixes "Database error saving new user" caused by old profile triggers)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- 1. Automatically drop all tables in public schema EXCEPT plain_notes
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
          AND tablename != 'plain_notes'
    ) 
    LOOP
        EXECUTE 'DROP TABLE IF EXISTS public.' || quote_ident(r.tablename) || ' CASCADE;';
    END LOOP;
END $$;

-- 2. Drop any legacy views in public schema
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (
        SELECT table_name 
        FROM information_schema.views 
        WHERE table_schema = 'public'
    ) 
    LOOP
        EXECUTE 'DROP VIEW IF EXISTS public.' || quote_ident(r.table_name) || ' CASCADE;';
    END LOOP;
END $$;

-- 3. Ensure plain_notes exists and is properly structured
CREATE TABLE IF NOT EXISTS public.plain_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  subject text NOT NULL DEFAULT 'General',
  language text NOT NULL DEFAULT 'pidgin',
  level text NOT NULL DEFAULT 'Secondary (WAEC/JAMB)',
  original_text text NOT NULL,
  simplified_text text NOT NULL,
  local_analogy text NOT NULL,
  exam_essentials jsonb NOT NULL DEFAULT '[]'::jsonb,
  quiz jsonb NOT NULL DEFAULT '{}'::jsonb,
  whatsapp_text text NOT NULL,
  is_curated boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.plain_notes ENABLE ROW LEVEL SECURITY;

-- 5. Policies
DROP POLICY IF EXISTS "plain_notes_read_policy" ON public.plain_notes;
DROP POLICY IF EXISTS "plain_notes_insert_policy" ON public.plain_notes;
DROP POLICY IF EXISTS "plain_notes_delete_policy" ON public.plain_notes;

CREATE POLICY "plain_notes_read_policy" ON public.plain_notes
  FOR SELECT TO authenticated, anon
  USING (is_curated = true OR user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "plain_notes_insert_policy" ON public.plain_notes
  FOR INSERT TO authenticated, anon
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "plain_notes_delete_policy" ON public.plain_notes
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- 6. Permissions
GRANT SELECT, INSERT ON public.plain_notes TO anon, authenticated;
GRANT DELETE, UPDATE ON public.plain_notes TO authenticated;
