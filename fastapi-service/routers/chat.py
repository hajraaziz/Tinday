from fastapi import APIRouter, HTTPException
from schemas.models import ChatRequest
from services.chat_service import get_chat_response

router = APIRouter()

@router.post("/chat")
async def chat_with_ai(request: ChatRequest):
    try:
        return await get_chat_response(
            request.user_id, 
            request.message, 
            request.conversation_history
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
