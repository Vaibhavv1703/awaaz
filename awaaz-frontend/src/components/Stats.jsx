import { useInView } from "../hooks/useInView";
import { STATS } from "../data";
import "./Stats.css";

function StatCard({ value, label, delay }) {
  const [ref, inView] = useInView();
  return (
    <div
      ref={ref}
      className={`stat-card ${inView ? "stat-card--visible" : ""}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className="stat-card__value">{value}</div>
      <div className="stat-card__label">{label}</div>
    </div>
  );
}

export default function Stats() {
  return (
    <section className="stats">
      <div className="stats__grid">
        {STATS.map((s, i) => <StatCard key={i} {...s} delay={i * 100} />)}
      </div>
    </section>
  );
}