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
            <div className="editorial-timestamp">
              {formattedTime || "TUESDAY • 01:16 PM"}
            </div>

            <h1 className="editorial-greeting-title">
              GOOD<br />
              {greetingWord},<br />
              <span className="greeting-athlete">{userName}</span>
            </h1>

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
                <span className="score-number">{readinessScore}</span>
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
