from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import shutil
import os
from app.database import Base, engine
from app.routes.asr_routes import router as asr_router
from app.routes.simplify_routes import router as simplify_router
from app.routes.tts_routes import router as tts_router
from app.routes.braille_routes import router as braille_router
from app.routes.auth_routes import router as auth_router
from app.routes.ai_assistant_routes import router as ai_assistant_router

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="AccessLearnAI"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(asr_router)
app.include_router(simplify_router)
app.include_router(tts_router)
app.include_router(braille_router)
app.include_router(auth_router)
app.include_router(ai_assistant_router)

UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)


@app.get("/")
def home():
    return {
        "message": "AccessLearnAI Backend Running"
    }


@app.post("/upload")
async def upload_lecture(
    file: UploadFile = File(...)
):
    file_path = os.path.join(UPLOAD_FOLDER, file.filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    return {
        "message": "Lecture uploaded",
        "filename": file.filename
    }