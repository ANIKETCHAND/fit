/* Kinetic Anatomy Lab workout card: compact evidence panel with retained coaching and staging controls. */
import { useState, useRef } from "react";
import { ArrowUpRight, EyeOff, Heart, Maximize2, Minimize2, Pause, Play, Volume2, VolumeX } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import type { LibraryExercise } from "@/lib/rewards-data";
import type { ExerciseTarget } from "@/lib/user-store";
import "./WorkoutCompact.css";

const videoMap: Record<string, string> = {
  "bench-press": "/videos/bench-press.mp4",
  "incline-db-press": "/videos/incline-db-press.mp4",
  "cable-fly": "/videos/cable-fly.mp4",
  "chest-dips": "/videos/bench-press.mp4",
  "barbell-back-squat": "/videos/barbell-back-squat.mp4",
  "front-squat": "/videos/barbell-back-squat.mp4",
  "leg-press": "/videos/barbell-back-squat.mp4",
  "bulgarian-split-squat": "/videos/barbell-back-squat.mp4",
  "lat-pulldown": "/videos/lat-pulldown.mp4",
  "chest-row": "/videos/lat-pulldown.mp4",
  "barbell-row": "/videos/lat-pulldown.mp4",
  "pull-ups": "/videos/lat-pulldown.mp4",
  "overhead-press": "/videos/overhead-press.mp4",
  "seated-press": "/videos/overhead-press.mp4",
  "lateral-raise": "/videos/lateral-raise.mp4",
  "face-pull": "/videos/lateral-raise.mp4",
  "incline-curl": "/videos/incline-curl.mp4",
  "barbell-preacher-curl": "/videos/incline-curl.mp4",
  "hammer-curl": "/videos/hammer-curl.mp4",
  "tricep-pushdown": "/videos/tricep-pushdown.mp4",
  "skull-crushers": "/videos/skull-crushers.mp4",
  "romanian-deadlift": "/videos/barbell-back-squat.mp4",
  "lying-leg-curl": "/videos/barbell-back-squat.mp4",
  "hanging-leg-raise": "/videos/hanging-leg-raise.mp4",
  "cable-woodchopper": "/videos/hanging-leg-raise.mp4",
  "ab-wheel-rollout": "/videos/hanging-leg-raise.mp4",
};

type ExerciseFlipCardProps = {
  exercise: LibraryExercise;
  index: number;
  onStage: (exercise: LibraryExercise) => void;
  favorite: boolean;
  viewed: boolean;
  isActive?: boolean;
  onSelect?: () => void;
  target: ExerciseTarget;
  onTargetChange: (target: Pick<ExerciseTarget, "sets" | "reps">) => void;
  onCompletionChange: (completed: boolean) => void;
  onFavorite: () => void;
  onHide: () => void;
  onViewed: () => void;
  onWatchVideo?: (exercise: LibraryExercise) => void;
};

export function ExerciseFlipCard({
  exercise,
  index,
  onStage,
  favorite,
  viewed,
  isActive,
  onSelect,
  target,
  onTargetChange,
  onCompletionChange,
  onFavorite,
  onHide,
  onViewed,
  onWatchVideo,
}: ExerciseFlipCardProps) {
  const [flipped, setFlipped] = useState(false);
  const [showInlineVideo, setShowInlineVideo] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const videoSrc = videoMap[exercise.id] || "/videos/bench-press.mp4";

  const flip = () => {
    if (!flipped) onViewed();
    setFlipped((state) => !state);
  };

  const toggleInlineVideo = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowInlineVideo((prev) => !prev);
  };

  return (
    <article
      className={`exercise-card exercise-card--compact ${favorite ? "is-favorite" : ""} ${
        target.completed ? "is-complete" : ""
      } ${isActive ? "is-active" : ""}`}
      onClick={onSelect}
      onMouseEnter={onSelect}
      style={{ cursor: "pointer" }}
    >
      <div className="exercise-preference-row" aria-label={`${exercise.name} library controls`}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onFavorite();
          }}
          aria-label={`${favorite ? "Remove" : "Add"} ${exercise.name} from favorites`}
        >
          <Heart size={13} fill={favorite ? "currentColor" : "none"} />
          {favorite ? "Saved" : "Save"}
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onHide();
          }}
          aria-label={`Hide ${exercise.name} from the exercise library`}
        >
          <EyeOff size={13} /> Hide
        </button>
      </div>

      {flipped ? (
        <section className="exercise-card-face exercise-coaching-panel" aria-label={`${exercise.name} coaching cues`}>
          <span className="exercise-card-top">
            <span className="protocol-tag">Coach cue</span>
            <span>TIP / 0{index + 1}</span>
          </span>
          <span className="coaching-copy">
            <small>Set the position</small>
            <b>{exercise.coaching.setup}</b>
            <small>Primary cue</small>
            <strong>{exercise.coaching.cue}</strong>
            <small>Keep in reserve</small>
            <p>{exercise.coaching.tip}</p>
          </span>
          <button
            className="coaching-toggle"
            onClick={(e) => {
              e.stopPropagation();
              flip();
            }}
          >
            Return to movement
          </button>
        </section>
      ) : (
        <section className="exercise-card-face exercise-card-front">
          <span className="exercise-card-top">
            <span className="protocol-tag">{exercise.level}</span>
            <button
              type="button"
              className="card-video-tag"
              onClick={(e) => {
                e.stopPropagation();
                onWatchVideo ? onWatchVideo(exercise) : toggleInlineVideo(e);
              }}
              title={`Watch Video Form for ${exercise.name}`}
            >
              <Play size={10} fill="currentColor" /> Video Guide
            </button>
            <span>EX / 0{index + 1}</span>
          </span>
          <span className="exercise-card-copy">
            <span>{exercise.focus}</span>
            <h2 className="flex items-center justify-between gap-2">
              <span>{exercise.name}</span>
              <button
                type="button"
                className="exercise-title-play-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  onWatchVideo ? onWatchVideo(exercise) : toggleInlineVideo(e);
                }}
                title={`Play ${exercise.name} video tutorial`}
              >
                <Play size={13} fill="currentColor" />
              </button>
            </h2>
          </span>

          {/* INLINE VIDEO PLAYER WHEN EXPANDED */}
          {showInlineVideo ? (
            <div
              className="relative w-full aspect-video bg-black rounded overflow-hidden my-2 border border-[#c6ff3d]/50 shadow-[0_0_15px_rgba(198,255,61,0.2)]"
              onClick={(e) => e.stopPropagation()}
            >
              <video
                ref={videoRef}
                src={videoSrc}
                autoPlay
                loop
                muted={isMuted}
                playsInline
                className="w-full h-full object-cover"
              />
              <div className="absolute top-1.5 right-1.5 flex items-center gap-1 bg-black/70 rounded p-1">
                <button
                  type="button"
                  onClick={() => setIsMuted(!isMuted)}
                  className="text-white hover:text-[#c6ff3d] p-0.5"
                  title={isMuted ? "Unmute" : "Mute"}
                >
                  {isMuted ? <VolumeX size={12} /> : <Volume2 size={12} />}
                </button>
                <button
                  type="button"
                  onClick={() => onWatchVideo?.(exercise)}
                  className="text-white hover:text-[#c6ff3d] p-0.5"
                  title="Expand Full Modal"
                >
                  <Maximize2 size={12} />
                </button>
                <button
                  type="button"
                  onClick={toggleInlineVideo}
                  className="text-white hover:text-[#c6ff3d] p-0.5 text-[10px] font-mono px-1 font-bold"
                  title="Close Video"
                >
                  ✕
                </button>
              </div>
            </div>
          ) : (
            <>
              <span className="exercise-prescription" aria-label={`${exercise.name} training prescription`}>
                <label onClick={(e) => e.stopPropagation()}>
                  <small>Sets</small>
                  <input
                    value={target.sets}
                    inputMode="numeric"
                    onChange={(event) =>
                      onTargetChange({ sets: event.target.value.replace(/[^0-9]/g, ""), reps: target.reps })
                    }
                    aria-label={`Sets target for ${exercise.name}`}
                  />
                </label>
                <label onClick={(e) => e.stopPropagation()}>
                  <small>Reps</small>
                  <input
                    value={target.reps}
                    onChange={(event) => onTargetChange({ sets: target.sets, reps: event.target.value })}
                    aria-label={`Repetitions target for ${exercise.name}`}
                  />
                </label>
                <span>
                  <small>Equipment</small>
                  <b>{exercise.equipment}</b>
                </span>
                <span>
                  <small>Tempo</small>
                  <b>{exercise.tempo}</b>
                </span>
              </span>

              {/* Prominent Full-Width Neon Video Play Button */}
              <button
                type="button"
                className="card-video-banner-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  onWatchVideo?.(exercise);
                }}
              >
                <span className="video-play-pulse-icon">
                  <Play size={13} fill="currentColor" />
                </span>
                <span>▶ PLAY FORM VIDEO GUIDE</span>
              </button>
            </>
          )}

          <button
            className="coaching-toggle"
            onClick={(e) => {
              e.stopPropagation();
              flip();
            }}
          >
            {viewed ? "Coaching reviewed" : "View coaching cues"}
          </button>
        </section>
      )}

      <div className="exercise-card-actions">
        <div className="exercise-completion" onClick={(e) => e.stopPropagation()}>
          <Checkbox
            id={`complete-${exercise.id}`}
            checked={target.completed}
            onCheckedChange={(checked) => onCompletionChange(checked === true)}
          />
          <label htmlFor={`complete-${exercise.id}`}>
            {target.completed ? "Done" : "Complete"}
          </label>
        </div>
        <button
          type="button"
          className="video-action-btn"
          onClick={(e) => {
            e.stopPropagation();
            onWatchVideo ? onWatchVideo(exercise) : toggleInlineVideo(e);
          }}
          title={`Watch ${exercise.name} video demonstration`}
        >
          <Play size={11} fill="currentColor" /> Video
        </button>
        <button
          className="stage-movement"
          onClick={(e) => {
            e.stopPropagation();
            onStage(exercise);
          }}
        >
          Stage <ArrowUpRight size={13} />
        </button>
      </div>
    </article>
  );
}
