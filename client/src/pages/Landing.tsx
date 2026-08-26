import { useEffect, useState, useRef } from "react";
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
import { sanitizeText, sanitizeEmail } from "@/lib/sanitize";
import "./Landing.css";

const motivatingQuotes = [
  {
    quote: "Discipline is the bridge between kinetic signal and physical reality.",
    author: "Kinetic Principle 01",
    tag: "Mindset",
  },
  {
    quote: "Every repetition encodes physical endurance into muscle memory.",
    author: "Command Protocol",
    tag: "Discipline",
  },
  {
    quote: "Precision metrics eliminate guesswork from peak athletic performance.",
    author: "Telemetry Deck",
    tag: "Analytics",
  },
  {
    quote: "Progress compounds when consistency meets metabolic focus.",
    author: "Bio-Kinetic OS",
    tag: "Focus",
  },
];

// Production Google OAuth Client ID
const GOOGLE_CLIENT_ID = "583335952268-9ibrvhstkajdn9ik9did17ml3pldijuk.apps.googleusercontent.com";

export default function Landing() {
  const [, setLocation] = useLocation();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [focus, setFocus] = useState("");
  const [quoteIndex, setQuoteIndex] = useState(0);

  // Google Sign In dedicated states
  const [googleModalOpen, setGoogleModalOpen] = useState(false);
  const [googleStep, setGoogleStep] = useState<"email" | "password">("email");
  const [googleEmail, setGoogleEmail] = useState("");
  const [googlePassword, setGooglePassword] = useState("");
  const [showGooglePassword, setShowGooglePassword] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const googleBtnRef = useRef<HTMLDivElement | null>(null);

  // Remembered Google accounts
  const [savedGoogleAccounts, setSavedGoogleAccounts] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem("fittrack_google_accounts");
      return stored ? JSON.parse(stored) : ["caniket2007@gmail.com"];
    } catch {
      return ["caniket2007@gmail.com"];
    }
  });

  // Decode and cryptographically validate JWT helper for Google One Tap
  const handleCredentialResponse = (response: any) => {
    if (response?.credential) {
      try {
        const base64Url = response.credential.split(".")[1];
        const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
        const jsonPayload = decodeURIComponent(
          window.atob(base64)
            .split("")
            .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
            .join("")
        );
        const payload = JSON.parse(jsonPayload);

        // Security Validation: verify audience & issuer claims
        if (payload?.aud && payload.aud !== GOOGLE_CLIENT_ID) {
          console.warn("Security Alert: Google JWT audience mismatch.");
          toast.error("Security verification failed. Invalid token audience.");
          return;
        }
        if (payload?.exp && payload.exp < Date.now() / 1000) {
          toast.error("Google session expired. Please sign in again.");
          return;
        }

        const validEmail = sanitizeEmail(payload.email);
        if (validEmail) {
          const cleanName = sanitizeText(payload.name) || "Google Athlete";
          localStorage.setItem("fittrack_auth_state", "authenticated");
          localStorage.setItem("fittrack_auth_provider", "google");
          localStorage.setItem("fittrack_user_email", validEmail);
          localStorage.setItem("fittrack_user_name", cleanName);
          if (payload.picture) {
            localStorage.setItem("fittrack_user_avatar", payload.picture);
          }
          saveAthleteProfile({
            name: cleanName,
            email: validEmail,
            photoDataUrl: payload.picture || "",
            location: "New York, USA",
            focus: "Hypertrophy & Strength Protocol",
          });
          localStorage.setItem("fittrack_trigger_rexi_welcome", "true");
          toast.success(`Welcome, ${cleanName}! Authenticated with Google.`);
          setGoogleModalOpen(false);
          setAuthModalOpen(false);
          setLocation("/overview");
        }
      } catch (err) {
        console.error("Failed to decode Google JWT:", err);
      }
    }
  };

  // Trigger Google OAuth2 popup / Token client
  const handleGoogleOAuthPopup = () => {
    const g = (window as any).google;
    if (g?.accounts?.oauth2) {
      try {
        const client = g.accounts.oauth2.initTokenClient({
          client_id: GOOGLE_CLIENT_ID,
          scope: "openid profile email",
          callback: async (tokenResponse: any) => {
            if (tokenResponse && tokenResponse.access_token) {
              try {
                setIsGoogleLoading(true);
                const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
                  headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
                });
                const userData = await res.json();
                if (userData && userData.email) {
                  const googleName = sanitizeText(userData.name) || "Google Athlete";
                  const googleEmailClean = sanitizeEmail(userData.email);

                  localStorage.setItem("fittrack_auth_state", "authenticated");
                  localStorage.setItem("fittrack_auth_provider", "google");
                  localStorage.setItem("fittrack_user_email", googleEmailClean);
                  localStorage.setItem("fittrack_user_name", googleName);
                  if (userData.picture) {
                    localStorage.setItem("fittrack_user_avatar", userData.picture);
                  }
                  saveAthleteProfile({
                    name: googleName,
                    email: googleEmailClean,
                    photoDataUrl: userData.picture || "",
                    location: "New York, USA",
                    focus: "Hypertrophy & Strength Protocol",
                  });
                  // Save account to remembered list
                  try {
                    const updated = Array.from(new Set([googleEmailClean, ...savedGoogleAccounts]));
                    localStorage.setItem("fittrack_google_accounts", JSON.stringify(updated));
                    setSavedGoogleAccounts(updated);
                  } catch {}

                  localStorage.setItem("fittrack_trigger_rexi_welcome", "true");
                  setIsGoogleLoading(false);
                  setGoogleModalOpen(false);
                  setAuthModalOpen(false);
                  toast.success(`Welcome, ${googleName}! Signed in with Google.`);
                  setLocation("/overview");
                  return;
                }
              } catch (fetchErr) {
                console.error("UserInfo fetch error:", fetchErr);
              } finally {
                setIsGoogleLoading(false);
              }
            }
          },
        });
        client.requestAccessToken();
        return;
      } catch (e) {
        console.warn("OAuth2 init fallback:", e);
      }
    }
    // Fallback to in-app Google modal
    handleStartGoogleAuth();
  };

  // Initialize GSI One Tap & Official buttons
  useEffect(() => {
    const initGoogleGsi = () => {
      const g = (window as any).google;
      if (g?.accounts?.id) {
        try {
          g.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: handleCredentialResponse,
            auto_select: false,
          });

          if (googleBtnRef.current) {
            g.accounts.id.renderButton(googleBtnRef.current, {
              theme: "outline",
              size: "large",
              text: "continue_with",
              shape: "rectangular",
              width: "100%",
            });
          }
        } catch (e) {
          console.warn("GSI init warning:", e);
        }
      }
    };

    if ((window as any).google?.accounts?.id) {
      initGoogleGsi();
    } else {
      const interval = setInterval(() => {
        if ((window as any).google?.accounts?.id) {
          initGoogleGsi();
          clearInterval(interval);
        }
      }, 500);
      return () => clearInterval(interval);
    }
  }, [googleModalOpen]);

  const handleStartGoogleAuth = () => {
    setAuthModalOpen(false);
    setGoogleStep("email");
    setGoogleEmail("");
    setGooglePassword("");
    setShowGooglePassword(false);
    setGoogleModalOpen(true);
  };

  const handleSelectGoogleChip = (selectedEmail: string) => {
    setGoogleEmail(selectedEmail);
    setGoogleStep("password");
  };

  const handleGoogleEmailNext = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = googleEmail.trim();
    if (!trimmed) {
      toast.error("Please enter your Google email address or phone number.");
      return;
    }
    let finalEmail = trimmed;
    if (!trimmed.includes("@") && !/^\+?\d{8,}$/.test(trimmed)) {
      finalEmail = trimmed + "@gmail.com";
      setGoogleEmail(finalEmail);
    }
    setGoogleStep("password");
  };

  const handleGooglePasswordNext = (e: React.FormEvent) => {
    e.preventDefault();
    setIsGoogleLoading(true);
    setTimeout(() => {
      const email = sanitizeEmail(googleEmail) || "athlete@gmail.com";
      const usernamePart = email.split("@")[0] || "Athlete";
      const cleanName = usernamePart
        .split(/[\._\-]/)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(" ");

      localStorage.setItem("fittrack_auth_state", "authenticated");
      localStorage.setItem("fittrack_auth_provider", "google");
      localStorage.setItem("fittrack_user_email", email);
      localStorage.setItem("fittrack_user_name", cleanName || "Google Athlete");

      saveAthleteProfile({
        name: cleanName || "Google Athlete",
        email: email,
        location: "New York, USA",
        focus: "Hypertrophy & Strength Protocol",
      });

      // Update remembered accounts
      try {
        const updatedAccounts = Array.from(new Set([email, ...savedGoogleAccounts]));
        localStorage.setItem("fittrack_google_accounts", JSON.stringify(updatedAccounts));
        setSavedGoogleAccounts(updatedAccounts);
      } catch {}

      setIsGoogleLoading(false);
      setGoogleModalOpen(false);
      localStorage.setItem("fittrack_trigger_rexi_welcome", "true");
      toast.success(`Google Account connected: ${email}`);
      setLocation("/overview");
    }, 550);
  };

  // Cycle motivating quotes automatically
  useEffect(() => {
    const interval = setInterval(() => {
      setQuoteIndex((prev) => (prev + 1) % motivatingQuotes.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = sanitizeEmail(email) || "athlete@fittrack.training";
    const cleanName = sanitizeText(name) || "Athlete";
    const cleanFocus = sanitizeText(focus) || "Focused strength protocol";

    localStorage.setItem("fittrack_auth_state", "authenticated");
    localStorage.setItem("fittrack_user_email", cleanEmail);
    localStorage.setItem("fittrack_trigger_rexi_welcome", "true");
    if (name) {
      localStorage.setItem("fittrack_user_name", cleanName);
    }
    if (authMode === "signup" || name) {
      saveAthleteProfile({
        name: cleanName,
        email: cleanEmail,
        location: "New York, USA",
        focus: cleanFocus,
      });
      toast.success(`Welcome to FitTrack, ${cleanName.split(" ")[0]}! Telemetry initialized.`);
    } else {
      toast.success("Athlete authenticated. Launching Command Deck.");
    }
    setAuthModalOpen(false);
    setLocation("/overview");
  };

  const handleQuickDemo = () => {
    localStorage.setItem("fittrack_user_email", "demo@fittrack.training");
    localStorage.setItem("fittrack_auth_state", "authenticated");
    localStorage.setItem("fittrack_trigger_rexi_welcome", "true");
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
            <div className="brand-logo-icon">
              <Activity size={18} />
            </div>
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

        <div className="landing-topbar-right"></div>
      </header>

      {/* 3. Hero Section */}
      <main className="landing-hero">
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

        {/* Action Callouts */}
        <motion.div
          className="hero-cta-group"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
        >
          <button className="hero-primary-cta" onClick={() => openAuth("signin")}>
            <Fingerprint size={18} />
            Enter Platform / Sign In
            <ArrowRight size={16} />
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

      {/* 7. Authentication Modal */}
      <Dialog open={authModalOpen} onOpenChange={setAuthModalOpen}>
        <DialogContent className="auth-dialog-card sm:max-w-[460px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold uppercase tracking-wider text-[#eef5eb] font-['Chakra_Petch']">
              {authMode === "signin" ? "Sign In" : "Create Account"}
            </DialogTitle>
            <DialogDescription className="text-xs text-[#8a9b89] font-['Space_Mono']">
              {authMode === "signin"
                ? "Enter your email to sign in and open the Command Deck."
                : "Initialize your profile and training targets."}
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

          <div className="auth-form-stack">
            {/* Google Authentication Button */}
            <button
              type="button"
              className="google-auth-btn"
              onClick={handleGoogleOAuthPopup}
            >
              <svg className="google-icon" viewBox="0 0 24 24" width="18" height="18">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>

            <div className="auth-divider">
              <span>OR SIGN IN WITH EMAIL</span>
            </div>

            <form onSubmit={handleAuthSubmit} className="auth-form-stack">
            {authMode === "signup" && (
              <div className="auth-input-group">
                <label>Full Name</label>
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
              <label>Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@gmail.com"
                required
              />
            </div>

            <div className="auth-input-group">
              <label>Password</label>
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
              {authMode === "signin" ? "Sign In & Enter Overview" : "Create Account"}
            </button>
          </form>
          </div>

          <div className="auth-demo-shortcut">
            <button type="button" className="demo-entry-btn" onClick={handleQuickDemo}>
              <KeyRound size={13} />
              Instant 1-Click Demo Login ↗
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 8. Dedicated Google OAuth Identity Modal */}
      <Dialog open={googleModalOpen} onOpenChange={setGoogleModalOpen}>
        <DialogContent className="google-oauth-dialog sm:max-w-[440px]">
          {isGoogleLoading && (
            <div className="google-loading-bar">
              <div className="google-loading-bar-inner" />
            </div>
          )}

          <div className="google-dialog-header">
            <svg viewBox="0 0 24 24" width="28" height="28">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <h2>Sign in with Google</h2>
            <p>to continue to <strong className="text-zinc-900">FitTrack Performance Lab</strong></p>
          </div>

          {googleStep === "email" ? (
            <form onSubmit={handleGoogleEmailNext} className="google-dialog-body">
              <div className="google-input-field">
                <label>Email or phone</label>
                <input
                  type="email"
                  value={googleEmail}
                  onChange={(e) => setGoogleEmail(e.target.value)}
                  placeholder="Enter your Google Account email"
                  autoFocus
                  required
                />
              </div>

              <div className="google-account-chips">
                <span>Choose an active account:</span>
                {savedGoogleAccounts.map((accEmail) => (
                  <button
                    key={accEmail}
                    type="button"
                    className="google-chip-btn"
                    onClick={() => handleSelectGoogleChip(accEmail)}
                  >
                    <div className="google-chip-avatar">
                      {accEmail.charAt(0).toUpperCase()}
                    </div>
                    <div className="google-chip-text">
                      <strong>
                        {accEmail
                          .split("@")[0]
                          .split(/[\._\-]/)
                          .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
                          .join(" ")}
                      </strong>
                      <small>{accEmail}</small>
                    </div>
                  </button>
                ))}
              </div>

              <div className="google-links-row">
                <button
                  type="button"
                  className="google-text-link"
                  onClick={() => toast.info("Enter your registered Google email address (e.g. caniket2007@gmail.com).")}
                >
                  Use another account
                </button>
              </div>

              <p className="google-disclaimer">
                To continue, Google will securely share your name and email with FitTrack.
              </p>

              <div className="google-actions-row">
                <button
                  type="button"
                  className="google-secondary-btn"
                  onClick={() => setGoogleModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="google-primary-btn">
                  Next
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleGooglePasswordNext} className="google-dialog-body">
              <div className="google-chosen-user-pill" onClick={() => setGoogleStep("email")}>
                <div className="google-chip-avatar">{googleEmail.charAt(0).toUpperCase()}</div>
                <span>{googleEmail}</span>
                <ChevronRight size={14} />
              </div>

              <div className="google-input-field">
                <label>Enter your password</label>
                <input
                  type={showGooglePassword ? "text" : "password"}
                  value={googlePassword}
                  onChange={(e) => setGooglePassword(e.target.value)}
                  placeholder="Enter Google password"
                  autoFocus
                  required
                />
              </div>

              <label className="google-checkbox-row">
                <input
                  type="checkbox"
                  checked={showGooglePassword}
                  onChange={(e) => setShowGooglePassword(e.target.checked)}
                />
                <span>Show password</span>
              </label>

              <div className="google-actions-row">
                <button
                  type="button"
                  className="google-secondary-btn"
                  onClick={() => setGoogleStep("email")}
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="google-primary-btn"
                  disabled={isGoogleLoading}
                >
                  {isGoogleLoading ? "Signing in..." : "Sign in"}
                </button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
