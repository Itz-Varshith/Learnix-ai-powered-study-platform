import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
model = genai.GenerativeModel("gemini-flash-latest")

def summarize_text(text, user_prompt):
    prompt = f"""
    You are an academic assistant.

    Summarize the following academic content clearly and concisely.
    Focus on:
    - Key concepts
    - Important definitions
    - Main results or conclusions
    - Here is the user provided prompt: {user_prompt}

    Content:
    {text[:12000]}
    """

    print("Calling Gemini...")
    response = model.generate_content(prompt)
    print("Gemini response received")

    return response.text
