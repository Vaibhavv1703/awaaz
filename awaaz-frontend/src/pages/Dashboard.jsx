import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';
import '../components/Hero.css';

export default function Dashboard() {
    const [applications, setApplications] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        const userInfo = JSON.parse(localStorage.getItem('userInfo'));
        if (!userInfo) {
            navigate('/login');
            return;
        }

        const fetchApplications = async () => {
            try {
                const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
                const { data } = await axios.get('https://awaaz-backend2.onrender.com/api/audio/applications', config);
                setApplications(data);
            } catch (error) {
                console.error(error);
                if(error.response?.status === 401) {
                    localStorage.removeItem('userInfo');
                    navigate('/login');
                }
            }
        };

        fetchApplications();
    }, [navigate]);

    return (
        <>
            <Navbar />
            <section className="hero" style={{ minHeight: '100vh', paddingTop: '100px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div className="hero__grid-bg" />
                <div className="hero__glow" />
                <div className="hero__content hero__content--visible" style={{ width: '100%', maxWidth: '800px', margin: '0 auto' }}>
                    <h2 className="hero__title" style={{ fontSize: '3rem', marginBottom: '1rem', textAlign: 'left' }}>Dashboard</h2>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                        <p className="hero__subtitle" style={{ textAlign: 'left' }}>Your previous applications</p>
                        <Link to="/apply" style={{ padding: '0.8rem 1.5rem', background: 'var(--gold)', color: '#000', borderRadius: '30px', fontWeight: 'bold', textDecoration: 'none' }}>+ New Application</Link>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {applications.length === 0 ? (
                            <p style={{ color: 'var(--text-dim)' }}>No application history found. Start by creating a new one!</p>
                        ) : (
                            applications.map(app => (
                                <div key={app._id} style={{ background: 'var(--bg-card)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border)', textAlign: 'left' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <h3 style={{ fontSize: '1.2rem', color: 'var(--text)' }}>Loan evaluation ID: {app._id.slice(-6)}</h3>
                                            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{new Date(app.createdAt).toLocaleString()}</p>
                                        </div>
                                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                            <span style={{ background: app.evaluation_result.bias_detected ? '#ff4f4f20' : '#4fff8020', border: `1px solid ${app.evaluation_result.bias_detected ? '#ff4f4f' : '#4fff80'}`, padding: '0.3rem 0.6rem', borderRadius: '6px', fontSize: '0.8rem', color: app.evaluation_result.bias_detected ? '#ff4f4f' : '#4fff80' }}>
                                                {app.evaluation_result.bias_detected ? "Bias Corrected" : "Fair Application"}
                                            </span>
                                            <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--gold)' }}>
                                                {app.evaluation_result.final_decision}
                                            </span>
                                        </div>
                                    </div>
                                    <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
                                        <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem' }}><strong>Feedback:</strong> {app.evaluation_result.message}</p>
                                        <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem', marginTop: '0.5rem' }}><strong>Fairness score:</strong> {app.evaluation_result.fairness_score}/100</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </section>
        </>
    );
}