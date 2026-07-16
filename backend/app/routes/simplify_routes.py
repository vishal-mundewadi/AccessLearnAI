from fastapi import APIRouter
from pydantic import BaseModel
from app.services.simplify_service import simplify_text

router = APIRouter()


class SimplifyRequest(BaseModel):
    text: str


@router.post("/simplify")
async def simplify_lecture_text(request: SimplifyRequest):
    simplified = simplify_text(request.text)
    return {
        "original": request.text,
        "simplified": simplified
    }