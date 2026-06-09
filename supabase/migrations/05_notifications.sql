-- In-app notifications + Web Push subscriptions.
-- Delivery is in-app via HTTP long polling (woken by an in-process EventEmitter)
-- and via Web Push for backgrounded clients. Deliberately NOT added to the
-- supabase_realtime publication — the long-poll endpoint is the live channel.
-- All writes go through the Express service-role client; clients only read.

create table notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references profiles(id) on delete cascade,
  type        text not null check (type in ('match', 'message')),
  title       text not null,
  body        text,
  data        jsonb default '{}',
  read_at     timestamptz,
  created_at  timestamptz default now()
);

create table push_subscriptions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references profiles(id) on delete cascade,
  endpoint    text not null unique,
  p256dh      text not null,
  auth        text not null,
  user_agent  text,
  created_at  timestamptz default now()
);

alter table notifications        enable row level security;
alter table push_subscriptions   enable row level security;

-- Read-own only; the service role bypasses RLS for all inserts/updates.
create policy "notifications_select" on notifications
  for select using (auth.uid() = user_id);

create policy "push_subscriptions_select" on push_subscriptions
  for select using (auth.uid() = user_id);

create index if not exists notifications_user_created_idx
  on notifications(user_id, created_at desc);

create index if not exists notifications_unread_idx
  on notifications(user_id) where read_at is null;

create index if not exists push_subscriptions_user_idx
  on push_subscriptions(user_id);
