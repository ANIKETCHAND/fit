/* Kinetic Anatomy Lab workout card: compact evidence panel with retained coaching and staging controls. */
/* Kinetic Anatomy Lab: data-first movement cards; no decorative exercise scene. */
import { useState } from "react";
import { ArrowUpRight, EyeOff, Heart } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import type { LibraryExercise } from "@/lib/rewards-data";
import type { ExerciseTarget } from "@/lib/user-store";
import "./WorkoutCompact.css";

type ExerciseFlipCardProps = {
  exercise: LibraryExercise;
  index: number;
  onStage: (exercise: LibraryExercise) => void;
  favorite: boolean;
  viewed: boolean;
  target: ExerciseTarget;
  onTargetChange: (target: Pick<ExerciseTarget, "sets" | "reps">) => void;
  onCompletionChange: (completed: boolean) => void;
  onFavorite: () => void;
  onHide: () => void;
  onViewed: () => void;
};

export function ExerciseFlipCard({ exercise, index, onStage, favorite, viewed, target, onTargetChange, onCompletionChange, onFavorite, onHide, onViewed }: ExerciseFlipCardProps) {
  const [flipped, setFlipped] = useState(false);
  const flip = () => {
    if (!flipped) onViewed();
    setFlipped((state) => !state);
  };

  return (
    <article className={`exercise-card exercise-card--compact ${favorite ? "is-favorite" : ""} ${target.completed ? "is-complete" : ""}`}>
      <div className="exercise-preference-row" aria-label={`${exercise.name} library controls`}>
        <button onClick={onFavorite} aria-label={`${favorite ? "Remove" : "Add"} ${exercise.name} from favorites`}>
          <Heart size={13} fill={favorite ? "currentColor" : "none"} />
          {favorite ? "Saved" : "Save"}
        </button>
        <button onClick={onHide} aria-label={`Hide ${exercise.name} from the exercise library`}>
          <EyeOff size={13} /> Hide
        </button>
      </div>

      {flipped ? (
        <section className="exercise-card-face exercise-coaching-panel" aria-label={`${exercise.name} coaching cues`}>
          <span className="exercise-card-top"><span className="protocol-tag">Coach cue</span><span>TIP / 0{index + 1}</span></span>
          <span className="coaching-copy"><small>Set the position</small><b>{exercise.coaching.setup}</b><small>Primary cue</small><strong>{exercise.coaching.cue}</strong><small>Keep in reserve</small><p>{exercise.coaching.tip}</p></span>
          <button className="coaching-toggle" onClick={flip}>Return to movement</button>
        </section>
      ) : (
        <section className="exercise-card-face exercise-card-front">
          <span className="exercise-card-top"><span className="protocol-tag">{exercise.level}</span><span>EX / 0{index + 1}</span></span>
          <span className="exercise-card-copy"><span>{exercise.focus}</span><h2>{exercise.name}</h2></span>
          <span className="exercise-prescription" aria-label={`${exercise.name} training prescription`}>
            <label><small>Sets</small><input value={target.sets} inputMode="numeric" onChange={(event) => onTargetChange({ sets: event.target.value.replace(/[^0-9]/g, ""), reps: target.reps })} aria-label={`Sets target for ${exercise.name}`} /></label>
            <label><small>Reps</small><input value={target.reps} onChange={(event) => onTargetChange({ sets: target.sets, reps: event.target.value })} aria-label={`Repetitions target for ${exercise.name}`} /></label>
            <span><small>Equipment</small><b>{exercise.equipment}</b></span>
            <span><small>Tempo</small><b>{exercise.tempo}</b></span>
          </span>
          <button className="coaching-toggle" onClick={flip}>{viewed ? "Coaching reviewed" : "View coaching cues"}</button>
        </section>
      )}

      <div className="exercise-card-actions"><div className="exercise-completion"><Checkbox id={`complete-${exercise.id}`} checked={target.completed} onCheckedChange={(checked) => onCompletionChange(checked === true)} /><label htmlFor={`complete-${exercise.id}`}>{target.completed ? "Completed" : "Mark complete"}</label></div><button className="stage-movement" onClick={() => onStage(exercise)}>Stage movement <ArrowUpRight size={15} /></button></div>
    </article>
  );
}
