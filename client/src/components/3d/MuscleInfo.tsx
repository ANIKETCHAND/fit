/** Kinetic Anatomy Lab: focused right-side diagnostic panel driven by selected muscle data. */
import { ArrowUpRight, CalendarDays, Dumbbell, Play, Zap } from "lucide-react";
import { motion } from "framer-motion";
import type { MuscleInfo } from "@/lib/fitness-data";
import { useLocation } from "wouter";

export function MuscleInfo({ muscle }: { muscle: MuscleInfo }) {
  const [, setLocation] = useLocation();
  return <motion.aside className="muscle-panel" key={muscle.id} initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.26 }} aria-label={`${muscle.label} training details`}>
    <div className="panel-kicker"><span>Muscle diagnostic</span><span className={`status-pill ${muscle.status.toLowerCase()}`}>{muscle.status}</span></div>
    <div className="muscle-heading"><p>{muscle.label}</p><h2>{muscle.anatomicalName}</h2><span>{muscle.intensity}</span></div>
    <div className="readiness-meter"><div className="readiness-orbit"><svg viewBox="0 0 120 120"><circle cx="60" cy="60" r="48" /><circle className="readiness-progress" cx="60" cy="60" r="48" style={{ strokeDashoffset: 302 - 302 * muscle.score / 100 }} /></svg><div><strong>{muscle.score}</strong><small>Score</small></div></div><div className="readiness-copy"><span><Zap size={14} /> Weekly readiness</span><b>{muscle.score >= 76 ? "Peak window" : muscle.score >= 68 ? "Good capacity" : "Ease in today"}</b><p>Based on volume, rest, and recent performance.</p></div></div>
    <div className="training-meta"><div><CalendarDays size={15} /><span>Last trained</span><strong>{muscle.lastTrained}</strong></div><div><Dumbbell size={15} /><span>Weekly volume</span><strong>{muscle.weeklyVolume}</strong></div></div>
    <div className="exercise-title"><div><span>Recommended protocol</span><b>3 movements</b></div><button aria-label={`View all ${muscle.label} exercises`} onClick={() => setLocation("/exercise-library")}>View all <ArrowUpRight size={14} /></button></div>
    <div className="exercise-list">{muscle.exercises.map((exercise, index) => <div className="exercise-row" key={exercise.name}><span className="exercise-index">0{index + 1}</span><div><strong>{exercise.name}</strong><p>{exercise.sets} sets × {exercise.reps} · {exercise.load}</p></div><b>{exercise.volume}</b></div>)}</div>
    <button className="start-workout" onClick={() => setLocation("/log-workout")}><Play size={17} fill="currentColor" />Start {muscle.label} workout<span>45 min</span></button>
  </motion.aside>;
}
