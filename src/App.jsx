import "./index.css";
import "./App.css";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Stats from "./components/Stats";
import HowItWorks from "./components/HowItWorks";
import Features from "./components/Features";
import Impact from "./components/Impact";
import CTA from "./components/CTA";
import Footer from "./components/Footer";

export default function App() {
  return (
    <div className="app">
      <link
        href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,400&family=DM+Sans:wght@300;400;500;600&family=DM+Mono&display=swap"
        rel="stylesheet"
      />
      <Navbar />
      <Hero />
      <Stats />
      <HowItWorks />
      <Features />
      <Impact />
      <CTA />
      <Footer />
    </div>
  );
}