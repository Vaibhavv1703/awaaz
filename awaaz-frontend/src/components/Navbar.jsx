import { useState, useEffect } from "react";
import { NAV_LINKS } from "../data";
import "./Navbar.css";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav className={`navbar ${scrolled ? "navbar--scrolled" : ""}`}>
      <div className="navbar__logo">
        <span className="navbar__dot" />
        <span className="navbar__brand">AWAAZ</span>
      </div>
      <div className="navbar__links">
        {NAV_LINKS.map((l) => (
          <a key={l} href={`#${l.toLowerCase().replace(/ /g, "-")}`} className="navbar__link">
            {l}
          </a>
        ))}
      </div>
      <button className="navbar__cta">Try Demo</button>
    </nav>
  );
}