/** Kinetic Pixel Fitness: a compact, clinical 8-bit athlete monitor used as an accent, never a game substitute. */
type PixelAthleteProps = { focus: string; compact?: boolean };

export function PixelAthlete({ focus, compact = false }: PixelAthleteProps) {
  const focusKey = focus.toLowerCase().replace(/\s+/g, "-");
  return <div className={compact ? "pixel-athlete compact" : "pixel-athlete"} data-focus={focusKey} aria-hidden="true"><div className="pixel-screen"><div className="pixel-raster" /><div className="pixel-figure"><i className="pixel-head" /><i className="pixel-neck" /><i className="pixel-shoulder left" /><i className="pixel-shoulder right" /><i className="pixel-chest left" /><i className="pixel-chest right" /><i className="pixel-core" /><i className="pixel-arm left" /><i className="pixel-arm right" /><i className="pixel-leg left" /><i className="pixel-leg right" /><i className="pixel-foot left" /><i className="pixel-foot right" /></div><span className="pixel-target" /><span className="pixel-sweep" /></div><div className="pixel-caption"><span>ATH // 01</span><b>{focus.toUpperCase()}</b></div></div>;
}
