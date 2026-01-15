from fastapi import APIRouter, HTTPException, Query
from googleapiclient.discovery import build
from google.oauth2.credentials import Credentials
import os
import requests
from dotenv import load_dotenv

load_dotenv()

router = APIRouter(prefix="/google", tags=["Google Classroom"])

# Google OAuth2 configuration
SCOPES = [
    'https://www.googleapis.com/auth/classroom.courses.readonly',
    'https://www.googleapis.com/auth/classroom.announcements.readonly',
    'https://www.googleapis.com/auth/classroom.coursework.me.readonly',
    'https://www.googleapis.com/auth/classroom.courseworkmaterials.readonly',
    'https://www.googleapis.com/auth/classroom.student-submissions.me.readonly'
]

CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
REDIRECT_URI = os.getenv("GOOGLE_REDIRECT_URI")

# Temporary storage for tokens (in-memory)
user_tokens = {}


@router.get("/login")
async def google_login():
    """
    Initiates Google OAuth2 flow
    """
    try:
        import secrets
        
        # Generate state manually
        state = secrets.token_urlsafe(32)
        
        # Build authorization URL manually
        scope_string = " ".join(SCOPES)
        authorization_url = (
            f"https://accounts.google.com/o/oauth2/v2/auth?"
            f"client_id={CLIENT_ID}&"
            f"redirect_uri={REDIRECT_URI}&"
            f"response_type=code&"
            f"scope={scope_string}&"
            f"access_type=offline&"
            f"prompt=consent&"
            f"state={state}"
        )
        
        print(f"[LOGIN] Generated state: {state}")
        
        return {"authorization_url": authorization_url, "state": state}
    
    except Exception as e:
        print(f"[LOGIN ERROR] {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error initiating login: {str(e)}")


@router.get("/callback")
async def google_callback(code: str = Query(...), state: str = Query(...)):
    """
    Handles the OAuth2 callback from Google
    """
    try:
        print(f"[CALLBACK] Processing code for state: {state}")
        
        # Exchange authorization code for tokens manually
        token_url = "https://oauth2.googleapis.com/token"
        token_data = {
            "code": code,
            "client_id": CLIENT_ID,
            "client_secret": CLIENT_SECRET,
            "redirect_uri": REDIRECT_URI,
            "grant_type": "authorization_code"
        }
        
        print(f"[CALLBACK] Exchanging code for tokens...")
        response = requests.post(token_url, data=token_data)
        
        if response.status_code != 200:
            print(f"[CALLBACK ERROR] Token exchange failed: {response.text}")
            raise HTTPException(status_code=500, detail=f"Token exchange failed: {response.text}")
        
        token_response = response.json()
        
        print(f"[CALLBACK] Token obtained successfully")
        print(f"[CALLBACK] Scopes granted: {token_response.get('scope', 'N/A')}")
        
        # Store credentials
        user_tokens[state] = {
            'token': token_response['access_token'],
            'refresh_token': token_response.get('refresh_token'),
            'token_uri': 'https://oauth2.googleapis.com/token',
            'client_id': CLIENT_ID,
            'client_secret': CLIENT_SECRET,
            'scopes': token_response.get('scope', '').split()
        }
        
        print(f"[CALLBACK] Token stored for state: {state}")
        print(f"[CALLBACK] Total stored tokens: {len(user_tokens)}")
        print(f"[CALLBACK] Available states: {list(user_tokens.keys())}")
        
        return {"message": "Authentication successful", "state": state}
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"[CALLBACK ERROR] {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error in callback: {str(e)}")


@router.get("/courses")
async def get_courses(state: str = Query(...)):
    """
    Fetches all courses for the authenticated user
    """
    try:
        print(f"[COURSES] Requesting courses for state: {state}")
        print(f"[COURSES] Available states in memory: {list(user_tokens.keys())}")
        
        if state not in user_tokens:
            print(f"[COURSES ERROR] State '{state}' not found in stored tokens")
            raise HTTPException(status_code=401, detail="User not authenticated. Please login again.")
        
        # Reconstruct credentials
        creds_data = user_tokens[state]
        credentials = Credentials(
            token=creds_data['token'],
            refresh_token=creds_data['refresh_token'],
            token_uri=creds_data['token_uri'],
            client_id=creds_data['client_id'],
            client_secret=creds_data['client_secret'],
            scopes=creds_data['scopes']
        )
        
        print(f"[COURSES] Building Classroom service...")
        
        # Build the Classroom API service
        service = build('classroom', 'v1', credentials=credentials)
        
        # Fetch courses
        print(f"[COURSES] Fetching courses from Google Classroom...")
        results = service.courses().list(pageSize=100).execute()
        courses = results.get('courses', [])
        
        print(f"[COURSES] Successfully fetched {len(courses)} courses")
        
        return {"courses": courses}
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"[COURSES ERROR] {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error fetching courses: {str(e)}")