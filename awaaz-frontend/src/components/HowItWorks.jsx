import { useInView } from "../hooks/useInView";
import { STEPS } from "../data";
import "./HowItWorks.css";

function StepCard({ step, index }) {
  const [ref, inView] = useInView();
  return (
    <div
      ref={ref}
      className={`step-card ${inView ? "step-card--visible" : ""}`}
      style={{ transitionDelay: `${index * 120}ms` }}
    >
      <div className="step-card__number">{step.number}</div>
      <div className="step-card__icon">{step.icon}</div>
      <div className="step-card__body">
        <div className="step-card__title">{step.title}</div>
        <div className="step-card__desc">{step.desc}</div>
      </div>
    </div>
  );
}

export default function HowItWorks() {
  const [ref, inView] = useInView();
  return (
    <section className="how" id="how-it-works">
      <div className="how__inner">
        <div ref={ref} className={`how__heading ${inView ? "how__heading--visible" : ""}`}>
          <div className="section-label">How It Works</div>
          <h2 className="how__title">
            From spoken words<br />to <em>fair decisions</em>
          </h2>
          <p className="how__desc">
            AWAAZ runs a dual fairness pipeline — fixing bias at the input (voice)
            and the output (decision). Five layers work together so no applicant
            is turned away unfairly.
          </p>
        </div>
        <div className="how__steps">
          {STEPS.map((step, i) => <StepCard key={i} step={step} index={i} />)}
        </div>
      </div>
    </section>
  );
}