-- Message attachments: let a message carry a single file (image or document)
-- in addition to, or instead of, text.
--
-- STORAGE: a PUBLIC Supabase Storage bucket named `message-attachments` must be
-- created out-of-band (Supabase dashboard or CLI), mirroring the existing
-- `avatars` / `projects` buckets which are served via getPublicUrl(). Files are
-- stored under `${matchId}/${timestamp}.${ext}`.

-- Text is no longer required — an attachment-only message has null content.
alter table messages alter column content drop not null;

-- Single attachment per message.
alter table messages add column attachment_url  text;
alter table messages add column attachment_type text;  -- MIME, e.g. image/png, application/pdf
alter table messages add column attachment_name text;  -- original filename for the download chip

-- A message must carry text, an attachment, or both — never an empty row.
alter table messages
  add constraint messages_content_or_attachment
  check (content is not null or attachment_url is not null);
