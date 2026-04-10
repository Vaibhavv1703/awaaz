import os
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from google.cloud import speech
from dotenv import load_dotenv
from google import genai
from google.oauth2 import service_account
from groq import Groq
import json
import tempfile
import base64

load_dotenv()

b64 = os.getenv("GOOGLE_CREDS_BASE64")
credentials_json = base64.b64decode(b64).decode()
credentials_info = json.loads(credentials_json)
credentials = service_account.Credentials.from_service_account_info(credentials_info)
client = speech.SpeechClient(credentials=credentials)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://awaaz-production.up.railway.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

gemini = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))

@app.get("/")
def root():
    return { "message": "AWAAZ backend is live" }

@app.post("/api/transcribe")
async def transcribe(file: UploadFile = File(...)):
    print("✅ Request received")
    audio_data = await file.read()

    audio = speech.RecognitionAudio(content=audio_data)
    print("📁 File read, size:", len(audio_data))
    config = speech.RecognitionConfig (
        encoding=speech.RecognitionConfig.AudioEncoding.LINEAR16,
        sample_rate_hertz=48000,
        language_code="en-IN",
        alternative_language_codes=["hi-IN", "bn-IN"],
        enable_automatic_punctuation=True,
        audio_channel_count=2,
    )
    print("🚀 Calling Google Speech API...")
    response = client.recognize(config=config, audio=audio)
    print("✅ Got response from Google")
    if not response.results:
        return { "transcript": "", "message": "Could not transcribe audio" }

    transcript = response.results[0].alternatives[0].transcript
    confidence = response.results[0].alternatives[0].confidence

    # Map confidence to accent level
    if confidence >= 0.75:
        accent_level = "Low"
    elif confidence >= 0.50:
        accent_level = "Medium"
    else:
        accent_level = "High"

    return {
        "transcript": transcript,
        "confidence": round(confidence, 2),
        "accent_level": accent_level
    }

@app.post("/api/extract")
async def extract(data: dict):
    transcript = data.get("transcript")
    accent_level = data.get("accent_level")

    prompt = f"""
    Extract financial loan application details from this transcript and return ONLY a JSON object, no extra text.

    Transcript: "{transcript}"

    Return this exact JSON structure with your best guess for missing fields:
    {{
        "Gender": "Male or Female",
        "Married": "Yes or No",
        "Dependents": "0, 1, 2, or 3+",
        "Education": "Graduate or Not Graduate",
        "Self_Employed": "Yes or No",
        "ApplicantIncome": <number>,
        "CoapplicantIncome": <number>,
        "LoanAmount": <number in thousands>,
        "Loan_Amount_Term": <number in days, default 360>,
        "Credit_History": <1 if good, 0 if bad, default 1>,
        "Property_Area": "Urban, Semiurban, or Rural",
        "Income_Type": "Formal or Informal",
        "Accent_Level": "{accent_level}"
    }}
    """

    # response = gemini.models.generate_content(model="gemini-2.0-flash", contents=prompt)
    # text = response.text.strip().replace("```json", "").replace("```", "").strip()

    response = groq_client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{ "role": "user", "content": prompt }],
    )
    text = response.choices[0].message.content.strip().replace("```json", "").replace("```", "").strip()
    extracted = json.loads(text)

    return extracted