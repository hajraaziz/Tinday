-- Enable Supabase Realtime for the messages table so an open conversation
-- thread receives new messages in <1s (postgres_changes INSERT events).
-- The frontend authenticates the realtime socket with the user's access token
-- (supabase.realtime.setAuth), so the existing "messages_select" RLS policy in
-- 02_rls.sql gates delivery: a user only receives rows for matches they're in.
--
-- NOTE: must be run in Supabase (SQL editor or `supabase db push`).
alter publication supabase_realtime add table messages;
