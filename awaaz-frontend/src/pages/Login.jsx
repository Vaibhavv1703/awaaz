import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';
import '../components/Hero.css';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const { data } = await axios.post('http://localhost:5000/api/auth/login', { email, password });
            localStorage.setItem('userInfo', JSON.stringify(data));
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || err.message);
        }
    };

    return (
        <>
            <Navbar />
            <section className="hero" style={{ minHeight: '100vh', paddingTop: '100px' }}>
                <div className="hero__grid-bg" />
                <div className="hero__glow" />
                <div className="hero__content hero__content--visible" style={{ maxWidth: '400px', margin: '0 auto', background: 'var(--bg-card)', padding: '2rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
                    <h2 className="hero__title" style={{ fontSize: '2.5rem', marginBottom: '1.5rem' }}>Log In</h2>
                    {error && <p style={{ color: '#ff6b6b', marginBottom: '1rem' }}>{error}</p>}
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <input 
                            type="email" 
                            placeholder="Email address" 
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            style={{ padding: '0.8rem', background: 'var(--bg)', border: '1px solid var(--border-mid)', color: 'var(--text)', borderRadius: '6px' }}
                            required
                        />
                        <input 
                            type="password" 
                            placeholder="Password" 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            style={{ padding: '0.8rem', background: 'var(--bg)', border: '1px solid var(--border-mid)', color: 'var(--text)', borderRadius: '6px' }}
                            required
                        />
                        <button type="submit" className="hero__mic" style={{ fontSize: '1rem', padding: '0.8rem', width: '100%', aspectRatio: 'auto', borderRadius: '6px', background: 'var(--gold)', color: '#000', cursor: 'pointer' }}>
                            Log In
                        </button>
                    </form>
                    <p style={{ marginTop: '1.5rem', color: 'var(--text-dim)', textAlign: 'center' }}>
                        Don't have an account? <Link to="/register" style={{ color: 'var(--gold)' }}>Register</Link>
                    </p>
                </div>
            </section>
        </>
    );
}