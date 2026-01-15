from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
from pdf_utils import extract_text_from_pdf_url
from gemini import summarize_text
from dotenv import load_dotenv
from flashcards import generate_flashcards
from quiz import generate_quiz
from mention import get_response
from fastapi import HTTPException

# Load environment variables
load_dotenv()

app = FastAPI()

# Allow frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:8000/summarize",
        "http://127.0.0.1:8000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# UPLOAD_DIR = "uploads"
# os.makedirs(UPLOAD_DIR, exist_ok=True)


@app.get("/")
def root():
    return {"status": "backend running"}



class SummarizeRequest(BaseModel):
    fileURL: str
    user_prompt: str

class FlashcardsRequest(BaseModel):
    fileURL: str
    n_cards: int = 10  # default to 10 flashcards if not specified

class QuizRequest(BaseModel):
    fileURL: str
    n_questions: int = 5  # default to 5 questions if not specified

class ChatbotRequest(BaseModel):
    user_prompt: str
    memory: str = ""

@app.post("/summarize")
async def summarize_pdf(request: SummarizeRequest):
    try:
        print(request)
        text = extract_text_from_pdf_url(request.fileURL)
        user_prompt = request.user_prompt
        if not text.strip():
            raise HTTPException(status_code=400, detail="No text found in PDF")

        text = text[:10000]
        summary = summarize_text(text, user_prompt)

        return {"summary": summary}

    except Exception as e:
        print("ERROR:", e)
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/flashcards")
async def flashcards(request: FlashcardsRequest):
    try:
        text = extract_text_from_pdf_url(request.fileURL)
        if not text.strip():
            raise HTTPException(status_code=400, detail="No text found in PDF")

        # limit tokens but keep coverage
        text = text[:12000]

        cards = generate_flashcards(text, n_cards=request.n_cards)

        return {"flashcards": cards}

    except Exception as e:
        print("ERROR:", e)
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/quiz")
async def quiz_endpoint(request: QuizRequest):
    try:
        text = extract_text_from_pdf_url(request.fileURL)
        if not text.strip():
            raise HTTPException(status_code=400, detail="No text found in PDF")

        print(f"DEBUG: Extracting quiz from {len(text)} chars...")

        # Generate Quiz
        quiz_data = generate_quiz(text, n_questions=request.n_questions)

        return {"quiz": quiz_data}

    except Exception as e:
        print("ERROR:", e)
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/mention")
async def mention(payload: dict):
    text = payload["text"]
    memory = payload.get("memory", "")

    answer, summary = get_response(text, memory)

    return {
        "response": answer,
        "summary": summary
    }

@app.post("/chatbot")
async def chatbot(request: ChatbotRequest):
    try:
        answer, summary = get_response(request.user_prompt, request.memory)
        return {
            "response": answer,
            "summary": summary
        }
    except Exception as e:
        print("ERROR:", e)
        raise HTTPException(status_code=500, detail=str(e))

# Add this import at the top
from google_classroom import router as google_router

# Add this line where you create your FastAPI app
# (after app = FastAPI())
app.include_router(google_router)
