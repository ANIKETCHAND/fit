import { ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Sidebar } from "@/components/navigation/Sidebar";
import { OrbitalReadinessScene } from "@/components/3d/OrbitalReadinessScene";
import { WorkoutRecommendationCard } from "@/components/dashboard/WorkoutRecommendationCard";
import { NutritionLedgerCard } from "@/components/dashboard/NutritionLedgerCard";
import { TrainingRhythmCard } from "@/components/dashboard/TrainingRhythmCard";
import { getAthleteProfile, getScopedKey } from "@/lib/user-store";

export default function Home() {
  const [, setLocation] = useLocation();

  const getGreetingPeriod = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return "MORNING";
    if (hour >= 12 && hour < 17) return "AFTERNOON";
    if (hour >= 17 && hour < 21) return "EVENING";
    return "NIGHT";
  };

  const computeReadinessScore = (): number => {
    let score = 82; // Baseline optimal athletic readiness
    try {
      const todayKey = new Date().toISOString().split("T")[0];

      // 1. Workouts completed
      const rawWorkouts =
        localStorage.getItem(getScopedKey("fittrack_workout_logs")) ||
        localStorage.getItem("fittrack_workout_logs") ||
        localStorage.getItem("fittrack_workout_history");
      if (rawWorkouts) {
        const parsed = JSON.parse(rawWorkouts);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const todayWorkout = parsed.find((w: any) => {
            const d = w.completedAt || w.date || w.startedAt;
            return d && d.startsWith(todayKey);
          });
          if (todayWorkout) {
            score = 92; // Active high recovery stimulus today
          } else {
            score += 4;
          }
        }
      }

      // 2. Nutrition adherence
      const scopedTodayNut =
        localStorage.getItem(getScopedKey("fittrack_logged_nutrition_today")) ||
        localStorage.getItem("fittrack_logged_nutrition_today");
      if (scopedTodayNut) {
        const nut = JSON.parse(scopedTodayNut);
        if (nut.calories && nut.calories > 800) {
          score = Math.min(98, score + 4);
        }
      }

      // 3. GPS activity
      const rawGps =
        localStorage.getItem(getScopedKey("fittrack_gps_routes")) ||
        localStorage.getItem("fittrack_gps_routes");
      if (rawGps) {
        const gps = JSON.parse(rawGps);
        if (Array.isArray(gps) && gps.length > 0) {
          score = Math.min(98, score + 3);
        }
      }

      // 4. Daily Streak Momentum
      const rawStreak =
        localStorage.getItem(getScopedKey("fittrack-daily-streak")) ||
        localStorage.getItem("fittrack-daily-streak");
      if (rawStreak) {
        const streak = JSON.parse(rawStreak);
        if (streak.count && streak.count > 0) {
          score = Math.min(98, score + Math.min(6, streak.count * 2));
        }
      }
    } catch {}

    return Math.min(98, Math.max(50, score));
  };

  const [greetingWord, setGreetingWord] = useState(getGreetingPeriod());
  const [userName, setUserName] = useState(() => {
    const profile = getAthleteProfile();
    return (profile.name?.split(" ")[0] || "ATHLETE").toUpperCase();
  });
  const [readinessScore, setReadinessScore] = useState(() => computeReadinessScore());
  const [formattedTime, setFormattedTime] = useState("");

  useEffect(() => {
    const updateTimeAndGreeting = () => {
      const now = new Date();
      const day = now.toLocaleDateString("en-US", { weekday: "long" }).toUpperCase();
      const time = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
      setFormattedTime(`${day} • ${time}`);
      setGreetingWord(getGreetingPeriod());
      setReadinessScore(computeReadinessScore());

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

  return (
    <div className="editorial-app-shell">
      <Sidebar />

      <main className="editorial-main-content">
        {/* TOP HERO SECTION */}
        <section className="editorial-hero-grid">
          {/* Left Hero Column: Typography & Actions */}
          <div className="editorial-hero-left">
            <div
              className="editorial-timestamp"
              style={{
                color: "#8a998c",
                fontFamily: '"Space Mono", monospace',
                fontSize: "11px",
                fontWeight: 700,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                marginBottom: "24px",
              }}
            >
              {formattedTime || "TUESDAY • 01:16 PM"}
            </div>

            <h1
              className="editorial-greeting-title"
              style={{
                color: "#ffffff",
                fontFamily: '"Chakra Petch", sans-serif',
                fontSize: "clamp(42px, 4.8vw, 62px)",
                fontWeight: 800,
                lineHeight: 1.02,
                letterSpacing: "0.01em",
                textTransform: "uppercase",
                margin: "0 0 28px",
              }}
            >
              GOOD<br />
              {greetingWord},<br />
              <span
                className="greeting-athlete"
                style={{
                  color: "#baff57",
                  textShadow: "0 0 24px rgba(186, 255, 87, 0.45)",
                  display: "inline-block",
                }}
              >
                {userName}
              </span>
            </h1>

            <div className="editorial-action-row" style={{ display: "flex", alignItems: "center", gap: "22px", marginBottom: "42px", flexWrap: "wrap" }}>
              <button
                className="editorial-primary-btn"
                onClick={() => setLocation("/start-session")}
                style={{
                  backgroundColor: "#baff57",
                  color: "#070d0a",
                  padding: "14px 24px",
                  borderRadius: "6px",
                  fontFamily: '"Space Mono", monospace',
                  fontSize: "12px",
                  fontWeight: 800,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  border: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "10px",
                  cursor: "pointer",
                  boxShadow: "0 0 24px rgba(186, 255, 87, 0.4)",
                  transition: "transform 0.16s ease, filter 0.16s ease",
                }}
              >
                <span>BEGIN TODAY'S SESSION</span>
                <ArrowRight size={16} />
              </button>

              <button
                className="editorial-secondary-link"
                onClick={() => setLocation("/exercise-library")}
                style={{
                  fontFamily: '"Manrope", sans-serif',
                  fontSize: "13.5px",
                  fontWeight: 700,
                  color: "#ffffff",
                  background: "none",
                  border: "none",
                  padding: 0,
                  textDecoration: "underline",
                  textUnderlineOffset: "4px",
                  cursor: "pointer",
                }}
              >
                View training plan
              </button>
            </div>

            {/* Score & Telemetry Indicator */}
            <div
              className="editorial-score-block"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "24px",
                paddingTop: "14px",
                borderTop: "1px solid rgba(255, 255, 255, 0.12)",
              }}
            >
              <div className="editorial-score-badge" style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
                <span
                  className="score-number"
                  style={{
                    fontFamily: '"Chakra Petch", sans-serif',
                    fontSize: "56px",
                    fontWeight: 800,
                    color: "#baff57",
                    textShadow: "0 0 28px rgba(186, 255, 87, 0.5)",
                    lineHeight: 0.9,
                  }}
                >
                  {readinessScore}
                </span>
                <div className="score-denom" style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                  <span
                    className="denom-val"
                    style={{
                      fontFamily: '"Space Mono", monospace',
                      fontSize: "13px",
                      fontWeight: 800,
                      color: "#ffffff",
                    }}
                  >
                    / 100
                  </span>
                  <span
                    className="denom-label"
                    style={{
                      fontFamily: '"Space Mono", monospace',
                      fontSize: "8px",
                      fontWeight: 800,
                      letterSpacing: "0.14em",
                      color: "#8a998c",
                      textTransform: "uppercase",
                    }}
                  >
                    READINESS
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Hero Column: 3D Orbital Readiness Form */}
          <div className="editorial-hero-right">
            <OrbitalReadinessScene score={readinessScore} />
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
