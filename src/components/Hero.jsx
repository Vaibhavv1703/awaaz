import { useState, useEffect } from "react";
import { useInView } from "../hooks/useInView";
import "./Hero.css";

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

export default function Hero() {
  const [voiceActive, setVoiceActive] = useState(false);
  const [ref, inView] = useInView(0.01);

  useEffect(() => {
    if (voiceActive) {
      const t = setTimeout(() => setVoiceActive(false), 4000);
      return () => clearTimeout(t);
    }
  }, [voiceActive]);

  return (
    <section className="hero" id="about" ref={ref}>
      <div className="hero__grid-bg" />
      <div className="hero__glow" />

      <div className={`hero__content ${inView ? "hero__content--visible" : ""}`}>
        <div className="hero__badge">
          <span className="hero__badge-dot" />
          Voice-First · Fairness-Aware · Microfinance AI
        </div>

        <h1 className="hero__title">
          Every voice<br />
          <em className="hero__title-em">deserves</em> to be<br />
          heard.
        </h1>

        <p className="hero__subtitle">
          AWAAZ is a voice-first, fairness-aware AI that makes microfinance
          accessible — regardless of accent, language, or background.
        </p>

        <div className="hero__voice">
          <button
            className={`hero__mic ${voiceActive ? "hero__mic--active" : ""}`}
            onClick={() => setVoiceActive((v) => !v)}
          >
            {voiceActive ? "⏹" : "🎙️"}
          </button>
          <Waveform active={voiceActive} />
          <span className="hero__voice-label">
            {voiceActive ? "Listening... बोलिए / বলুন" : "Click to speak"}
          </span>
        </div>
      </div>

      <div className="hero__scroll-hint">
        <span>scroll</span>
        <div className="hero__scroll-line" />
      </div>
    </section>
  );
}