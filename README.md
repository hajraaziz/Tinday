# Tinday Backend

Tinday is a professional networking application that uses a swipe-based interface to connect professionals. This repository contains the multi-service backend architecture designed for scalability, real-time engagement, and AI-driven recommendations.

## 🏗️ Architecture Overview

The system is composed of two primary services and a hosted database layer:

- **Express.js Monolith (Node.js):** Handles core business logic, user profiles, swipes, matches, messaging orchestration, and serves as an AI proxy.
- **FastAPI Service (Python):** Dedicated AI service managing vector embeddings, recommendation engines, preference learning (numpy), and RAG-based chat.
- **Supabase (PostgreSQL + pgvector):** Unified database layer providing Auth, Storage, Realtime event broadcasting, and vector similarity search.

## 🛠️ Tech Stack

| Component            | Technology                                      |
| :------------------- | :---------------------------------------------- |
| **Runtime**          | Node.js (LTS), Python 3.10+                     |
| **Frameworks**       | Express.js, FastAPI                             |
| **Database**         | Supabase (PostgreSQL + pgvector)                |
| **Real-time**        | Supabase Realtime & Socket.io (Presence/Typing) |
| **AI/LLM**           | Gemini 1.5 Flash & text-embedding-004           |
| **Validation**       | Zod (Node), Pydantic (Python)                   |
| **Containerization** | Docker & Docker Compose                         |

## 📁 Repository Structure

```text
tinday/
├── express-server/     # Node.js API Monolith
├── fastapi-service/    # Python AI & Vector Service
├── supabase/           # SQL Migrations & DB Schema
└── docker-compose.yml  # Local orchestration
```

## 🚀 Getting Started

### Prerequisites

- Docker and Docker Compose
- A Supabase Project
- Google Gemini API Key

### Environment Setup

1. Copy `.env.example` to `.env` in the root directory.
2. Fill in your Supabase credentials and AI API keys:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `GEMINI_API_KEY`
   - `INTERNAL_SERVICE_SECRET` (A secure random string for service-to-service auth)

### Database Migration

Apply the SQL migrations found in `supabase/migrations/` to your Supabase project in numerical order:

1. `00_extensions.sql` (Enable pgvector)
2. `01_tables.sql` (Core tables)
3. `02_rls.sql` (Security policies)
4. `03_indexes.sql` (Performance & Vector indexes)
5. `04_functions.sql` (Vector RPC calls)

### Development

Run the services locally using Docker:

```bash
docker-compose up --build
```

The Express server will be available at `http://localhost:4000` and the FastAPI service at `http://localhost:8000`.

## 🤖 AI Features

- **Vector Profiles:** Every user profile is converted into a 768-dimensional vector using Gemini embeddings.
- **Dynamic Recommendations:** Uses cosine similarity to suggest relevant connections based on skills and experience.
- **Preference Learning:** Updates a user's "ideal match" vector in real-time based on their swipe history using a weighted numpy-based algorithm.
- **RAG Chat:** An AI assistant that provides networking advice using relevant user profiles as context.

## 🔒 Security

- **JWT Verification:** All client requests are verified via Supabase Auth.
- **Service-to-Service:** FastAPI rejects any request missing the `X-Internal-Key` matching the `INTERNAL_SERVICE_SECRET`.
- **RLS:** Row Level Security is enforced at the database level to ensure data privacy.

## 📱 Mobile Client Integration

### Messaging & Real-time

Tinday uses a hybrid approach for real-time features to optimize performance and battery life:

#### 1. Message Delivery (Supabase Realtime)
Use the Supabase client to subscribe directly to the `messages` table for new messages in a specific match. This bypasses the Express server for faster delivery.

```javascript
supabase
  .channel('match-room')
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'messages',
      filter: `match_id=eq.${matchId}`
    },
    (payload) => {
      console.log('New message received!', payload.new);
      // Update your local state
    }
  )
  .subscribe();
```

#### 2. Presence & Typing Indicators (Socket.io)
Socket.io is used for transient events that don't need to be persisted in the database.

- **Authentication:** Pass the Supabase JWT in the `auth` object when connecting.
- **Events:**
  - `join_match`: Send `matchId` to join a room.
  - `typing_start`: Send `matchId` when the user starts typing.
  - `typing_stop`: Send `matchId` when the user stops typing.
- **Listening:**
  - `user_typing`: Receive `{ matchId, userId }`.
  - `user_stopped_typing`: Receive `{ matchId, userId }`.
  - `user_offline`: Receive `{ userId }`.
