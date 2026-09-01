import { ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Sidebar } from "@/components/navigation/Sidebar";
import { WorkoutRecommendationCard } from "@/components/dashboard/WorkoutRecommendationCard";
import { NutritionLedgerCard } from "@/components/dashboard/NutritionLedgerCard";
import { TrainingRhythmCard } from "@/components/dashboard/TrainingRhythmCard";
import { getAthleteProfile } from "@/lib/user-store";

export default function Home() {
  const [, setLocation] = useLocation();
  const profile = getAthleteProfile();
  const athleteName = (profile.name?.split(" ")[0] || "ATHLETE").toUpperCase();

  const [formattedTime, setFormattedTime] = useState("");
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const day = now.toLocaleDateString("en-US", { weekday: "long" }).toUpperCase();
      const time = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
      setFormattedTime(`${day} • ${time}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
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
              MORNING,<br />
              <span className="greeting-athlete">ATHLETE</span>
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
