from fastapi import APIRouter, HTTPException
from schemas.models import ValidateTagRequest
from services.validation_service import validate_tag

router = APIRouter()


@router.post("/validate-tag")
async def validate_tag_endpoint(request: ValidateTagRequest):
    try:
        return await validate_tag(request.value, request.kind)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
