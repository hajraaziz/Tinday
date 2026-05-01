from fastapi import APIRouter, HTTPException
from schemas.models import EmbedRequest
from services.embedding_service import generate_embedding

router = APIRouter()

@router.post("/embed")
async def embed_profile(request: EmbedRequest):
    try:
        generate_embedding(request.user_id, request.profile_text)
        return {"success": True, "user_id": request.user_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
