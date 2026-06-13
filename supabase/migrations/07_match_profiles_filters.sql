-- Extend match_profiles with roles + location filters.
-- The argument signature changes (two new params), so the old overload must be
-- dropped first — otherwise Postgres keeps both and the named-arg RPC call from
-- supabase-py becomes ambiguous.
drop function if exists match_profiles(
  vector(3072), uuid, uuid[], text[], int, int, int
);

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
