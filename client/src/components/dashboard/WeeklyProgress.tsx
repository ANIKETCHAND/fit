/** Kinetic Anatomy Lab: compact weekly training visualization with non-generic instrument styling. */
import { ArrowUpRight, Flame, Footprints, Scale } from "lucide-react";
import { getScopedKey } from "@/lib/user-store";

export function WeeklyProgress() {
  const days = ["M", "T", "W", "T", "F", "S", "S"];
  const todayIndex = (new Date().getDay() + 6) % 7; // 0 = Mon, 6 = Sun

  const sessionCounts = (() => {
    try {
      const workouts = JSON.parse(localStorage.getItem(getScopedKey("fittrack_workout_logs")) || "[]");
      const gps = JSON.parse(localStorage.getItem(getScopedKey("fittrack_gps_sessions")) || "[]");
      const general = JSON.parse(localStorage.getItem(getScopedKey("fittrack_sessions")) || "[]");

      const now = new Date();
      // Start of current week (Monday)
      const monday = new Date(now);
      monday.setDate(now.getDate() - todayIndex);
      monday.setHours(0, 0, 0, 0);

      const dayActivity = [0, 0, 0, 0, 0, 0, 0];
      const allDates: string[] = [
        ...workouts.map((w: any) => w.completedAt || w.startedAt || w.date || ""),
        ...gps.map((g: any) => g.startedAt || g.createdAt || ""),
        ...general.map((s: any) => s.startedAt || s.createdAt || ""),
      ].filter(Boolean);

      allDates.forEach((dStr) => {
        const d = new Date(dStr);
        if (d >= monday && d <= now) {
          const dayIdx = (d.getDay() + 6) % 7;
          dayActivity[dayIdx] = Math.min(100, dayActivity[dayIdx] + 50);
        }
      });
      return dayActivity;
    } catch {
      return [0, 0, 0, 0, 0, 0, 0];
    }
  })();

  const completedCount = sessionCounts.filter((v) => v > 0).length;

  return (
    <section className="weekly-card glass-panel">
      <div className="card-header">
        <div>
          <span className="eyebrow">Weekly load</span>
          <h3>Training rhythm</h3>
        </div>
        <button aria-label="Open training report">
          <ArrowUpRight size={17} />
        </button>
      </div>
      <div className="session-bars">
        {days.map((day, index) => (
          <div
            className={index === todayIndex ? "today-session" : ""}
            key={`${day}-${index}`}
          >
            <div className="bar-wrap">
              <div
                className="bar"
                style={{ height: `${Math.max(sessionCounts[index], sessionCounts[index] > 0 ? 30 : 0)}%` }}
              />
            </div>
            <span>{day}</span>
          </div>
        ))}
      </div>
      <div className="week-note">
        <span>
          <i />
          {completedCount > 0 ? `${completedCount} of 5 sessions complete` : "0 sessions logged this week"}
        </span>
        <b>{completedCount > 0 ? `+${completedCount * 20}% target` : "Ready to begin"}</b>
      </div>
    </section>
  );
}

export function VitalStrip() {
  const todayKcal = (() => {
    try {
      const logs = JSON.parse(localStorage.getItem(getScopedKey("fittrack_nutrition_logs")) || "[]") as { calories: number; consumedAt: string }[];
      const today = new Date().toISOString().split("T")[0];
      return logs.filter((e) => e.consumedAt?.startsWith(today)).reduce((sum, e) => sum + (Number(e.calories) || 0), 0);
    } catch { return 0; }
  })();

  const goalKcal = (() => {
    try {
      const s = JSON.parse(localStorage.getItem(getScopedKey("fittrack-calibration-settings")) || "null");
      return s?.goalKcal ?? 2400;
    } catch { return 2400; }
  })();

  const weightKg = (() => {
    try {
      const s = JSON.parse(localStorage.getItem(getScopedKey("fittrack-calibration-settings")) || "null");
      return s?.weightKg ?? 70;
    } catch { return 70; }
  })();

  const todaySteps = (() => {
    try {
      const logs = JSON.parse(localStorage.getItem(getScopedKey("fittrack_gps_sessions")) || "[]");
      const today = new Date().toISOString().split("T")[0];
      const todayKm = logs
        .filter((e: any) => (e.startedAt || e.createdAt || "").startsWith(today))
        .reduce((sum: number, e: any) => sum + (Number(e.distanceKm) || 0), 0);
      return Math.round(todayKm * 1300);
    } catch { return 0; }
  })();

  const stepPercent = Math.min(100, Math.round((todaySteps / 10000) * 100));

  const data = [
    { icon: Flame, label: "Calories", value: todayKcal.toLocaleString(), sub: `of ${goalKcal.toLocaleString()} kcal`, accent: "lime" },
    { icon: Scale, label: "Weight", value: weightKg.toString(), sub: "kg · today's reading", accent: "blue" },
    { icon: Footprints, label: "Steps", value: todaySteps.toLocaleString(), sub: `${stepPercent}% of target`, accent: "lavender" },
  ];

  return (
    <div className="vital-strip">
      {data.map(({ icon: Icon, ...vital }) => (
        <div className="vital-item" key={vital.label}>
          <span className={`vital-icon ${vital.accent}`}>
            <Icon size={16} />
          </span>
          <div>
            <p>{vital.label}</p>
            <b>{vital.value}</b>
            <small>{vital.sub}</small>
          </div>
        </div>
      ))}
    </div>
  );
}
