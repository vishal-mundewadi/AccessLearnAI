from fastapi import APIRouter
from pydantic import BaseModel
from app.services.braille_service import text_to_braille

router = APIRouter()


class BrailleRequest(BaseModel):
    text: str


@router.post("/braille")
async def convert_to_braille(request: BrailleRequest):
    braille_output = text_to_braille(request.text)
    return {
        "original": request.text,
        "braille": braille_output
    }