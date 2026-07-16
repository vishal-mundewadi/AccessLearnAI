from fastapi import APIRouter
from fastapi.responses import FileResponse
from pydantic import BaseModel
from app.services.tts_service import text_to_speech
import uuid

router = APIRouter()


class TTSRequest(BaseModel):
    text: str


@router.post("/speak")
async def speak_text(request: TTSRequest):
    filename = f"{uuid.uuid4()}.mp3"
    output_path = await text_to_speech(request.text, filename)

    return FileResponse(
        output_path,
        media_type="audio/mpeg",
        filename=filename
    )