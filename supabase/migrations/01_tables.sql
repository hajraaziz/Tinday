create table profiles (
  id                   uuid primary key references auth.users(id) on delete cascade,
  name                 text not null,
  avatar_url           text,
  about                text,
  experience_years     int default 0,
  skills               text[] default '{}',
  roles                text[] default '{}',
  projects             jsonb default '[]',
  preferences          jsonb default '{}',
  embedding            vector(768),
  embedding_updated_at timestamptz,
  created_at           timestamptz default now(),
  updated_at           timestamptz default now()
);

create table user_preferences (
  user_id           uuid primary key references auth.users(id) on delete cascade,
  preference_vector vector(768),
  updated_at        timestamptz default now()
);

create table swipes (
  id          uuid primary key default gen_random_uuid(),
  giver_id    uuid not null references profiles(id) on delete cascade,
  receiver_id uuid not null references profiles(id) on delete cascade,
  direction   text not null check (direction in ('RIGHT', 'LEFT')),
  created_at  timestamptz default now(),
  unique(giver_id, receiver_id)
);

create table matches (
  id          uuid primary key default gen_random_uuid(),
  user_a_id   uuid not null constraint matches_user_a_id_fkey references profiles(id) on delete cascade,
  user_b_id   uuid not null constraint matches_user_b_id_fkey references profiles(id) on delete cascade,
  created_at  timestamptz default now(),
  unique(user_a_id, user_b_id)
);

create table messages (
  id          uuid primary key default gen_random_uuid(),
  match_id    uuid not null references matches(id) on delete cascade,
  sender_id   uuid not null references profiles(id) on delete cascade,
  content     text not null,
  read_at     timestamptz,
  created_at  timestamptz default now()
);

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger profiles_updated_at
  before update on profiles
  for each row execute function set_updated_at();