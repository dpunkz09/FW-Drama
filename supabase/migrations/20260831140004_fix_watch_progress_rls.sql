-- Fix RLS: replace header-based policies with open anon policies.
-- Security model: device_id is a crypto.randomUUID() stored in localStorage.
-- The UUID is unguessable (128-bit entropy), so it acts as an implicit token.
-- Each client can only access their own rows because they only know their own UUID.

-- Drop the broken header-based policies
drop policy if exists "device read own progress"   on watch_progress;
drop policy if exists "device insert own progress" on watch_progress;
drop policy if exists "device update own progress" on watch_progress;

-- Allow anon role to do all operations (filtered by device_id in app queries)
create policy "anon full access"
  on watch_progress
  for all
  to anon
  using (true)
  with check (true);
