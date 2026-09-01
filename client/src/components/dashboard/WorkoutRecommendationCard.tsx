import { ArrowRight } from "lucide-react";
import { useLocation } from "wouter";

interface ExerciseItem {
  id: string;
  name: string;
  sets: string;
  rpe: string;
}

const defaultExercises: ExerciseItem[] = [
  { id: "01", name: "Back Squat", sets: "4-6", rpe: "RPE 7" },
  { id: "02", name: "Romanian Deadlift", sets: "4-8", rpe: "RPE 7" },
  { id: "03", name: "Bulgarian Split Squat", sets: "3-10", rpe: "RPE 7" },
];

export function WorkoutRecommendationCard() {
  const [, setLocation] = useLocation();

  return (
    <div className="editorial-card">
      <div className="card-topline">
        <span className="card-label">WORKOUT RECOMMENDATION</span>
      </div>

      <h3 className="card-heading">Lower Body Foundation</h3>

      <div className="exercise-table">
        {defaultExercises.map((ex) => (
          <div key={ex.id} className="exercise-table-row">
            <span className="exercise-num">{ex.id}</span>
            <span className="exercise-name">{ex.name}</span>
            <span className="exercise-sets">{ex.sets}</span>
            <span className="exercise-rpe">{ex.rpe}</span>
          </div>
        ))}
      </div>

      <button
        className="card-footer-link"
        onClick={() => setLocation("/exercise-library")}
      >
        <span>View full workout</span>
        <ArrowRight size={14} />
      </button>
    </div>
  );
}
