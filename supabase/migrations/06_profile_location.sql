-- Add a free-text location field to profiles (e.g. "Berlin, DE" or "Remote").
-- Surfaced on explore cards and profile pages; editable via PUT /api/profiles/me.
alter table profiles add column if not exists location text;
