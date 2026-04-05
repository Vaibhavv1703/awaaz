import { useState } from "react";
import { useInView } from "../hooks/useInView";
import { FEATURES } from "../data";
import "./Features.css";

function FeatureCard({ f, index }) {
  const [hovered, setHovered] = useState(false);
  const [ref, inView] = useInView();
  return (
    <div
      ref={ref}
      className={`feature-card ${inView ? "feature-card--visible" : ""} ${hovered ? "feature-card--hovered" : ""}`}
      style={{ transitionDelay: `${index * 80}ms` }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="feature-card__icon">{f.icon}</div>
      <div className="feature-card__title">{f.title}</div>
      <div className="feature-card__desc">{f.desc}</div>
    </div>
  );
}

export default function Features() {
  return (
    <section className="features" id="features">
      <div className="features__inner">
        <div className="features__header">
          <div className="section-label">Features</div>
          <h2 className="features__title">Built for the underserved</h2>
        </div>
        <div className="features__grid">
          {FEATURES.map((f, i) => <FeatureCard key={i} f={f} index={i} />)}
        </div>
      </div>
    </section>
  );
}