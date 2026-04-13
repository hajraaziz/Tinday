alter table profiles          enable row level security;
alter table user_preferences  enable row level security;
alter table swipes            enable row level security;
alter table matches           enable row level security;
alter table messages          enable row level security;

create policy "profiles_select" on profiles
  for select using (auth.role() = 'authenticated');

create policy "profiles_insert" on profiles
  for insert with check (auth.uid() = id);

create policy "profiles_update" on profiles
  for update using (auth.uid() = id);

create policy "swipes_select" on swipes
  for select using (auth.uid() = giver_id);

create policy "swipes_insert" on swipes
  for insert with check (auth.uid() = giver_id);

create policy "matches_select" on matches
  for select using (auth.uid() = user_a_id or auth.uid() = user_b_id);

create policy "messages_select" on messages
  for select using (
    exists (
      select 1 from matches m
      where m.id = messages.match_id
        and (m.user_a_id = auth.uid() or m.user_b_id = auth.uid())
    )
  );

create policy "messages_insert" on messages
  for insert with check (auth.uid() = sender_id);