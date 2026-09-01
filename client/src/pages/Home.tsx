import { ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Sidebar } from "@/components/navigation/Sidebar";
import { OrbitalReadinessScene } from "@/components/3d/OrbitalReadinessScene";
import { WorkoutRecommendationCard } from "@/components/dashboard/WorkoutRecommendationCard";
import { NutritionLedgerCard } from "@/components/dashboard/NutritionLedgerCard";
import { TrainingRhythmCard } from "@/components/dashboard/TrainingRhythmCard";
import { getAthleteProfile } from "@/lib/user-store";

export default function Home() {
  const [, setLocation] = useLocation();

  const getGreetingPeriod = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return "MORNING";
    if (hour >= 12 && hour < 17) return "AFTERNOON";
    if (hour >= 17 && hour < 21) return "EVENING";
    return "NIGHT";
  };

  const [greetingWord, setGreetingWord] = useState(getGreetingPeriod());
  const [userName, setUserName] = useState(() => {
    const profile = getAthleteProfile();
    return (profile.name?.split(" ")[0] || "ATHLETE").toUpperCase();
  });
  const [formattedTime, setFormattedTime] = useState("");

  useEffect(() => {
    const updateTimeAndGreeting = () => {
      const now = new Date();
      const day = now.toLocaleDateString("en-US", { weekday: "long" }).toUpperCase();
      const time = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
      setFormattedTime(`${day} • ${time}`);
      setGreetingWord(getGreetingPeriod());

      const profile = getAthleteProfile();
      if (profile.name && profile.name.trim()) {
        const first = profile.name.trim().split(" ")[0];
        setUserName(first.toUpperCase());
      }
    };

    updateTimeAndGreeting();
    const interval = setInterval(updateTimeAndGreeting, 30000);
    return () => clearInterval(interval);
  }, []);

  const readinessScore = 50;

  return (
    <div className="editorial-app-shell">
      <Sidebar />

      <main className="editorial-main-content">
        {/* TOP HERO SECTION */}
        <section className="editorial-hero-grid">
          {/* Left Hero Column: Typography & Actions */}
          <div className="editorial-hero-left">
            <div className="editorial-timestamp">
              {formattedTime || "TUESDAY • 01:16 PM"}
            </div>

            <h1 className="editorial-greeting-title">
              GOOD<br />
              {greetingWord},<br />
              <span className="greeting-athlete">{userName}</span>
            </h1>

            <p className="editorial-greeting-subtitle">
              Your lower body is ready.
            </p>

            <div className="editorial-action-row">
              <button
                className="editorial-primary-btn"
                onClick={() => setLocation("/start-session")}
              >
                <span>BEGIN TODAY'S SESSION</span>
                <ArrowRight size={16} />
              </button>

              <button
                className="editorial-secondary-link"
                onClick={() => setLocation("/exercise-library")}
              >
                View training plan
              </button>
            </div>

            {/* Score & Telemetry Indicator */}
            <div className="editorial-score-block">
              <div className="editorial-score-badge">
                <span className="score-number">50</span>
                <div className="score-denom">
                  <span className="denom-val">/ 100</span>
                  <span className="denom-label">READINESS</span>
                </div>
              </div>
              <p className="editorial-score-caption">
                Based on your logged training, movement, and recovery signals.
              </p>
            </div>
          </div>

          {/* Right Hero Column: 3D Orbital Readiness Form */}
          <div className="editorial-hero-right">
            <OrbitalReadinessScene score={0} />
          </div>
        </section>

        {/* BOTTOM 3-CARD TELEMETRY GRID */}
        <section className="editorial-bottom-grid">
          <WorkoutRecommendationCard />
          <NutritionLedgerCard />
          <TrainingRhythmCard />
        </section>
      </main>
    </div>
  );
}
