import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  ArrowRight,
  Award,
  ChevronRight,
  Dumbbell,
  Fingerprint,
  Flame,
  KeyRound,
  Lock,
  LogIn,
  Quote,
  ShieldCheck,
  Sparkles,
  UserCheck,
  UserPlus,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { Landing3DScene } from "@/components/3d/Landing3DScene";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getAthleteProfile, saveAthleteProfile } from "@/lib/user-store";
import "./Landing.css";

const motivatingQuotes = [
  {
    quote: "Discipline is the bridge between kinetic signal and physical reality.",
    author: "Kinetic Principle 01",
    tag: "MINDSET",
  },
  {
    quote: "The iron never lies to you. 200 pounds is always 200 pounds.",
    author: "Henry Rollins",
    tag: "STRENGTH",
  },
  {
    quote: "Master the resistance, command the stimulus. Outwork yesterday.",
    author: "Elite Conditioning Protocol",
    tag: "ADAPTATION",
  },
  {
    quote: "Your physique is an engineered system. Calibrate it with precision.",
    author: "FitTrack Anatomy Engine",
    tag: "PRECISION",
  },
  {
    quote: "Fatigue is merely a biological metric. Growth is a calculated choice.",
    author: "Performance Lab",
    tag: "HYPERTROPHY",
  },
];

export default function Landing() {
  const [, setLocation] = useLocation();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [quoteIndex, setQuoteIndex] = useState(0);

  // Form states
  const [email, setEmail] = useState("jordan@fittrack.training");
  const [password, setPassword] = useState("••••••••••••");
  const [name, setName] = useState("Jordan Mercer");
  const [focus, setFocus] = useState("Hypertrophy & Strength");

  // Cycle motivating quotes automatically
  useEffect(() => {
    const interval = setInterval(() => {
      setQuoteIndex((prev) => (prev + 1) % motivatingQuotes.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (authMode === "signup") {
      saveAthleteProfile({
        name: name || "Jordan Mercer",
        email: email || "jordan@fittrack.training",
        location: "Brooklyn, NY",
        focus: focus || "Focused strength protocol",
      });
      toast.success(`Welcome to FitTrack, ${name.split(" ")[0]}! Telemetry initialized.`);
    } else {
      toast.success("Athlete authenticated. Launching Command Deck.");
    }
    localStorage.setItem("fittrack_auth_state", "authenticated");
    setAuthModalOpen(false);
    setLocation("/overview");
  };

  const handleQuickDemo = () => {
    localStorage.setItem("fittrack_auth_state", "authenticated");
    toast.success("Welcome, Athlete! Launching overview workspace.");
    setLocation("/overview");
  };

  const openAuth = (mode: "signin" | "signup") => {
    setAuthMode(mode);
    setAuthModalOpen(true);
  };

  return (
    <div className="landing-container">
      {/* 1. 3D Three.js Muscular Back & Particle Universe Background */}
      <Landing3DScene />
      <div className="landing-vignette" />

      {/* 2. Top Navigation Bar */}
      <header className="landing-topbar">
        <div className="landing-topbar-left">
          <div className="landing-brand" onClick={() => setLocation("/")}>
            <img src="/manus-storage/fittrack-signal-mark_e3117665.png" alt="FitTrack Signal" />
            <strong>FIT<span>TRACK</span></strong>
          </div>

          {/* Top Left Sign In & Log In Action Buttons as requested */}
          <div className="landing-auth-buttons">
            <button
              className="landing-auth-btn login-btn"
              onClick={() => openAuth("signin")}
              aria-label="Sign In to FitTrack"
            >
              <LogIn size={13} />
              Sign In
            </button>
            <button
              className="landing-auth-btn signup-btn"
              onClick={() => openAuth("signup")}
              aria-label="Create Athlete Account"
            >
              <UserPlus size={13} />
              Sign Up
            </button>
          </div>
        </div>

        <div className="landing-topbar-right">
          <div className="landing-telemetry-badge">
            <i />
            <span>Telemetry Online · v2.4</span>
          </div>
          <button
            className="landing-auth-btn login-btn"
            onClick={handleQuickDemo}
            style={{ borderColor: "rgba(166, 217, 255, 0.4)", color: "#a6d9ff" }}
          >
            Launch Overview ↗
          </button>
        </div>
      </header>

      {/* 3. Hero Section */}
      <main className="landing-hero">
        <motion.div
          className="hero-pill-badge"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Sparkles size={13} />
          <span>Kinetic Anatomy Lab // 4K Telemetry Platform</span>
        </motion.div>

        <motion.h1
          className="hero-main-title"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.65, delay: 0.1 }}
        >
          ENGINEER YOUR PHYSIQUE.
          <br />
          <span className="hero-title-highlight">TRANSCEND YOUR LIMITS.</span>
        </motion.h1>

        <motion.p
          className="hero-description"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.2 }}
        >
          Real-time 3D anatomical load simulation, autonomous precision fueling, and biometric continuity tracking designed for elite athletes and dedicated lifters.
        </motion.p>

        {/* Action Callouts */}
        <motion.div
          className="hero-cta-group"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <button className="hero-primary-cta" onClick={() => openAuth("signin")}>
            <Fingerprint size={18} />
            Enter Platform / Sign In
            <ArrowRight size={16} />
          </button>
          <button className="hero-secondary-cta" onClick={handleQuickDemo}>
            <Zap size={15} />
            Quick Demo Access ↗
          </button>
        </motion.div>

        {/* 4. Live Motivating Quotes Ticker */}
        <motion.div
          className="landing-quote-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <div className="quote-header">
            <div className="quote-kicker">
              <Quote size={12} />
              <span>ATHLETE SIGNAL // {motivatingQuotes[quoteIndex].tag}</span>
            </div>
            <span className="quote-author">— {motivatingQuotes[quoteIndex].author}</span>
          </div>
          <AnimatePresence mode="wait">
            <motion.p
              key={quoteIndex}
              className="quote-text"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.35 }}
            >
              “<em>{motivatingQuotes[quoteIndex].quote}</em>”
            </motion.p>
          </AnimatePresence>
        </motion.div>

        {/* 5. Core Platform Pillars */}
        <div className="landing-features-grid">
          <div className="feature-pillar-card">
            <span className="feature-card-index">01 / ANATOMY LAB</span>
            <div className="feature-card-icon">
              <Dumbbell size={20} />
            </div>
            <h3>3D Interactive Stage</h3>
            <p>Select target muscle groups in full 3D and review real-time fiber activation pathways across 26 engineered movements.</p>
          </div>

          <div className="feature-pillar-card">
            <span className="feature-card-index">02 / METABOLICS</span>
            <div className="feature-card-icon">
              <Flame size={20} />
            </div>
            <h3>Dynamic Fuel Telemetry</h3>
            <p>Automatic energy and protein recalibration based on your exact mass, height, age, and weekly workout load.</p>
          </div>

          <div className="feature-pillar-card">
            <span className="feature-card-index">03 / CONTINUITY</span>
            <div className="feature-card-icon">
              <Award size={20} />
            </div>
            <h3>Satellite Trace & Streak</h3>
            <p>Live satellite GPS tracking, milestone pixel badges, and year-wide 52-week training consistency matrices.</p>
          </div>
        </div>
      </main>

      {/* 6. Footer */}
      <footer className="landing-footer">
        <div>
          <span>FITTRACK KINETIC ANATOMY LAB · <b>PRECISION TELEMETRY</b></span>
        </div>
        <div>
          <span>BUILT FOR HIGH-OUTPUT ATHLETES · 2026</span>
        </div>
      </footer>

      {/* 7. High-Tech Cybernetic Authentication Modal */}
      <Dialog open={authModalOpen} onOpenChange={setAuthModalOpen}>
        <DialogContent className="auth-dialog-card sm:max-w-[460px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold uppercase tracking-wider text-[#eef5eb] font-['Chakra_Petch']">
              {authMode === "signin" ? "Athlete Sign In" : "Register Athlete Profile"}
            </DialogTitle>
            <DialogDescription className="text-xs text-[#8a9b89] font-['Space_Mono']">
              {authMode === "signin"
                ? "Enter your credentials to synchronize local biometrics and open the Command Deck."
                : "Initialize your athlete identity, body mass targets, and training profile."}
            </DialogDescription>
          </DialogHeader>

          <div className="auth-tabs-row">
            <button
              type="button"
              className={`auth-tab-button ${authMode === "signin" ? "active" : ""}`}
              onClick={() => setAuthMode("signin")}
            >
              Sign In
            </button>
            <button
              type="button"
              className={`auth-tab-button ${authMode === "signup" ? "active" : ""}`}
              onClick={() => setAuthMode("signup")}
            >
              Create Account
            </button>
          </div>

          <form onSubmit={handleAuthSubmit} className="auth-form-stack">
            {authMode === "signup" && (
              <div className="auth-input-group">
                <label>Athlete Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Jordan Mercer"
                  required
                />
              </div>
            )}

            <div className="auth-input-group">
              <label>Athlete ID / Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="athlete@fittrack.training"
                required
              />
            </div>

            <div className="auth-input-group">
              <label>Security Key / Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                required
              />
            </div>

            {authMode === "signup" && (
              <div className="auth-input-group">
                <label>Primary Training Focus</label>
                <input
                  type="text"
                  value={focus}
                  onChange={(e) => setFocus(e.target.value)}
                  placeholder="e.g. Hypertrophy, Strength, Endurance"
                />
              </div>
            )}

            <button type="submit" className="auth-submit-btn">
              {authMode === "signin" ? <LogIn size={16} /> : <UserCheck size={16} />}
              {authMode === "signin" ? "Authorize & Enter Overview" : "Initialize Athlete Profile"}
            </button>
          </form>

          <div className="auth-demo-shortcut">
            <button type="button" className="demo-entry-btn" onClick={handleQuickDemo}>
              <KeyRound size={13} />
              Instant 1-Click Demo Login ↗
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
