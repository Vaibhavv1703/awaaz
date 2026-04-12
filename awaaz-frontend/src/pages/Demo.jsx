import { useMemo, useState, useRef } from "react";
import { Link } from "react-router-dom";
import "./Demo.css";

const API_BASE_URL = "http://localhost:5000"; // Temporarily overridden for local testing

export default function Demo() {
  const [audioFile, setAudioFile] = useState(null);
  const [transcript, setTranscript] = useState("");
  const [accentLevel, setAccentLevel] = useState("");
  const [confidence, setConfidence] = useState(null);
  const [extracted, setExtracted] = useState(null);
  const [loadingStep, setLoadingStep] = useState("");
  const [error, setError] = useState("");

  const [sttProvider, setSttProvider] = useState("whisper");
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const canTranscribe = useMemo(() => !!audioFile && !loadingStep, [audioFile, loadingStep]);
  const canExtract = useMemo(
    () => !!transcript && !!accentLevel && !loadingStep,
    [transcript, accentLevel, loadingStep]
  );

  const handleFileChange = (event) => {
    const file = event.target.files?.[0] || null;
    setAudioFile(file);
    setError("");
    setTranscript("");
    setAccentLevel("");
    setConfidence(null);
    setExtracted(null);
  };

  const handleStartRecording = async () => {
    setError("");
    setAudioFile(null);
    setTranscript("");
    setExtracted(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const file = new File([audioBlob], "recording.webm", { type: "audio/webm" });
        setAudioFile(file);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      setError("Microphone access denied or unavailable.");
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
    }
  };

  const handleTranscribe = async () => {
    if (!audioFile) return;

    try {
      setLoadingStep("transcribing");
      setError("");

      const formData = new FormData();
      formData.append("file", audioFile);
      formData.append("sttProvider", sttProvider);

      const response = await fetch(`${API_BASE_URL}/api/transcribe`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Transcription failed (${response.status})`);
      }

      const data = await response.json();
      setTranscript(data.transcript || "");
      setAccentLevel(data.accent_level || "");
      setConfidence(typeof data.confidence === "number" ? data.confidence : null);
    } catch (err) {
      setError(err.message || "Unable to transcribe audio.");
    } finally {
      setLoadingStep("");
    }
  };

  const handleExtract = async () => {
    if (!transcript || !accentLevel) return;

    try {
      setLoadingStep("extracting");
      setError("");

      const response = await fetch(`${API_BASE_URL}/api/extract`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ transcript, accent_level: accentLevel }),
      });

      if (!response.ok) {
        throw new Error(`Extraction failed (${response.status})`);
      }

      const data = await response.json();
      setExtracted(data);
    } catch (err) {
      setError(err.message || "Unable to extract loan details.");
    } finally {
      setLoadingStep("");
    }
  };

  return (
    <main className="demo-page">
      <section className="demo-card">
        <h1 className="demo-title">AWAAZ Demo</h1>
        <p className="demo-subtitle">
          Connected to: <strong>{API_BASE_URL}</strong>
        </p>

        <div className="demo-controls">
          <div className="demo-provider-toggle">
            <span className="demo-label">STT Provider:</span>
            <label className="demo-radio">
              <input type="radio" value="whisper" checked={sttProvider === 'whisper'} onChange={(e) => setSttProvider(e.target.value)} /> Groq Whisper
            </label>
            <label className="demo-radio">
              <input type="radio" value="google" checked={sttProvider === 'google'} onChange={(e) => setSttProvider(e.target.value)} /> Google Cloud STT
            </label>
          </div>

          <div className="demo-input-group">
            <label htmlFor="audio-upload" className="demo-label">Upload audio file</label>
            <input id="audio-upload" type="file" accept="audio/*" onChange={handleFileChange} className="demo-file" disabled={isRecording} />
          </div>
          
          <div className="demo-record-controls">
            {isRecording ? (
              <button className="demo-btn demo-btn--danger" onClick={handleStopRecording}>⏹ Stop Recording</button>
            ) : (
              <button className="demo-btn demo-btn--ghost" onClick={handleStartRecording}>🎙 Record Voice</button>
            )}
            {audioFile && audioFile.name === "recording.webm" && !isRecording && (
                <span className="demo-meta" style={{marginLeft: '10px'}}>Recording attached!</span>
            )}
          </div>

          <div className="demo-actions">
            <button onClick={handleTranscribe} disabled={!canTranscribe} className="demo-btn">
              {loadingStep === "transcribing" ? "Transcribing..." : "Transcribe"}
            </button>
            <button onClick={handleExtract} disabled={!canExtract} className="demo-btn demo-btn--ghost">
              {loadingStep === "extracting" ? "Extracting..." : "Extract Loan Details"}
            </button>
            <Link to="/" className="demo-back-link">
              Back to Home
            </Link>
          </div>
        </div>

        {error ? (
          <p className="demo-error">{error}</p>
        ) : null}

        {transcript ? (
          <article className="demo-section">
            <h2>Transcript</h2>
            <p className="demo-transcript">{transcript}</p>
            <p className="demo-meta">
              Accent level: <strong>{accentLevel || "N/A"}</strong>
              {confidence !== null ? ` | Confidence: ${confidence}` : ""}
            </p>
          </article>
        ) : null}

        {extracted ? (
          <article className="demo-section">
            <h2>Extracted Loan Profile</h2>
            <pre className="demo-json">{JSON.stringify(extracted, null, 2)}</pre>
          </article>
        ) : null}
      </section>
    </main>
  );
}
