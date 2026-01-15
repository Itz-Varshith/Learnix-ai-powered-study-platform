import os
import json
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
model = genai.GenerativeModel("gemini-flash-latest")


def get_response(text: str, memory: str = ""):
    """
    text   : current @AI mention message
    memory : privacy-safe summary from previous turns
    """

    prompt = f"""
        You are an AI assistant helping users in a group chat.

        IMPORTANT RULES:
        - Respect privacy
        - Do NOT include usernames or personal details
        - Use only the provided summary as memory

        Previous context summary:
        {memory if memory else "None"}

Current Question:
{text}

Provide a helpful educational response and create a brief privacy-safe summary of only the new academic content discussed.

OUTPUT FORMAT (STRICT JSON):
{{
    "response": "<your helpful response>",
    "summary": "<privacy-safe summary>"
}}
"""

    try:
        # Use JSON mode for reliable structured output
        response = model.generate_content(
            prompt,
            generation_config={
                "temperature": 0.7,
                "response_mime_type": "application/json"
            }
        )
        
        result = json.loads(response.text)
        answer = result.get("response", "I apologize, I couldn't generate a response.")
        summary = result.get("summary", "Unable to generate summary.")
        
    except (json.JSONDecodeError, Exception) as e:
        # Fallback to text parsing if JSON fails
        print(f"JSON parsing failed: {e}, falling back to text parsing")
        
        fallback_prompt = prompt + "\n\nFormat: RESPONSE:\n<response>\n\nSUMMARY:\n<summary>"
        response = model.generate_content(fallback_prompt)
        
        answer, summary = parse_output(response.text.strip())
    
    return answer, summary


def parse_output(text: str):
    """Fallback parser for non-JSON responses."""
    answer = ""
    summary = ""

    if "SUMMARY:" in text:
        parts = text.split("SUMMARY:", 1)
        answer = parts[0].replace("RESPONSE:", "").strip()
        summary = parts[1].strip()
    else:
        answer = text.replace("RESPONSE:", "").strip()
        summary = "No new information to summarize."

    return answer, summary
