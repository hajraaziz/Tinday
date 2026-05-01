from fastapi import APIRouter, HTTPException
from schemas.models import UpdatePreferenceRequest
from services.preference_service import update_preferences

router = APIRouter()

@router.post("/update-preference")
async def update_user_preference(request: UpdatePreferenceRequest):
    try:
        success = update_preferences(
            request.user_id, 
            request.target_user_id, 
            request.direction
        )
        return {"success": success}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
