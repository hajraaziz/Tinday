from fastapi import APIRouter, HTTPException
from schemas.models import RecommendRequest
from services.recommendation_service import get_recommendations

router = APIRouter()

@router.post("/recommend")
async def recommend_profiles(request: RecommendRequest):
    try:
        filters = request.filters.dict() if request.filters else {}
        ranked_ids = get_recommendations(
            request.user_id, 
            filters, 
            request.limit, 
            request.exclude_ids
        )
        return {"ranked_user_ids": ranked_ids}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
