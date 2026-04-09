import { useInView } from "../hooks/useInView";
import { IMPACT_COLS } from "../data";
import "./Impact.css";

export default function Impact() {
  const [ref, inView] = useInView();
  return (
    <section className="impact" id="impact">
      <div className="impact__inner">
        <div className="section-label">Impact</div>
        <blockquote ref={ref} className={`impact__quote ${inView ? "impact__quote--visible" : ""}`}>
          "Meena, a vegetable vendor from Murshidabad, was rejected three times —
          not because of her risk, but because of her accent and her postcode.
          AWAAZ approved her in minutes."
        </blockquote>
        <div className="impact__grid">
          {IMPACT_COLS.map((col, i) => (
            <div key={i} className={`impact__col ${i === 1 ? "impact__col--gold" : ""}`}>
              <div className="impact__col-label">{col.label}</div>
              {col.items.map((item, j) => (
                <div key={j} className="impact__col-item">{item}</div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}