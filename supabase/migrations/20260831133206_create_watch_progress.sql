-- ─────────────────────────────────────────────────────────────
-- watch_progress
-- Tracks per-device watch history with no login required.
-- device_id is a client-generated UUID stored in localStorage.
-- ─────────────────────────────────────────────────────────────

create table if not exists watch_progress (
  id          uuid        primary key default gen_random_uuid(),
  device_id   text        not null,
  book_id     text        not null,
  title       text        not null,
  pic         text        not null,
  chapter     integer     not null default 0,
  total       integer     not null default 0,
  updated_at  timestamptz not null default now(),

  -- one row per device+drama; upsert replaces on conflict
  unique (device_id, book_id)
);

-- Index for fast lookup of a device's history sorted by recency
create index if not exists idx_watch_progress_device
  on watch_progress (device_id, updated_at desc);

-- ─── Row-Level Security ───────────────────────────────────────
alter table watch_progress enable row level security;

-- Anyone can read rows matching their device_id
create policy "device read own progress"
  on watch_progress for select
  using (device_id = current_setting('request.headers', true)::json->>'x-device-id');

-- Anyone can insert their own rows
create policy "device insert own progress"
  on watch_progress for insert
  with check (device_id = current_setting('request.headers', true)::json->>'x-device-id');

-- Anyone can update their own rows
create policy "device update own progress"
  on watch_progress for update
  using  (device_id = current_setting('request.headers', true)::json->>'x-device-id')
  with check (device_id = current_setting('request.headers', true)::json->>'x-device-id');
