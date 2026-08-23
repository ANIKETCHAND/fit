/** Kinetic Anatomy Lab: focused right-side diagnostic panel driven by selected muscle data. */
import { ArrowUpRight, CalendarDays, Dumbbell, Play } from "lucide-react";
import { motion } from "framer-motion";
import type { MuscleInfo } from "@/lib/fitness-data";
import { useLocation } from "wouter";

export function MuscleInfo({ muscle }: { muscle: MuscleInfo }) {
  const [, setLocation] = useLocation();
  return (
    <motion.aside
      className="muscle-panel"
      key={muscle.id}
      initial={{ opacity: 0, x: 18 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.26 }}
      aria-label={`${muscle.label} training details`}
    >
      <div className="panel-kicker">
        <span className="panel-label">Muscle diagnostic</span>
        <span className={`status-pill ${muscle.status.toLowerCase()}`}>{muscle.status}</span>
      </div>

      <div className="muscle-heading" style={{ marginBottom: "16px" }}>
        <p>{muscle.label}</p>
        <h2>{muscle.anatomicalName}</h2>
      </div>

      <div className="training-meta">
        <div>
          <CalendarDays size={15} />
          <span>Last trained</span>
          <strong>{muscle.lastTrained}</strong>
        </div>
        <div>
          <Dumbbell size={15} />
          <span>Weekly volume</span>
          <strong>{muscle.weeklyVolume}</strong>
        </div>
      </div>

      <div className="exercise-title">
        <span className="panel-label">Recommended protocol</span>
        <button aria-label={`View all ${muscle.label} exercises`} onClick={() => setLocation("/exercise-library")}>
          View all <ArrowUpRight size={13} />
        </button>
      </div>

      <div className="exercise-list">
        {muscle.exercises.map((exercise, index) => (
          <div className="exercise-row" key={exercise.name}>
            <span className="exercise-index">0{index + 1}</span>
            <div className="exercise-details">
              <strong>{exercise.name}</strong>
              <p>{exercise.sets} sets × {exercise.reps} · {exercise.load}</p>
            </div>
          </div>
        ))}
      </div>

      <button className="start-workout" onClick={() => setLocation("/log-workout")}>
        <div className="start-workout-label">
          <Play size={15} fill="currentColor" />
          <span>Start {muscle.label} workout</span>
        </div>
        <span className="workout-time">45 min</span>
      </button>
    </motion.aside>
  );
}
