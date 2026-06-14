-- "Open to connect" gate for the Explore feed.
-- Users set preferences.open_to_connect (jsonb bool) from Settings → Privacy.
-- When a user turns it off, their card must not surface in others' Explore feed.
-- Default is ON for everyone: an absent/null key is treated as open, so only an
-- explicit `false` excludes a profile (no backfill of existing rows needed).
--
-- The signature is unchanged from 07_match_profiles_filters.sql, so `create or
-- replace` swaps the body in place without dropping the function. The fallback
-- listing in express-server/.../explore.service.js applies the same predicate.
create or replace function match_profiles(
  query_vector        vector(3072),
  requesting_user_id  uuid,
  exclude_ids         uuid[],
  skills_filter       text[],
  min_exp             int,
  max_exp             int,
  result_limit        int,
  roles_filter        text[] default null,
  location_filter     text default null
)
returns table(user_id uuid, similarity float)
language plpgsql
security definer
as $$
begin
  return query
  select
    p.id                               as user_id,
    1 - (p.embedding <=> query_vector)  as similarity
  from profiles p
  where p.id != requesting_user_id
    and p.embedding is not null
    and (p.preferences->>'open_to_connect' is null
         or p.preferences->>'open_to_connect' = 'true')
    and (exclude_ids is null or not (p.id = any(exclude_ids)))
    and (skills_filter is null or p.skills && skills_filter)
    and (roles_filter is null or p.roles && roles_filter)
    and (location_filter is null or p.location ilike '%' || location_filter || '%')
    and (min_exp is null or p.experience_years >= min_exp)
    and (max_exp is null or p.experience_years <= max_exp)
  order by p.embedding <=> query_vector
  limit result_limit;
end;
$$;
