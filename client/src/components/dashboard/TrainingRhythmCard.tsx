import { ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { getAthleteProfile, getScopedKey } from "@/lib/user-store";

interface DayStatus {
  dayName: string;
  isToday: boolean;
  isCompleted: boolean;
  isPast: boolean;
}

export function TrainingRhythmCard() {
  const [, setLocation] = useLocation();
  const profile = getAthleteProfile();
  const [days, setDays] = useState<DayStatus[]>([]);
  const [latestWeight, setLatestWeight] = useState<number>(70);
  const [gpsCount, setGpsCount] = useState<number>(0);

  useEffect(() => {
    const now = new Date();
    const currentDay = now.getDay();
    const diffToMonday = currentDay === 0 ? -6 : 1 - currentDay;
    const monday = new Date(now);
    monday.setDate(now.getDate() + diffToMonday);

    const weekDays = ["M", "T", "W", "T", "F", "S", "S"];

    let workoutDates = new Set<string>();
    try {
      const rawLogs =
        localStorage.getItem(getScopedKey("fittrack_workout_logs")) ||
        localStorage.getItem("fittrack_workout_logs") ||
        localStorage.getItem("fittrack_workout_history");
      if (rawLogs) {
        const parsed = JSON.parse(rawLogs);
        if (Array.isArray(parsed)) {
          parsed.forEach((w: any) => {
            const d = w.completedAt || w.date || w.startedAt;
            if (d) workoutDates.add(new Date(d).toDateString());
          });
        }
      }
    } catch {}

    const list: DayStatus[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);

      const isToday = d.toDateString() === now.toDateString();
      const isPast = d < now && !isToday;
      const isCompleted = workoutDates.has(d.toDateString());

      list.push({
        dayName: weekDays[i],
        isToday,
        isCompleted,
        isPast,
      });
    }
    setDays(list);

    try {
      const rawWeight = localStorage.getItem(getScopedKey("fittrack_weight_logs")) || localStorage.getItem("fittrack_weight_logs");
      if (rawWeight) {
        const parsed = JSON.parse(rawWeight);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const last = parsed[parsed.length - 1];
          if (last.weightKg) setLatestWeight(Number(last.weightKg));
        }
      }
    } catch {}

    try {
      const rawGps = localStorage.getItem(getScopedKey("fittrack_gps_sessions")) || localStorage.getItem("fittrack_gps_sessions");
      if (rawGps) {
        const parsed = JSON.parse(rawGps);
        if (Array.isArray(parsed)) setGpsCount(parsed.length);
      }
    } catch {}
  }, []);

  return (
    <div className="editorial-card rhythm-card">
      <div className="card-topline">
        <span className="card-label">TRAINING RHYTHM</span>
      </div>

      <div className="rhythm-week-grid">
        <div className="rhythm-days-header">
          {days.map((d, idx) => (
            <span key={idx} className={`day-label ${d.isToday ? "today-label" : ""}`}>
              {d.dayName}
            </span>
          ))}
        </div>

        <div className="rhythm-dots-row">
          {days.map((d, idx) => {
            let stateClass = "dot-upcoming";
            if (d.isCompleted) stateClass = "dot-completed";
            else if (d.isToday) stateClass = "dot-today";

            return (
              <div key={idx} className="rhythm-dot-wrapper">
                <div className={`rhythm-dot ${stateClass}`} />
              </div>
            );
          })}
        </div>
      </div>

      <div className="rhythm-legend">
        <span><i className="legend-dot dot-completed" /> Completed</span>
        <span><i className="legend-dot dot-today" /> Today</span>
        <span><i className="legend-dot dot-upcoming" /> Upcoming</span>
      </div>

      <div className="rhythm-metrics-divider" />

      <div className="rhythm-metrics-row">
        <div className="rhythm-metric-item">
          <strong>{latestWeight} <small>kg</small></strong>
          <span>Latest weight</span>
        </div>
        <div className="rhythm-metric-item">
          <strong>{gpsCount}</strong>
          <span>GPS sessions</span>
        </div>
      </div>

      <button
        className="card-footer-link"
        onClick={() => setLocation("/log-weight")}
      >
        <span>View progress</span>
        <ArrowRight size={14} />
      </button>
    </div>
  );
}
