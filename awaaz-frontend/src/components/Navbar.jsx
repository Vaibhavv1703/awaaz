import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { NAV_LINKS } from "../data";
import "./Navbar.css";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const userInfo = JSON.parse(localStorage.getItem('userInfo'));

  const handleLogout = () => {
    localStorage.removeItem('userInfo');
    navigate('/');
  };

  const isHome = location.pathname === '/';

  return (
    <nav className={`navbar ${scrolled ? "navbar--scrolled" : ""}`}>
      <div className="navbar__logo">
        <span className="navbar__dot" />
        <Link to="/" className="navbar__brand" style={{ textDecoration: 'none', color: 'inherit' }}>AWAAZ</Link>
      </div>
      <div className="navbar__links">
        {isHome ? (
            NAV_LINKS.map((l) => (
                <a key={l} href={`#${l.toLowerCase().replace(/ /g, "-")}`} className="navbar__link">
                    {l}
                </a>
            ))
        ) : (
            <Link to="/" className="navbar__link">Home</Link>
        )}
      </div>
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          {userInfo ? (
             <>
                <Link to="/dashboard" className="navbar__link" style={{ textDecoration: 'none' }}>Dashboard</Link>
                <button onClick={handleLogout} className="navbar__cta" style={{ background: 'transparent', border: '1px solid var(--border-mid)', color: 'var(--text)' }}>Logout</button>
             </>
          ) : (
             <>
                <Link to="/login" className="navbar__link" style={{ textDecoration: 'none' }}>Log In</Link>
                <button onClick={() => navigate('/register')} className="navbar__cta">Sign Up</button>
             </>
          )}
      </div>
    </nav>
  );
}