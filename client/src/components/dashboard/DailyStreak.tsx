/** Kinetic Pixel Fitness streak instrument: persistent daily training continuity shown as a compact dashboard signal. */
import { ShieldCheck } from "lucide-react";
import { getDailyStreak } from "@/lib/user-store";

export function DailyStreak() {
  const streak = getDailyStreak();
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const secured = streak.lastCompletedDate === today;
  return <section className={`daily-streak-card ${streak.count > 0 ? "active" : "inactive"}`}><div className="streak-topline"><span className="eyebrow">Daily continuity</span><span><i />STR / 09</span></div><div className="streak-readout"><div className="streak-pixel-fire" aria-hidden="true"><i /><i /><i /><i /><i /></div><div><strong>{streak.count}<small>days</small></strong><b>Training streak</b></div><div className="streak-status"><ShieldCheck size={16} /><span>{secured ? "Today secured" : "Next session due"}</span></div></div><div className="streak-week" aria-label="Weekly streak status">{["M", "T", "W", "T", "F", "S", "S"].map((day, index) => <span key={`${day}-${index}`} className={index < Math.min(streak.count, 7) ? "complete" : ""}><i />{day}</span>)}</div><p><i />{secured ? "Signal held. Return tomorrow to extend the sequence." : "Complete one full protocol to extend the sequence."}</p></section>;
}
