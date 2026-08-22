/** Kinetic Pixel Fitness streak instrument: persistent daily training continuity shown as a compact dashboard signal. */
import { getDailyStreak } from "@/lib/user-store";

export function DailyStreak() {
  const streak = getDailyStreak();

  return (
    <section className={`daily-streak-card ${streak.count > 0 ? "active" : "inactive"}`}>
      <div className="streak-topline">
        <span className="panel-label">Daily continuity</span>
      </div>

      <div className="streak-readout">
        <div className="streak-pixel-fire" aria-hidden="true">
          <i />
          <i />
          <i />
          <i />
          <i />
        </div>
        <div className="streak-count-info">
          <div className="streak-num-row">
            <strong>{streak.count}</strong>
            <small>DAYS</small>
          </div>
          <b>Training streak</b>
        </div>
      </div>

      <div className="streak-week" aria-label="Weekly streak status">
        {["M", "T", "W", "T", "F", "S", "S"].map((day, index) => (
          <span key={`${day}-${index}`} className={index < Math.min(streak.count, 7) ? "complete" : ""}>
            <i />
            {day}
          </span>
        ))}
      </div>
    </section>
  );
}
