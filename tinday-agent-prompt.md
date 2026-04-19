# Tinday Backend — AI Agent Implementation Prompt

> **Purpose:** This document is a complete implementation guide for an AI coding agent (Claude Code, Cursor, Gemini, Copilot Workspace, etc.). Follow each phase in order. Complete all checklist items before moving to the next phase. Do not skip steps.

---

## Project Context

You are building the backend for **Tinday**, a swipe-based professional networking app. The system consists of two backend services:

1. **Express.js Monolith** (Node.js) — handles profiles, swipes, matches, messaging orchestration, and AI proxying. Auth and storage are delegated to Supabase.
2. **FastAPI Service** (Python) — handles all AI functionality: embeddings, recommendations, preference learning, and RAG-based chat.

Both services share the same **Supabase project** (PostgreSQL + pgvector, Auth, Storage, Realtime).

The mobile client is React Native (Expo). You are only building the backend.

---

## Tech Stack Reference

| Layer                     | Technology                           |
| ------------------------- | ------------------------------------ |
| Node runtime              | Node.js                              |
| Express backend           | Express.js                           |
| Supabase client (Node)    | @supabase/supabase-js                |
| Real-time (custom events) | Socket.io                            |
| Python runtime            | Python                               |
| AI service                | FastAPI                              |
| ASGI server               | Uvicorn                              |
| Supabase client (Python)  | supabase-py                          |
| Auth                      | Supabase Auth (email/password + JWT) |
| Database                  | Supabase PostgreSQL + pgvector       |
| File storage              | Supabase Storage                     |
| Realtime (DB events)      | Supabase Realtime                    |
| Embeddings                | Gemini `text-embedding-004`          |
| LLM                       | Gemini 1.5 Flash via Google SDK      |
| Vector math               | numpy                                |
| Containerization          | Docker + Docker Compose              |

---

## Supabase Services Used — and Why

| Supabase Service                     | Usage in Tinday                                                                  |
| ------------------------------------ | -------------------------------------------------------------------------------- |
| **Database** (PostgreSQL + pgvector) | Primary data store for all tables; pgvector for embeddings and similarity search |
| **Auth**                             | Email/password signup, login, JWT issuance and verification                      |
| **Storage**                          | Profile photos and project media with CDN delivery                               |
| **Realtime**                         | Broadcast new messages and match events to connected clients                     |
| **Row Level Security (RLS)**         | Declarative per-row access control enforced at the DB level                      |

Socket.io is retained only for custom events that Supabase Realtime does not handle natively: typing indicators and online presence.

---

## Repository Structure

Set up the repository exactly as follows before writing any feature code:

```
tinday/
├── docker-compose.yml            # Express + FastAPI only (Supabase is hosted)
├── .env.example
├── README.md
│
├── express-server/               # Node.js monolith
│   ├── package.json
│   ├── src/
│   │   ├── index.js              # Entry point
│   │   ├── config/
│   │   │   ├── supabase.js       # Supabase client (service-role key)
│   │   │   └── socket.js         # Socket.io setup
│   │   ├── middleware/
│   │   │   ├── auth.js           # Supabase JWT verification middleware
│   │   │   ├── errorHandler.js
│   │   │   └── validate.js       # Zod request validation
│   │   └── modules/
│   │       ├── profiles/
│   │       │   ├── profiles.routes.js
│   │       │   ├── profiles.controller.js
│   │       │   └── profiles.service.js
│   │       ├── swipes/
│   │       │   ├── swipes.routes.js
│   │       │   ├── swipes.controller.js
│   │       │   └── swipes.service.js
│   │       ├── matches/
│   │       │   ├── matches.routes.js
│   │       │   ├── matches.controller.js
│   │       │   └── matches.service.js
│   │       ├── messaging/
│   │       │   ├── messaging.routes.js
│   │       │   ├── messaging.controller.js
│   │       │   └── messaging.service.js
│   │       └── ai-proxy/
│   │           ├── ai-proxy.routes.js
│   │           ├── ai-proxy.controller.js
│   │           └── ai-proxy.service.js
│
├── fastapi-service/              # Python AI service
│   ├── requirements.txt
│   ├── Dockerfile
│   ├── main.py
│   ├── config/
│   │   ├── settings.py           # Pydantic settings (env vars)
│   │   └── supabase.py           # Supabase Python client singleton
│   ├── routers/
│   │   ├── embed.py
│   │   ├── recommend.py
│   │   ├── chat.py
│   │   └── preference.py
│   ├── services/
│   │   ├── embedding_service.py
│   │   ├── recommendation_service.py
│   │   ├── preference_service.py
│   │   └── chat_service.py
│   └── schemas/
│       └── models.py
│
└── supabase/
    └── migrations/
        ├── 00_extensions.sql     # Enable pgvector
        ├── 01_tables.sql         # All table definitions
        ├── 02_rls.sql            # Row Level Security policies
        ├── 03_indexes.sql        # pgvector and query indexes
        └── 04_functions.sql      # Postgres functions for vector operations (called via rpc)
```

---

## Database Schema

All schema is managed via SQL migration files in `supabase/migrations/`. Run them in order via the Supabase dashboard SQL editor or the Supabase CLI (`supabase db push`).

### `supabase/migrations/00_extensions.sql`

```sql
create extension if not exists vector;
```

### `supabase/migrations/01_tables.sql`

```sql
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
  giver_id    uuid not null references auth.users(id) on delete cascade,
  receiver_id uuid not null references auth.users(id) on delete cascade,
  direction   text not null check (direction in ('RIGHT', 'LEFT')),
  created_at  timestamptz default now(),
  unique(giver_id, receiver_id)
);

create table matches (
  id          uuid primary key default gen_random_uuid(),
  user_a_id   uuid not null references auth.users(id) on delete cascade,
  user_b_id   uuid not null references auth.users(id) on delete cascade,
  created_at  timestamptz default now(),
  unique(user_a_id, user_b_id)
);

create table messages (
  id          uuid primary key default gen_random_uuid(),
  match_id    uuid not null references matches(id) on delete cascade,
  sender_id   uuid not null references auth.users(id) on delete cascade,
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
```

### `supabase/migrations/02_rls.sql`

```sql
alter table profiles          enable row level security;
alter table user_preferences  enable row level security;
alter table swipes            enable row level security;
alter table matches           enable row level security;
alter table messages          enable row level security;

create policy "profiles_select" on profiles
  for select using (auth.role() = 'authenticated');

create policy "profiles_insert" on profiles
  for insert with check (auth.uid() = id);

create policy "profiles_update" on profiles
  for update using (auth.uid() = id);

create policy "swipes_select" on swipes
  for select using (auth.uid() = giver_id);

create policy "swipes_insert" on swipes
  for insert with check (auth.uid() = giver_id);

create policy "matches_select" on matches
  for select using (auth.uid() = user_a_id or auth.uid() = user_b_id);

create policy "messages_select" on messages
  for select using (
    exists (
      select 1 from matches m
      where m.id = messages.match_id
        and (m.user_a_id = auth.uid() or m.user_b_id = auth.uid())
    )
  );

create policy "messages_insert" on messages
  for insert with check (auth.uid() = sender_id);
```

### `supabase/migrations/03_indexes.sql`

```sql
create index if not exists profile_embedding_idx
  on profiles using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

create index if not exists swipes_giver_idx on swipes(giver_id);

create index if not exists messages_match_created_idx
  on messages(match_id, created_at asc);
```

### `supabase/migrations/04_functions.sql`

These Postgres functions expose vector operations as RPC calls so that the FastAPI service can use supabase-py for all database access, including vector operations.

```sql
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
```

---

## Supabase Project Setup

Complete these steps in the Supabase dashboard before writing any application code:

- [ ] Create a new Supabase project — note the project URL, anon key, and service-role key
- [ ] Run all five migration files in order via the SQL editor
- [ ] Verify the `vector` extension is active under Database → Extensions
- [ ] Enable Realtime on the `messages` table: Database → Replication → enable `messages`
- [ ] Enable Realtime on the `matches` table: Database → Replication → enable `matches`
- [ ] Create a storage bucket named `avatars` — set it to public
- [ ] Create a storage bucket named `projects` — set it to public
- [ ] Set storage policies: authenticated users can upload to their own folder (`{userId}/*`), anyone can read

---

## Phase 0 — Project Bootstrap

- [x] Create the monorepo folder structure exactly as shown above
- [x] Initialise `express-server/` with `npm init` and install dependencies:
  ```
  express @supabase/supabase-js socket.io axios zod
  morgan helmet cors express-async-errors express-rate-limit dotenv
  ```
- [x] Install dev dependencies: `nodemon eslint prettier`
- [x] Initialise `fastapi-service/` and create `requirements.txt`:
  ```
  fastapi uvicorn[standard] supabase google-generativeai
  pydantic-settings httpx python-multipart numpy
  ```
- [x] Create `docker-compose.yml` with two services — `express` and `fastapi`
  - Both connect to the hosted Supabase project via env vars
- [x] Create `.env.example`:

  ```
  # Supabase
  SUPABASE_URL=https://your-project.supabase.co
  SUPABASE_ANON_KEY=
  SUPABASE_SERVICE_ROLE_KEY=

  # AI
  GEMINI_API_KEY=

  # Internal service auth
  FASTAPI_INTERNAL_URL=http://fastapi:8000
  INTERNAL_SERVICE_SECRET=

  # Express
  PORT=4000
  NODE_ENV=development
  ```

- [x] Write `src/config/supabase.js`:

  ```js
  import { createClient } from "@supabase/supabase-js";

  export const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
  ```

- [x] Write `config/supabase.py` (FastAPI):

  ```python
  from supabase import create_client, Client
  from config.settings import settings

  supabase: Client = create_client(
      settings.supabase_url,
      settings.supabase_service_role_key
  )
  ```

- [x] Write `src/index.js` — create Express app, mount all module routers, attach Socket.io, start server
- [x] Write `main.py` — create FastAPI app, include all routers, add a startup event that makes a test query to Supabase to confirm connectivity
- [x] Verify: `docker-compose up` starts both services and both connect to Supabase successfully

---

## Phase 1 — Authentication

Supabase Auth handles the entire auth lifecycle. Express only needs to verify the JWT that Supabase issues.

- [x] **Register** `POST /api/auth/register`
  - Accept `{ email, password, name }`
  - Validate with Zod: email format, password min 8 chars, name non-empty
  - Call `supabase.auth.admin.createUser({ email, password, email_confirm: true })`
  - Insert a row into `profiles` with `{ id: user.id, name }`
  - Fire-and-forget: call FastAPI `POST /embed` with the new profile
  - Return `{ message: "Account created. Check your email to confirm." }`

- [x] **Login** `POST /api/auth/login`
  - Accept `{ email, password }`
  - Call `supabase.auth.signInWithPassword({ email, password })`
  - Return `{ access_token, refresh_token, user }` from the Supabase response

- [x] **Refresh token** `POST /api/auth/refresh`
  - Accept `{ refresh_token }`
  - Call `supabase.auth.refreshSession({ refresh_token })`
  - Return new `access_token` and `refresh_token`

- [x] **Logout** `POST /api/auth/logout`
  - Call `supabase.auth.admin.signOut(req.user.id)`
  - Return 200

- [x] **JWT middleware** `src/middleware/auth.js`
  - Extract Bearer token from the `Authorization` header
  - Call `supabase.auth.getUser(token)` to validate and decode
  - Attach `req.user = { id, email }` on success; return 401 on failure
  - Apply to all routes except `POST /api/auth/register` and `POST /api/auth/login`

- [x] **Get current user** `GET /api/auth/me`
  - Query `profiles` for `req.user.id` and return the row

---

## Phase 2 — Profiles

- [x] **Get own profile** `GET /api/profiles/me`
  - `supabase.from('profiles').select('*').eq('id', req.user.id).single()`

- [x] **Update own profile** `PUT /api/profiles/me`
  - Accept partial fields: `name`, `about`, `experience_years`, `skills`, `roles`, `projects`, `preferences`
  - Validate with Zod
  - `supabase.from('profiles').update(fields).eq('id', req.user.id)`
  - Fire-and-forget: call FastAPI `POST /embed` after the response is sent

- [x] **Upload profile photo** `POST /api/profiles/me/photo`
  - Accept `multipart/form-data` — jpg, png, webp only, max 5MB
  - Upload to Supabase Storage:
    ```js
    const filePath = `${req.user.id}/avatar.${ext}`;
    await supabase.storage.from("avatars").upload(filePath, buffer, {
      contentType: mimetype,
      upsert: true,
    });
    const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);
    ```
  - Update `profiles.avatar_url` with the public URL

- [x] **Upload project media** `POST /api/profiles/me/projects/media`
  - Upload to the `projects` bucket under `{userId}/{timestamp}.{ext}`
  - Return the public URL for the client to store in the projects JSON array

- [x] **Get profile by ID** `GET /api/profiles/:userId`
  - Query `profiles` by the given userId and return public fields

- [x] **Search profiles** `GET /api/profiles/search`
  - Query params: `skills`, `min_experience`, `max_experience`, `page`, `limit`
  - Use `.contains('skills', skillsArray)`, `.gte`, `.lte`, and `.range()` on the Supabase client
  - Pass `{ count: 'exact' }` to `select()` for total count in the response

---

## Phase 3 — Swipes and Matches

- [x] **Record a swipe** `POST /api/swipes`
  - Accept `{ receiver_id, direction }` ("RIGHT" or "LEFT")
  - Validate: `receiver_id !== req.user.id`
  - Insert into `swipes` — return 409 on unique constraint violation
  - If `direction === "RIGHT"`, check for a mutual right swipe and create a `matches` row if found — Supabase Realtime broadcasts the new match row automatically
  - Fire-and-forget: call FastAPI `POST /update-preference` after the response is sent

- [x] **Get matches** `GET /api/matches`
  - Query matches where `user_a_id = req.user.id OR user_b_id = req.user.id`
  - Join both users' profiles using Supabase's foreign key join syntax:
    ```js
    supabase
      .from("matches")
      .select(
        `
      id, created_at,
      user_a:profiles!matches_user_a_id_fkey(id, name, avatar_url, skills),
      user_b:profiles!matches_user_b_id_fkey(id, name, avatar_url, skills)
    `,
      )
      .or(`user_a_id.eq.${req.user.id},user_b_id.eq.${req.user.id}`);
    ```

- [x] **Get explore feed** `GET /api/explore`
  - Fetch already-swiped IDs for this user from `swipes`
  - Call FastAPI `POST /recommend` with `{ userId, filters, excludeIds }`
  - Fetch full profiles for the returned IDs from Supabase
  - Return the profiles in ranked order

---

## Phase 4 — Messaging

- [ ] **Get messages for a match** `GET /api/matches/:matchId/messages`
  - Verify the authenticated user belongs to the match — return 403 if not
  - Fetch messages with `.eq('match_id', matchId).order('created_at', { ascending: true })`
  - Support pagination via `.range(from, to)`
  - Bulk-update `read_at` for unread messages where `sender_id != req.user.id`

- [ ] **Send a message** `POST /api/matches/:matchId/messages`
  - Verify match membership
  - Insert into `messages` — Supabase Realtime broadcasts the insert automatically
  - Emit a `typing_stopped` Socket.io event to clear typing state in the room

- [ ] **Get inbox** `GET /api/inbox`
  - Fetch all matches for the user with the other user's profile
  - For each match, fetch the latest message
  - Sort by latest message timestamp descending
  - Include unread message count per match

- [ ] **Supabase Realtime — document the client subscription pattern in `README.md`** for the mobile team:

  ```js
  supabase
    .channel("match-room")
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `match_id=eq.${matchId}`,
      },
      (payload) => {
        /* handle new message */
      },
    )
    .subscribe();
  ```

- [ ] **Socket.io — presence and typing only** `src/config/socket.js`
  - On `connection`: verify the JWT via `supabase.auth.getUser()`; disconnect if invalid
  - On `join_match`: verify match membership, then `socket.join(matchId)`
  - On `typing_start`: emit `user_typing` to the room (excluding the sender)
  - On `typing_stop`: emit `user_stopped_typing` to the room
  - On `disconnect`: emit `user_offline` to all rooms the socket was in

---

## Phase 5 — AI Proxy (Express side)

This module is a thin HTTP client. It contains no AI logic.

- [ ] **Create axios instance** in `ai-proxy.service.js`
  - Base URL: `process.env.FASTAPI_INTERNAL_URL`
  - Default header: `X-Internal-Key: process.env.INTERNAL_SERVICE_SECRET`
  - Timeout: 30s for standard requests, 60s for streaming chat

- [ ] **Proxy: recommend** `GET /api/ai/recommend`
  - Fetch already-swiped IDs from Supabase
  - Call FastAPI `POST /recommend` with `{ userId, filters, excludeIds }`
  - Return the ranked profile list

- [ ] **Proxy: chat** `POST /api/ai/chat`
  - Accept `{ message, conversation_history[] }`
  - Forward to FastAPI `POST /chat`
  - Set `res.setHeader('Content-Type', 'text/event-stream')` and pipe the streaming response

- [ ] **Proxy: share profile card** `POST /api/ai/share-profile`
  - Accept `{ profile_id }`
  - Fetch the profile from Supabase, forward to FastAPI `POST /chat` with the profile as context
  - Return the AI's analysis

---

## Phase 6 — FastAPI AI Service

### Setup

- [ ] Write `config/settings.py` using `pydantic-settings`:

  ```python
  from pydantic_settings import BaseSettings, SettingsConfigDict

  class Settings(BaseSettings):
      supabase_url: str
      supabase_service_role_key: str
      gemini_api_key: str
      internal_service_secret: str

      model_config = SettingsConfigDict(env_file='.env')

  settings = Settings()
  ```

- [ ] Write `config/supabase.py` — initialise the supabase-py client with the service-role key (shown in Phase 0)

- [ ] Write `schemas/models.py` — Pydantic models for all request/response bodies

- [ ] Add `X-Internal-Key` middleware in `main.py`:

  ```python
  from fastapi import Request
  from fastapi.responses import JSONResponse

  @app.middleware("http")
  async def verify_internal_key(request: Request, call_next):
      if request.headers.get("X-Internal-Key") != settings.internal_service_secret:
          return JSONResponse(status_code=401, content={"detail": "Unauthorized"})
      return await call_next(request)
  ```

### Embedding endpoint

- [ ] **`POST /embed`** (`routers/embed.py`)
  - Request body: `{ user_id: str, profile_text: str }`
  - `profile_text` is constructed by Express: `about + skills.join(', ') + roles.join(', ') + JSON.stringify(preferences)`
  - In `embedding_service.py`: call Gemini `text-embedding-004` — returns a 768-dim float list
  - Call the `upsert_embedding` Postgres function via RPC:

    ```python
    from config.supabase import supabase

    supabase.rpc('upsert_embedding', {
        'target_user_id': user_id,
        'embedding_vector': embedding_list
    }).execute()
    ```

  - Initialise the preference vector row if it doesn't exist yet:
    ```python
    supabase.rpc('init_preference_vector', {
        'target_user_id': user_id
    }).execute()
    ```
  - Return `{ "success": True, "user_id": user_id }`

### Recommendation endpoint

- [ ] **`POST /recommend`** (`routers/recommend.py`)
  - Request body: `{ user_id, filters: { skills, min_experience, max_experience }, limit, exclude_ids[] }`
  - In `recommendation_service.py`:
    - Fetch the user's `preference_vector` from `user_preferences`:
      ```python
      result = supabase.table('user_preferences') \
          .select('preference_vector') \
          .eq('user_id', user_id) \
          .single() \
          .execute()
      preference_vector = result.data['preference_vector']
      ```
    - If null, fall back to the user's `embedding` from `profiles`
    - Call the `match_profiles` Postgres function via RPC:
      ```python
      result = supabase.rpc('match_profiles', {
          'query_vector': preference_vector,
          'requesting_user_id': user_id,
          'exclude_ids': exclude_ids or [],
          'skills_filter': filters.get('skills'),
          'min_exp': filters.get('min_experience'),
          'max_exp': filters.get('max_experience'),
          'result_limit': limit or 20
      }).execute()
      ```
    - Return `{ "ranked_user_ids": [row["user_id"] for row in result.data] }`

### Preference update endpoint

- [ ] **`POST /update-preference`** (`routers/preference.py`)
  - Request body: `{ user_id, target_user_id, direction }` ("RIGHT" or "LEFT")
  - In `preference_service.py`:
    - Fetch `target_profile.embedding` from `profiles`:
      ```python
      target = supabase.table('profiles') \
          .select('embedding') \
          .eq('id', target_user_id) \
          .single() \
          .execute()
      target_embedding = target.data['embedding']
      ```
    - Fetch current `preference_vector` from `user_preferences`
    - Apply the update rule using numpy:

      ```python
      import numpy as np

      current = np.array(current_vector)
      target  = np.array(target_embedding)

      if direction == "RIGHT":
          updated = 0.95 * current + 0.05 * target
      else:
          updated = 0.95 * current - 0.02 * target

      norm = np.linalg.norm(updated)
      if norm > 0:
          updated = updated / norm

      updated_list = updated.tolist()
      ```

    - Write back via RPC:
      ```python
      supabase.rpc('upsert_preference_vector', {
          'target_user_id': user_id,
          'pref_vector': updated_list
      }).execute()
      ```

  - Return `{ "success": True }`

### Chat endpoint

- [ ] **`POST /chat`** (`routers/chat.py`)
  - Request body: `{ user_id, message, conversation_history: [{ role, content }] }`
  - In `chat_service.py`:
    - Embed the user's message using the embeddings API
    - Retrieve top 5 relevant profiles via the `match_profiles_for_chat` RPC:
      ```python
      result = supabase.rpc('match_profiles_for_chat', {
          'query_vector': message_embedding,
          'requesting_user_id': user_id,
          'result_limit': 5
      }).execute()
      top_ids = [row['user_id'] for row in result.data]
      ```
    - Fetch full profile rows for those IDs:
      ```python
      profiles = supabase.table('profiles') \
          .select('name, about, skills, roles, experience_years') \
          .in_('id', top_ids) \
          .execute()
      ```
    - Build a system prompt:

      ```
      You are Tinday's AI networking assistant. You help professionals discover
      relevant collaborators and connections.

      You have access to the following user profiles as context:
      {formatted_profiles}

      When relevant, recommend specific profiles and explain clearly why they are
      a good match for the user's goals. Be concise, direct, and professional.
      ```

    - Call Gemini via the `google-generativeai` SDK with streaming:

      ```python
      import google.generativeai as genai

      genai.configure(api_key=settings.gemini_api_key)
      model = genai.GenerativeModel("gemini-1.5-flash")

      async def generate():
          response = await model.generate_content_async(
              contents=[
                  {"role": "user", "parts": [system_prompt]}
              ] + [
                  {"role": m["role"], "parts": [m["content"]]}
                  for m in conversation_history
              ] + [
                  {"role": "user", "parts": [message]}
              ],
              stream=True
          )
          async for chunk in response:
              yield f"data: {chunk.text}\n\n"

      return StreamingResponse(generate(), media_type="text/event-stream")
      ```

---

## Phase 7 — Error Handling and Validation

- [ ] Write `src/middleware/errorHandler.js` (Express):
  - Catch all errors via `express-async-errors`
  - Supabase unique violation (Postgres code `23505`) → 409 with human-readable message
  - Supabase `PGRST116` (no rows found) → 404
  - Zod `ZodError` → 422 with field-level error detail
  - Supabase auth errors → 401
  - All other errors → 500 with sanitised message (no stack traces in production)

- [ ] Write `src/middleware/validate.js` — higher-order function wrapping Zod schema validation for `req.body`

- [ ] Add FastAPI exception handlers in `main.py`:
  - `RequestValidationError` → 422 with field details
  - `Exception` catch-all → 500 with sanitised message
  - `HTTPException` passthrough

- [ ] Add rate limiting in Express using `express-rate-limit`:
  - Global: 100 requests per minute per IP
  - Auth routes: 10 requests per minute per IP

---

## Phase 8 — Testing

- [ ] Install Jest and Supertest in `express-server/`
- [ ] Install Pytest and `httpx` in `fastapi-service/`
- [ ] Create a separate Supabase project for testing — use its credentials in the test env
- [ ] Write integration tests for auth routes — register, login, token refresh
- [ ] Write integration tests for swipe + match creation flow
- [ ] Write integration tests for photo upload to Supabase Storage
- [ ] Write Pytest unit tests for `preference_service.py` — test vector update math with numpy assertions
- [ ] Write Pytest unit tests for `recommendation_service.py` — mock supabase-py and assert ranked order
- [ ] Write Pytest integration tests for `/embed`, `/recommend`, and `/chat` using `httpx.AsyncClient` against the test Supabase project

---

## Phase 9 — Deployment Configuration

- [ ] Write `Dockerfile` for Express — multi-stage build, expose port 4000
- [ ] Write `Dockerfile` for FastAPI — install deps, expose port 8000, CMD `uvicorn main:app --host 0.0.0.0 --port 8000`
- [ ] Update `docker-compose.yml` with health checks for both services
- [ ] Write `Makefile` with: `make up`, `make down`, `make seed`, `make test`
- [ ] Write `seed.js` — creates 10 sample users via Supabase Auth + profile rows with varied skills and bios, then calls FastAPI `/embed` for each
- [ ] Add `GET /health` to both services returning `{ status: "ok", timestamp, service: "express"|"fastapi" }`

---

## Implementation Rules for the AI Agent

Follow these rules throughout the entire implementation:

1. **Never put business logic in controllers.** Controllers extract params and call services. All logic lives in services.
2. **Always use the service-role key in Express and FastAPI.** The anon key is only for the mobile client. The service-role key bypasses RLS, which is correct for server-side operations.
3. **Never expose internal errors to the client.** Log the full error server-side, return only a sanitised message.
4. **All DB access in Express goes through the Supabase JS client.** No raw SQL in Express.
5. **All DB access in FastAPI goes through supabase-py.** Use `.table()` for standard queries and `.rpc()` for vector operations. Do not use any other DB driver.
6. **All vector similarity operations use the Postgres functions defined in `04_functions.sql`.** Call them via `supabase.rpc()`. Never compute similarity in Python.
7. **Fire-and-forget calls to FastAPI must not block the Express response.** Call them after `res.json(...)` and attach `.catch(err => console.error(err))`.
8. **FastAPI must reject any request without the correct `X-Internal-Key` header.**
9. **Validate every request body.** Zod in Express, Pydantic in FastAPI. No direct `req.body` access without prior validation.
10. **No hardcoded secrets.** All credentials come from environment variables.
11. **Supabase Realtime handles DB-change events.** Socket.io handles only presence and typing. Do not duplicate event delivery.
12. **Each phase must be fully functional and manually tested before starting the next.**
