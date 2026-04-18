import Groq from 'groq-sdk';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import os from 'os';
import Application from '../models/Application.js';
import speech from '@google-cloud/speech';

// Setup Groq client (used for both transcription AND extraction)
const getGroqClient = () => {
    let key = process.env.GROQ_API_KEY ? process.env.GROQ_API_KEY.trim() : '';
    if (!key || key === 'your_groq_api_key_here') {
        console.warn("WARNING: GROQ_API_KEY is not set properly.");
    }
    return new Groq({ apiKey: key || 'dummy_key_to_prevent_startup_crash' });
};

// Setup Google Speech client
const getGoogleSpeechClient = () => {
    let credentials;
    if (process.env.GOOGLE_CREDS_BASE64) {
        try {
            credentials = JSON.parse(Buffer.from(process.env.GOOGLE_CREDS_BASE64.trim(), 'base64').toString('utf8'));
        } catch (e) {
            console.error("Failed to parse GOOGLE_CREDS_BASE64", e);
        }
    }
    return new speech.SpeechClient(credentials ? { credentials } : undefined);
};

// Local fallback extractor using regex — runs when Groq quota is exceeded
const localExtract = (transcript, accent_level) => {
    const t = transcript.toLowerCase();
    const num = (pattern) => {
        const m = t.match(pattern);
        return m ? parseInt(m[1].replace(/,/g, '')) : 0;
    };
    return {
        Gender:            /\bfemale\b|\bwoman\b|\bshe\b/.test(t) ? 'Female' : 'Male',
        Married:           /\bmarried\b|\bwife\b|\bhusband\b|\bspouse\b/.test(t) ? 'Yes' : 'No',
        Dependents:        /\b3\+?\s*(?:children|kids|dependents?)\b/.test(t) ? '3+' :
                           String(num(/\b(\d)\s*(?:children|kids|dependents?)/) || 0),
        Education:         /\bgraduate\b|\bdegree\b|\bcollege\b|\buniversity\b/.test(t) ? 'Graduate' : 'Not Graduate',
        Self_Employed:     /\bself.?employ|\bbusiness\b|\bfreelance\b|\bown\s+(?:a\s+)?(?:shop|company|firm)\b/.test(t) ? 'Yes' : 'No',
        ApplicantIncome:   num(/(?:income|earn|salary|make)\D{0,20}?(\d[\d,]*)/) || 30000,
        CoapplicantIncome: num(/co.?applicant\D{0,20}?(\d[\d,]*)/) || 0,
        LoanAmount:        num(/(?:loan|borrow|need)\D{0,20}?(\d[\d,]*)/) || 150000,
        Loan_Amount_Term:  360,
        Credit_History:    /\bbad\s+credit\b|\blow\s+credit\b|\bno\s+credit\b/.test(t) ? 0 : 1,
        Property_Area:     /\burban\b|\bcity\b/.test(t) ? 'Urban' : /\bsemiurban\b|\btown\b|\bsuburb\b/.test(t) ? 'Semiurban' : 'Rural',
        Income_Type:       /\binformal\b|\bcash\b|\bdaily\s+wage\b|\bdaily\s+labour\b/.test(t) ? 'Informal' : /\bself.?employ\b|\bfreelance\b|\bbusiness\b/.test(t) ? 'Self_Employed' : 'Salaried',
        Accent_Level:      accent_level || 'Low',
    };
};

// Use OS temporary directory for cross-platform compatibility (Linux/Windows)
const TEMP_DIR = path.join(os.tmpdir(), 'awaaz_audio');
if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true });

export const transcribe = async (req, res) => {
    let tempFileInput = null;
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const sttProvider = req.body.sttProvider || 'whisper'; // 'whisper' or 'google'

        const mimeType = req.file.mimetype || 'audio/webm';
        let ext = 'webm';
        if (mimeType.includes('ogg')) ext = 'ogg';
        else if (mimeType.includes('mp4')) ext = 'mp4';
        else if (mimeType.includes('wav')) ext = 'wav';
        else if (mimeType.includes('mp3') || mimeType.includes('mpeg')) ext = 'mp3';

        tempFileInput = path.join(TEMP_DIR, `input-${Date.now()}.${ext}`);
        fs.writeFileSync(tempFileInput, req.file.buffer);
        console.log(`[Transcribe] Provider: ${sttProvider}, MIME: ${mimeType}, ext: .${ext}, size: ${req.file.buffer.length} bytes`);

        let transcript = "";
        let confidence = 0.85;

        if (sttProvider === 'google') {
            const client = getGoogleSpeechClient();
            // Defaulting config to WEBM_OPUS at 48000Hz (common for browser MediaRecorder)
            const config = {
                encoding: ext === 'webm' ? 'WEBM_OPUS' : undefined,
                sampleRateHertz: ext === 'webm' ? 48000 : undefined,
                languageCode: 'en-US',
                enableAutomaticPunctuation: true,
            };
            const request = {
                audio: { content: req.file.buffer.toString('base64') },
                config: config,
            };

            const [response] = await client.recognize(request);
            if (response && response.results) {
                transcript = response.results
                    .map(result => result.alternatives[0].transcript)
                    .join('\n');
                
                // If the top phrase has a confidence, use it
                if (response.results[0] && response.results[0].alternatives[0] && typeof response.results[0].alternatives[0].confidence === 'number') {
                    confidence = response.results[0].alternatives[0].confidence;
                }
            } else {
                return res.status(200).json({ transcript: "", message: "Empty speech response from Google" });
            }

        } else {
            // Whisper flow
            const groq = getGroqClient();
            const transcription = await groq.audio.transcriptions.create({
                file: fs.createReadStream(tempFileInput),
                model: "whisper-large-v3-turbo",
                response_format: "json",
                language: "en",
                temperature: 0.0,
            });

            if (!transcription || !transcription.text) {
                return res.status(200).json({ transcript: "", message: "Could not transcribe audio" });
            }
            transcript = transcription.text;
        }

        const accent_level = confidence >= 0.75 ? "Low" : confidence >= 0.50 ? "Medium" : "High";

        res.status(200).json({ transcript, confidence: Math.round(confidence * 100) / 100, accent_level });
    } catch (error) {
        console.error("Transcription error:", error.message);
        res.status(500).json({ message: "Error transcribing audio", error: error.message });
    } finally {
        if (tempFileInput && fs.existsSync(tempFileInput)) {
            try { fs.unlinkSync(tempFileInput); } catch (_) {}
        }
    }
};

export const extract = async (req, res) => {
    try {
        const { transcript, accent_level } = req.body;

        if (!transcript) {
            return res.status(400).json({ message: 'Transcript is required' });
        }

        const prompt = `Extract financial loan application details from this transcript. Return ONLY a valid JSON object with no extra text, explanations, or markdown code blocks.

Transcript: "${transcript}"

Return exactly this JSON structure (fill in your best guess for anything not mentioned):
{
    "Gender": "Male or Female",
    "Married": "Yes or No",
    "Dependents": "0, 1, 2, or 3+",
    "Education": "Graduate or Not Graduate",
    "Self_Employed": "Yes or No",
    "ApplicantIncome": <exact number (e.g. 50000)>,
    "CoapplicantIncome": <exact number (e.g. 0)>,
    "LoanAmount": <exact number (e.g. 150000)>,
    "Loan_Amount_Term": <number in days, default 360>,
    "Credit_History": <1 if good credit, 0 if bad, default 1>,
    "Property_Area": "Urban, Semiurban, or Rural",
    "Income_Type": "Informal, Salaried, or Self_Employed",
    "Accent_Level": "${accent_level || 'Low'}"
}`;

        try {
            const groq = getGroqClient();
            const completion = await groq.chat.completions.create({
                model: "llama-3.3-70b-versatile",
                messages: [
                    {
                        role: "system",
                        content: "You are a financial data extraction assistant. Always respond with only valid JSON, no markdown, no explanation."
                    },
                    { role: "user", content: prompt }
                ],
                temperature: 0.1,
                max_tokens: 512,
            });

            let text = completion.choices[0]?.message?.content || "{}";
            text = text.replace(/```json/g, '').replace(/```/g, '').trim();
            console.log(`[Extract] Groq LLM response: ${text}`);

            try {
                const extracted = JSON.parse(text);
                return res.status(200).json(extracted);
            } catch (parseErr) {
                console.error("[Extract] JSON parse failed, using regex fallback. Raw:", text);
                return res.status(200).json(localExtract(transcript, accent_level));
            }

        } catch (groqErr) {
            const isQuota = groqErr?.status === 429 || groqErr?.status === 503;
            console.error(`[Extract] Groq LLM error (${groqErr?.status}):`, groqErr?.message);
            if (isQuota) {
                console.warn('[Extract] Groq quota hit — using local regex fallback');
            }
            // Always fall back gracefully
            return res.status(200).json(localExtract(transcript, accent_level));
        }

    } catch (error) {
        console.error("Extraction error:", error?.message || error);
        res.status(500).json({ message: "Error extracting financial specifics", error: error.message });
    }
};

export const evaluate = async (req, res) => {
    try {
        const inputData = req.body;

        const pythonResponse = await axios.post(process.env.PYTHON_ML_URL || 'http://localhost:8000/evaluate', inputData);

        const parsedDecision = (decision) => decision === 1 ? "Approved" : "Rejected";

        const evaluationResult = {
            final_decision: parsedDecision(pythonResponse.data.final_decision),
            biased_decision: parsedDecision(pythonResponse.data.biased_decision),
            bias_detected: pythonResponse.data.bias_detected,
            fairness_score: pythonResponse.data.fairness_score,
            message: pythonResponse.data.bias_detected
                ? "Bias detected and corrected by the fairness model."
                : "No significant bias detected. Your application is processed fairly.",
        };

        // Save to MongoDB
        const application = await Application.create({
            user: req.user._id,
            input_data: inputData,
            accent_level: inputData.Accent_Level || 'Medium',
            evaluation_result: {
                final_decision: evaluationResult.final_decision,
                biased_decision: evaluationResult.biased_decision,
                bias_detected: evaluationResult.bias_detected,
                fairness_score: evaluationResult.fairness_score,
                message: evaluationResult.message,
            }
        });

        res.status(200).json({ evaluation_result: evaluationResult, application });
    } catch (error) {
        console.error("Evaluation error:", error);
        res.status(500).json({ message: "Error evaluating via ML microservice", error: error.message });
    }
};

export const getApplications = async (req, res) => {
    try {
        const apps = await Application.find({ user: req.user._id }).sort({ createdAt: -1 });
        res.status(200).json(apps);
    } catch (error) {
        res.status(500).json({ message: "Error fetching applications", error: error.message });
    }
};