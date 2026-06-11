-- Per-user, per-match inbox state: mute and soft-delete (hide).
-- One row per (match, user). Mirrors the user-scoped user_preferences pattern;
-- updated_at is set explicitly by the app (no set_updated_at trigger exists).
create table match_user_state (
  match_id   uuid not null references matches(id)  on delete cascade,
  user_id    uuid not null references profiles(id) on delete cascade,
  muted      boolean     not null default false,
  deleted_at timestamptz,                     -- null = visible; set = soft-hidden at this time
  updated_at timestamptz not null default now(),
  primary key (match_id, user_id)
);

-- getInbox reads all of a user's state rows in one query.
create index match_user_state_user_idx on match_user_state(user_id);

alter table match_user_state enable row level security;

create policy "match_user_state_select" on match_user_state
  for select using (auth.uid() = user_id);

create policy "match_user_state_insert" on match_user_state
  for insert with check (auth.uid() = user_id);

create policy "match_user_state_update" on match_user_state
  for update using (auth.uid() = user_id);

create policy "match_user_state_delete" on match_user_state
  for delete using (auth.uid() = user_id);
