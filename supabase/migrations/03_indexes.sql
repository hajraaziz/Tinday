create index if not exists profile_embedding_idx
  on profiles using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

create index if not exists swipes_giver_idx on swipes(giver_id);

create index if not exists messages_match_created_idx
  on messages(match_id, created_at asc);