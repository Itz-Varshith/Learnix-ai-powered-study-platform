import os
import json
import warnings
from dotenv import load_dotenv

import google.generativeai as genai

# -----------------------------
# Silence noisy warnings
# -----------------------------
warnings.filterwarnings(
    "ignore",
    message="Field name .* shadows an attribute in parent .*"
)

# -----------------------------
# Load environment variables
# -----------------------------
load_dotenv()

API_KEY = os.getenv("GEMINI_API_KEY")
if not API_KEY:
    raise RuntimeError("❌ GEMINI_API_KEY not found in environment variables")

# -----------------------------
# Configure OLD Gemini SDK
# -----------------------------
genai.configure(api_key=API_KEY)

model = genai.GenerativeModel(
    model_name="gemini-flash-latest"
)

# -----------------------------
# Quiz Generator
# -----------------------------
def generate_quiz(text: str, n_questions: int = 5):
    print("\n--- QUIZ GENERATION START ---")

    # 1. Input validation
    if not text or len(text.strip()) < 50:
        print("❌ ERROR: Text is empty or too short.")
        return []

    # -----------------------------
    # SYSTEM + USER INSTRUCTIONS
    # -----------------------------
    prompt = f"""
SYSTEM INSTRUCTIONS (MANDATORY):
You are an intelligent quiz-generation engine.

Analyze the provided text and generate exactly {n_questions}
multiple-choice questions.

CORE BEHAVIOR RULES:
1. If the text is EDUCATIONAL CONTENT:
   - Ask conceptual and understanding-based questions.
2. If the text is STRUCTURED DATA (ranklist, scoreboard, table, etc.):
   - Ask data-analysis questions
     (e.g., "Which team secured Rank 1?",
            "What is the score of Team X?").
3. If the text is INSUFFICIENT, RANDOM, or MEANINGLESS:
   - Return an empty JSON array [].

OUTPUT FORMAT RULES (CRITICAL):
- Output ONLY valid JSON
- No markdown
- No explanations
- No comments
- No trailing text
- Strictly follow the schema below

JSON SCHEMA:
[
  {{
    "question": "string",
    "options": {{
      "A": "string",
      "B": "string",
      "C": "string",
      "D": "string"
    }},
    "answer": "A" | "B" | "C" | "D"
  }}
]

TEXT TO ANALYZE:
{text[:15000]}
"""

    try:
        print("📡 Sending request to Gemini (OLD SDK)...")

        response = model.generate_content(
            prompt,
        )

        if not response or not response.text:
            print("❌ ERROR: Empty response from Gemini.")
            return []

        # -----------------------------
        # Parse & Validate JSON
        # -----------------------------
        parsed_data = json.loads(response.text)

        if not isinstance(parsed_data, list):
            print("❌ ERROR: Output is not a JSON array.")
            return []

        print(f"✅ Generated {len(parsed_data)} questions.")
        # print(parsed_data)
        return parsed_data

    except json.JSONDecodeError:
        print("❌ ERROR: Gemini returned invalid JSON.")
        print("---- RAW OUTPUT ----")
        print(response.text)
        print("--------------------")
        return []

    except Exception as e:
        print(f"❌ QUIZ ERROR: {e}")
        return []
