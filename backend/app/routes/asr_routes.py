from fastapi import APIRouter, UploadFile, File
import shutil
import os
from app.services.asr_service import transcribe_audio

router = APIRouter()

UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)


@router.post("/transcribe")
async def transcribe_lecture(file: UploadFile = File(...)):
    file_path = os.path.join(UPLOAD_FOLDER, file.filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    result = transcribe_audio(file_path)

    return {
        "message": "Transcription complete",
        "filename": file.filename,
        "transcript": result["text"],
        "language": result["language"],
        "segments": result["segments"]
    }