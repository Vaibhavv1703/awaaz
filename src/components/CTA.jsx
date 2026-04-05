import "./CTA.css";

export default function CTA() {
  return (
    <section className="cta">
      <div className="cta__inner">
        <h2 className="cta__title">
          Ready to hear<br />
          <em className="cta__title-em">every voice?</em>
        </h2>
        <p className="cta__desc">
          Try the AWAAZ demo — experience what fair, voice-first lending actually feels like.
        </p>
        <button className="cta__btn">Try the Demo →</button>
      </div>
    </section>
  );
}