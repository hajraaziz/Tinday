import base64
import json
from google import genai
from google.genai import types
from config.settings import settings
from config.supabase import supabase
from fastapi.responses import StreamingResponse

client = genai.Client(api_key=settings.gemini_api_key)


def parse_vector(v):
    """Parse Supabase vector string to Python list."""
    if v is None:
        return None
    if isinstance(v, str):
        return json.loads(v)
    return v


async def get_chat_response(user_id: str, message: str, conversation_history: list, files: list = None):
    files = files or []
    # 1. Embed the user's message
    embed_result = client.models.embed_content(
        model="gemini-embedding-001",
        contents=message,
        config=types.EmbedContentConfig(task_type="RETRIEVAL_QUERY")
    )
    message_embedding = parse_vector(embed_result.embeddings[0].values)

    # 2. Retrieve top 5 relevant profiles via RPC
    match_result = supabase.rpc('match_profiles_for_chat', {
        'query_vector': message_embedding,
        'requesting_user_id': user_id,
        'result_limit': 5
    }).execute()
    top_ids = [row['user_id'] for row in match_result.data]

    # 3. Fetch full profile details. The id is included so the model can reference
    #    a person via the [[profile:<id>]] directive (rendered as a card client-side).
    formatted_profiles = ""
    if top_ids:
        profiles_res = supabase.table('profiles') \
            .select('id, name, about, skills, roles, experience_years') \
            .in_('id', top_ids) \
            .execute()

        formatted_profiles = "\n---\n".join([
            f"ID: {p['id']}\nName: {p['name']}\nAbout: {p['about']}\n"
            f"Skills: {', '.join(p['skills']) if p['skills'] else 'N/A'}\n"
            f"Roles: {', '.join(p['roles']) if p['roles'] else 'N/A'}\n"
            f"Experience: {p['experience_years']} years"
            for p in profiles_res.data
        ])

    # 4. Build system prompt string
    system_prompt = f"""You are Tinday's AI networking assistant. You help professionals discover relevant collaborators and connections.

## Available profiles (your private context)
Each profile has an ID. These are the ONLY people you may recommend.
{formatted_profiles if formatted_profiles else "No profiles found for this query."}

## How to format every reply
Always answer in clean, scannable Markdown — never a wall of text:
- Lead with a one-line takeaway, then expand.
- Keep paragraphs short. Use **bold** for key terms.
- Use `-` bullet lists for any set of points (skills, reasons, steps), not run-on sentences.
- Use `##` sub-headings only when a reply has clearly distinct sections.
- Be concise and professional. No filler, no repetition.

## Recommending people
When you recommend a specific person from the context above, do NOT write their name in prose. Instead, output their profile card by placing this token on its own line:
[[profile:<ID>]]
Use the exact ID from the context (never invent one). You may add a short sentence before each card explaining why they fit. If no profile is a good match, say so plainly and output no token."""

    # 5. Build contents using types.Content + types.Part
    #    The new google-genai SDK requires typed objects — plain dicts are NOT accepted.
    contents = [
        types.Content(
            role="user",
            parts=[types.Part(text=system_prompt)]
        )
    ]

    for m in conversation_history:
        # Gemini uses "model" not "assistant"
        role = "model" if m.role == "assistant" else m.role
        # History is intentionally text-only — files from prior turns are NOT
        # re-sent; only the current turn's files (below) reach the model.
        contents.append(
            types.Content(
                role=role,
                parts=[types.Part(text=m.content)]
            )
        )

    # Final user turn: text plus any current-turn files as inline data parts.
    # from_bytes is the inline-data path, bounded by Gemini's ~20MB request limit
    # (the client caps total upload size accordingly).
    final_parts = [types.Part(text=message)]
    for f in files:
        try:
            final_parts.append(
                types.Part.from_bytes(
                    data=base64.b64decode(f.data_base64),
                    mime_type=f.mime_type,
                )
            )
        except Exception:
            # Skip a malformed/undecodable file rather than failing the turn.
            continue

    contents.append(
        types.Content(
            role="user",
            parts=final_parts
        )
    )

    # 6. Generate and stream the response
    async def generate():
        try:
            response = await client.aio.models.generate_content_stream(
                model="gemini-3.1-flash-lite",
                contents=contents,
            )
            async for chunk in response:
                if chunk.text:
                    # JSON-encode so embedded newlines in the chunk can't collide
                    # with the "\n\n" SSE delimiter (clients JSON-decode each chunk).
                    yield f"data: {json.dumps(chunk.text)}\n\n"
        except Exception as e:
            yield f"data: {json.dumps(f'Error: {str(e)}')}\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")