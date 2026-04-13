-- Upsert a profile embedding vector
create or replace function upsert_embedding(
  target_user_id uuid,
  embedding_vector vector(768)
)
returns void
language plpgsql
security definer
as $$
begin
  update profiles
  set embedding = embedding_vector,
      embedding_updated_at = now()
  where id = target_user_id;
end;
$$;

-- Initialise a zero preference vector for a new user (no-op if already exists)
create or replace function init_preference_vector(
  target_user_id uuid
)
returns void
language plpgsql
security definer
as $$
begin
  insert into user_preferences(user_id, preference_vector)
  values (target_user_id, array_fill(0::float, array[768])::vector)
  on conflict (user_id) do nothing;
end;
$$;

-- Upsert a learned preference vector
create or replace function upsert_preference_vector(
  target_user_id uuid,
  pref_vector    vector(768)
)
returns void
language plpgsql
security definer
as $$
begin
  insert into user_preferences(user_id, preference_vector, updated_at)
  values (target_user_id, pref_vector, now())
  on conflict (user_id)
  do update set preference_vector = excluded.preference_vector,
                updated_at = now();
end;
$$;

-- Cosine similarity search with filters — returns ranked user IDs
create or replace function match_profiles(
  query_vector        vector(768),
  requesting_user_id  uuid,
  exclude_ids         uuid[],
  skills_filter       text[],
  min_exp             int,
  max_exp             int,
  result_limit        int
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
    and (min_exp is null or p.experience_years >= min_exp)
    and (max_exp is null or p.experience_years <= max_exp)
  order by p.embedding <=> query_vector
  limit result_limit;
end;
$$;

-- Fetch top-N similar profiles for RAG context (used by the chat endpoint)
create or replace function match_profiles_for_chat(
  query_vector       vector(768),
  requesting_user_id uuid,
  result_limit       int
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
  order by p.embedding <=> query_vector
  limit result_limit;
end;
$$;