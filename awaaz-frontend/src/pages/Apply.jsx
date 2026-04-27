import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';
import '../components/Hero.css';

function Waveform({ active }) {
  return (
    <div className="waveform">
      {[...Array(12)].map((_, i) => (
        <div
          key={i}
          className={`waveform__bar ${active ? "waveform__bar--active" : ""}`}
          style={{ animationDelay: `${i * 60}ms` }}
        />
      ))}
    </div>
  );
}

export default function Apply() {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    
    // Step 1 State: Voice Recording
    const [isRecording, setIsRecording] = useState(false);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const mimeTypeRef = useRef('audio/webm');

    // Step 2 State: Processing
    const [loadingText, setLoadingText] = useState("Initializing...");
    const [transcript, setTranscript] = useState('');
    const [accentLevel, setAccentLevel] = useState('Medium');

    // Step 3 State: Extracted Data Form
    const [formData, setFormData] = useState({
        Gender: "", Married: "", Dependents: "0", Education: "", Self_Employed: "",
        ApplicantIncome: 0, CoapplicantIncome: 0, LoanAmount: 0, Loan_Amount_Term: 360,
        Credit_History: 1, Property_Area: "", Income_Type: "", Accent_Level: "Medium"
    });

    // Step 4 State: Results
    const [evaluationResult, setEvaluationResult] = useState(null);

    useEffect(() => {
        const userInfo = localStorage.getItem('userInfo');
        if (!userInfo) {
            navigate('/login');
        }

    }, [navigate]);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

            // Pick best supported MIME type (Groq Whisper accepts webm, ogg, mp4, wav, etc.)
            const supportedMime = [
                'audio/webm;codecs=opus',
                'audio/webm',
                'audio/ogg;codecs=opus',
                'audio/ogg',
                'audio/mp4',
            ].find(m => MediaRecorder.isTypeSupported(m)) || '';

            mimeTypeRef.current = supportedMime || 'audio/webm';
            const options = supportedMime ? { mimeType: supportedMime } : {};
            const mediaRecorder = new MediaRecorder(stream, options);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) audioChunksRef.current.push(event.data);
            };

            mediaRecorder.onstop = handleStopRecording;

            mediaRecorder.start();
            setIsRecording(true);
        } catch (err) {
            console.error('Error accessing microphone', err);
            alert('Cannot access microphone. Please allow microphone access in your browser settings and try again.');
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
        }
    };

    const handleStopRecording = async () => {
        // Use the same MIME type that was used during recording
        const mimeType = mimeTypeRef.current || 'audio/webm';
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        setStep(2);
        await processAudio(audioBlob, mimeType);
    };

    const processAudio = async (blob, mimeType = 'audio/webm') => {
        const userInfo = JSON.parse(localStorage.getItem('userInfo'));
        const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
        
        try {
            setLoadingText("Uploading and Transcribing...");
            const formDataFile = new FormData();
            // Use correct file extension based on actual recorded MIME type
            const ext = mimeType.includes('ogg') ? 'ogg' : mimeType.includes('mp4') ? 'mp4' : 'webm';
            formDataFile.append('file', blob, `audio.${ext}`);
            
            const transResponse = await axios.post('https://awaaz-backend2.onrender.com/api/audio/transcribe', formDataFile, {
                ...config,
                headers: { ...config.headers, 'Content-Type': 'multipart/form-data' }
            });

            if(!transResponse.data.transcript) {
                alert("Could not understand audio, please try again.");
                setStep(1); return;
            }

            setLoadingText("Extracting Financial Data...");
            setTranscript(transResponse.data.transcript);
            setAccentLevel(transResponse.data.accent_level);

            const extractResponse = await axios.post('https://awaaz-backend2.onrender.com/api/audio/extract', {
                transcript: transResponse.data.transcript,
                accent_level: transResponse.data.accent_level
            }, config);

            setFormData({ ...extractResponse.data, Accent_Level: transResponse.data.accent_level });
            setStep(3);

        } catch (error) {
            console.error(error);
            alert("Error processing audio. Please try again.");
            setStep(1);
        }
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        setStep(2);
        setLoadingText("Evaluating Fairness Models...");
        const userInfo = JSON.parse(localStorage.getItem('userInfo'));
        const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
        
        try {
            const { data } = await axios.post('https://awaaz-backend2.onrender.com/api/audio/evaluate', formData, config);
            setEvaluationResult(data.evaluation_result);
            setStep(4);
        } catch (error) {
            console.error(error);
            alert("Error evaluating the application.");
            setStep(3);
        }
    };

    return (
        <>
            <Navbar />
            <section className="hero" style={{ minHeight: '100vh', paddingTop: '100px' }}>
                <div className="hero__grid-bg" />
                <div className="hero__glow" />
                <div className="hero__content hero__content--visible" style={{ width: '100%', maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
                    <h2 className="hero__title" style={{ fontSize: '3rem', marginBottom: '2rem' }}>Loan Application</h2>

                    {step === 1 && (
                        <div style={{ background: 'var(--bg-card)', padding: '3rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
                            <p className="hero__subtitle" style={{ marginBottom: '2rem', fontSize: '1.2rem' }}>
                                Describe your loan requirements, financial background, and personal details naturally in English, Hindi, or Bengali.
                            </p>
                            <div className="hero__voice" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem', margin: '0 auto' }}>
                                <button
                                    className={`hero__mic ${isRecording ? "hero__mic--active" : ""}`}
                                    onClick={isRecording ? stopRecording : startRecording}
                                >
                                    {isRecording ? "⏹" : "🎙️"}
                                </button>
                                <Waveform active={isRecording} />
                                <span className="hero__voice-label">
                                    {isRecording ? "Recording... Click to stop" : "Click to speak"}
                                </span>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div style={{ background: 'var(--bg-card)', padding: '4rem', borderRadius: '12px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <div className="spinner" style={{ border: '4px solid var(--border-mid)', borderTopColor: 'var(--gold)', borderRadius: '50%', width: '40px', height: '40px', animation: 'spin 1s linear infinite', marginBottom: '1.5rem' }}></div>
                            <h3 className="hero__title" style={{ fontSize: '1.5rem', color: 'var(--gold)' }}>{loadingText}</h3>
                        </div>
                    )}

                    {step === 3 && (
                        <div style={{ background: 'var(--bg-card)', padding: '2rem', borderRadius: '12px', border: '1px solid var(--border)', textAlign: 'left' }}>
                            <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'var(--bg)', borderRadius: '8px', border: '1px solid var(--border-mid)' }}>
                                <h4 style={{ color: 'var(--gold)', marginBottom: '0.5rem' }}>Transcription Result</h4>
                                <p style={{ color: 'var(--text-dim)', fontStyle: 'italic' }}>"{transcript}"</p>
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', display: 'block', marginTop: '0.5rem' }}>Detected Accent: <strong style={{ color: 'var(--text)' }}>{accentLevel}</strong></span>
                            </div>

                            <form onSubmit={handleFormSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                                {Object.keys(formData).map(key => (
                                    <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                                        <label style={{ fontSize: '0.9rem', color: 'var(--text-dim)' }}>{key.replace(/_/g, ' ')}</label>
                                        <input
                                            type="text"
                                            value={formData[key]}
                                            onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
                                            style={{ padding: '0.8rem', background: 'var(--bg)', border: '1px solid var(--border-mid)', color: 'var(--text)', borderRadius: '6px' }}
                                        />
                                    </div>
                                ))}
                                <div style={{ gridColumn: '1 / -1', marginTop: '1rem' }}>
                                    <button type="submit" style={{ padding: '1rem', width: '100%', background: 'var(--gold)', color: '#000', fontWeight: 'bold', fontSize: '1.1rem', borderRadius: '8px', cursor: 'pointer', border: 'none' }}>
                                        Evaluate Application
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {step === 4 && evaluationResult && (
                        <div style={{ background: 'var(--bg-card)', padding: '2rem', borderRadius: '12px', border: '1px solid var(--border)', textAlign: 'left' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                                <div>
                                    <h3 style={{ fontSize: '1.2rem', color: 'var(--text-dim)' }}>Final Recommendation</h3>
                                    <h1 style={{ fontSize: '3rem', color: evaluationResult.final_decision === 'Approved' ? '#4fff80' : 'var(--gold)' }}>{evaluationResult.final_decision}</h1>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <h3 style={{ fontSize: '1.2rem', color: 'var(--text-dim)' }}>Fairness Score</h3>
                                    <h1 style={{ fontSize: '3rem', color: 'var(--text)' }}>{evaluationResult.fairness_score}<span style={{ fontSize: '1.5rem', color: 'var(--text-muted)' }}>/100</span></h1>
                                </div>
                            </div>
                            
                            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(200px, 1fr) minmax(200px, 1fr)', gap: '1rem' }}>
                                <div style={{ background: 'var(--bg)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-mid)' }}>
                                    <h4 style={{ color: 'var(--text-dim)', marginBottom: '0.5rem' }}>Raw Model Bias</h4>
                                    <p style={{ color: 'var(--text)', fontSize: '1.2rem', textDecoration: evaluationResult.bias_detected ? 'line-through' : 'none' }}>{evaluationResult.biased_decision}</p>
                                </div>
                                <div style={{ background: evaluationResult.bias_detected ? '#ff4f4f20' : '#4fff8020', padding: '1rem', borderRadius: '8px', border: `1px solid ${evaluationResult.bias_detected ? '#ff4f4f' : '#4fff80'}` }}>
                                    <h4 style={{ color: 'var(--text-dim)', marginBottom: '0.5rem' }}>Bias Detected?</h4>
                                    <p style={{ color: evaluationResult.bias_detected ? '#ff4f4f' : '#4fff80', fontSize: '1.2rem', fontWeight: 'bold' }}>{evaluationResult.bias_detected ? "Yes, Corrected" : "No"}</p>
                                </div>
                            </div>

                            <p style={{ marginTop: '2rem', padding: '1rem', borderLeft: '4px solid var(--gold)', background: 'var(--bg)', color: 'var(--text-muted)' }}>
                                <strong>Message: </strong>{evaluationResult.message}
                            </p>

                            <div style={{ marginTop: '2.5rem', display: 'flex', gap: '1rem' }}>
                                <button onClick={() => navigate('/dashboard')} style={{ padding: '0.8rem 1.5rem', background: 'transparent', border: '1px solid var(--gold)', color: 'var(--gold)', borderRadius: '6px', cursor: 'pointer', flex: 1 }}>Go to Dashboard</button>
                                <button onClick={() => setStep(1)} style={{ padding: '0.8rem 1.5rem', background: 'var(--gold)', border: 'none', color: '#000', borderRadius: '6px', cursor: 'pointer', flex: 1 }}>New Application</button>
                            </div>
                        </div>
                    )}
                </div>
            </section>
        </>
    );
}