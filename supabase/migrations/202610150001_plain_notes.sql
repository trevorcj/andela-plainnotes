-- Migration for PlainNotes: Academic Jargon Simplifier for African Learners
create table if not exists public.plain_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  title text not null,
  subject text not null default 'General',
  language text not null default 'pidgin',
  level text not null default 'Secondary (WAEC/JAMB)',
  original_text text not null,
  simplified_text text not null,
  local_analogy text not null,
  exam_essentials jsonb not null default '[]'::jsonb,
  quiz jsonb not null default '{}'::jsonb,
  whatsapp_text text not null,
  is_curated boolean not null default false,
  created_at timestamptz not null default now()
);

-- Enable Row Level Security
alter table public.plain_notes enable row level security;

-- Drop previous policies if any exist
drop policy if exists "plain_notes_read_policy" on public.plain_notes;
drop policy if exists "plain_notes_insert_policy" on public.plain_notes;
drop policy if exists "plain_notes_delete_policy" on public.plain_notes;

-- Policies:
-- 1. Read: Any authenticated user can read their own notes, or any curated/public notes. Guest notes without user_id can be read by creator or public if curated.
create policy "plain_notes_read_policy" on public.plain_notes
  for select to authenticated, anon
  using (is_curated = true or user_id = auth.uid() or user_id is null);

-- 2. Insert: Authenticated or anonymous users can insert their own notes
create policy "plain_notes_insert_policy" on public.plain_notes
  for insert to authenticated, anon
  with check (auth.uid() = user_id or user_id is null);

-- 3. Delete: Authenticated users can delete their own notes
create policy "plain_notes_delete_policy" on public.plain_notes
  for delete to authenticated
  using (auth.uid() = user_id);

-- Grants
grant select, insert on public.plain_notes to anon, authenticated;
grant delete, update on public.plain_notes to authenticated;
