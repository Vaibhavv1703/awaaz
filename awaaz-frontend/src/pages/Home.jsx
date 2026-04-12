import React from 'react';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import Stats from '../components/Stats';
import HowItWorks from '../components/HowItWorks';
import Features from '../components/Features';
import Impact from '../components/Impact';
import CTA from '../components/CTA';
import Footer from '../components/Footer';
import '../index.css';
import '../App.css';

export default function Home() {
    return (
        <>
            <Navbar />
            <Hero />
            <Stats />
            <HowItWorks />
            <Features />
            <Impact />
            <CTA />
            <Footer />
        </>
    );
}