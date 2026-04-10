import os
from fastapi import FastAPI, UploadFile, File
from google.cloud import speech
from dotenv import load_dotenv
from google import genai
from groq import Groq
import json
import tempfile
import base64

load_dotenv()


credentials_b64 = os.getenv("GOOGLE_CREDENTIALS_BASE64")
if credentials_b64:
    credentials_json = base64.b64decode(credentials_b64).decode('utf-8')
    with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
        f.write(credentials_json)
        os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = f.name

app = FastAPI()

client = speech.SpeechClient()

gemini = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))

@app.get("/")
def root():
    return { "message": "AWAAZ backend is live" }

@app.post("/api/transcribe")
async def transcribe(file: UploadFile = File(...)):
    audio_data = await file.read()

    audio = speech.RecognitionAudio(content=audio_data)
    config = speech.RecognitionConfig (
        encoding=speech.RecognitionConfig.AudioEncoding.LINEAR16,
        sample_rate_hertz=48000,
        language_code="en-IN",
        alternative_language_codes=["hi-IN", "bn-IN"],
        enable_automatic_punctuation=True,
        audio_channel_count=2,
    )

    response = client.recognize(config=config, audio=audio)

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