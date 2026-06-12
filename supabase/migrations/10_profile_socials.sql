-- Contact + social links shown on the profile rail (phone, website, linkedin,
-- instagram, github, twitter). Stored as a single jsonb blob — kept separate
-- from `preferences` so it never leaks into the profile embedding text.
-- Editable via PUT /api/profiles/me.
alter table profiles add column if not exists socials jsonb default '{}'::jsonb;
