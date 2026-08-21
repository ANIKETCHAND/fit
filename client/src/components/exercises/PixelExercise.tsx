/** Kinetic Pixel Fitness exercise sprite: motion-led, low-resolution movement cues for the workout library. */
import type { ExerciseVariant } from "@/lib/rewards-data";

export function PixelExercise({ variant, active = true }: { variant: ExerciseVariant; active?: boolean }) {
  return <div className={`pixel-exercise ${variant} ${active ? "animated" : ""}`} aria-hidden="true"><span className="px-floor" /><span className="px-head" /><span className="px-torso" /><span className="px-arm left" /><span className="px-arm right" /><span className="px-leg left" /><span className="px-leg right" /><span className="px-tool" /><span className="px-signal one" /><span className="px-signal two" /></div>;
}
