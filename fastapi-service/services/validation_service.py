import json
from google import genai
from google.genai import types
from config.settings import settings

client = genai.Client(api_key=settings.gemini_api_key)


async def validate_tag(value: str, kind: str) -> dict:
    """Ask Gemini whether a user-typed skill/role is a real, recognized one.

    Returns {"valid": bool, "normalized": str}. `normalized` is the canonical,
    properly-cased form when valid, else "".
    """
    noun = (
        "professional or technical skill"
        if kind == "skill"
        else "job title or professional role"
    )
    prompt = (
        f"You validate a single user-entered {kind}. "
        f'Decide if "{value}" is a real, recognized {noun}. '
        f"Reject gibberish, random characters, or nonsense (e.g. 'xyz abc'). "
        f'Respond ONLY as JSON: {{"valid": boolean, "normalized": string}}. '
        f"normalized = canonical, properly-cased form when valid, else empty."
    )

    resp = await client.aio.models.generate_content(
        model="gemini-3.1-flash-lite",
        contents=[types.Content(role="user", parts=[types.Part(text=prompt)])],
        config=types.GenerateContentConfig(response_mime_type="application/json"),
    )

    data = json.loads(resp.text)
    return {
        "valid": bool(data.get("valid")),
        "normalized": (data.get("normalized") or "").strip(),
    }
