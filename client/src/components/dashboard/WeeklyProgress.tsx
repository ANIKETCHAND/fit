/** Kinetic Anatomy Lab: compact weekly training visualization with non-generic instrument styling. */
import { ArrowUpRight, Flame, Footprints, Scale } from "lucide-react";
import { weeklySessions } from "@/lib/fitness-data";

export function WeeklyProgress() {
  return <section className="weekly-card glass-panel"><div className="card-header"><div><span className="eyebrow">Weekly load</span><h3>Training rhythm</h3></div><button aria-label="Open training report"><ArrowUpRight size={17} /></button></div><div className="session-bars">{weeklySessions.map((session, index) => <div className={index === weeklySessions.length - 1 ? "today-session" : ""} key={`${session.day}-${index}`}><div className="bar-wrap"><div className="bar" style={{ height: `${Math.max(session.value, 5)}%` }} /></div><span>{session.day}</span></div>)}</div><div className="week-note"><span><i />4 of 5 sessions complete</span><b>+12% <em>vs last week</em></b></div></section>;
}

export function VitalStrip() {
  const data = [{ icon: Flame, label: "Calories", value: "1,846", sub: "of 2,400 kcal", accent: "lime" }, { icon: Scale, label: "Weight", value: "74.8", sub: "kg · −0.4 this week", accent: "blue" }, { icon: Footprints, label: "Steps", value: "8,426", sub: "78% of target", accent: "lavender" }];
  return <div className="vital-strip">{data.map(({ icon: Icon, ...vital }) => <div className="vital-item" key={vital.label}><span className={`vital-icon ${vital.accent}`}><Icon size={16} /></span><div><p>{vital.label}</p><b>{vital.value}</b><small>{vital.sub}</small></div></div>)}</div>;
}
