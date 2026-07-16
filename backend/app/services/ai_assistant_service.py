import os
from google import genai
from dotenv import load_dotenv

load_dotenv()

_client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])

SYSTEM_INSTRUCTION = (
    "You are a Special Child, encouraging study assistant for a student using "
    "AccessLearnAI, an accessibility platform for lectures. The student may "
    "have hearing, vision, or learning difficulties. Explain concepts simply, "
    "in short sentences, and avoid jargon unless you also define it. Be warm "
    "and encouraging, never condescending."
)


def ask_ai(question: str, lecture_context: str = "") -> str:
    prompt = question
    if lecture_context:
        prompt = f"Lecture context:\n{lecture_context}\n\nStudent's question:\n{question}"

    response = _client.models.generate_content(
        model="gemini-3.5-flash",
        contents=prompt,
        config={"system_instruction": SYSTEM_INSTRUCTION},
    )
    return response.text