from fastapi import APIRouter
from pydantic import BaseModel
from app.services.ai_assistant_service import ask_ai

router = APIRouter()


class AskRequest(BaseModel):
    question: str
    lecture_context: str = ""


@router.post("/ask")
async def ask(request: AskRequest):
    answer = ask_ai(request.question, request.lecture_context)
    return {"answer": answer}