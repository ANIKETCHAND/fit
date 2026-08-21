/** Kinetic Anatomy Lab: tactile camera controls for the body-stage instrumentation. */
import { Maximize2, RotateCcw, Rotate3D, ScanFace, ScanLine, ScanSearch } from "lucide-react";

export type BodyView = "front" | "back" | "side";

type BodyControlsProps = { view: BodyView; autoRotate: boolean; onView: (view: BodyView) => void; onReset: () => void; onToggleRotate: () => void; };

export function BodyControls({ view, autoRotate, onView, onReset, onToggleRotate }: BodyControlsProps) {
  return <div className="body-controls" aria-label="Body viewer controls">
    <div className="view-picker" role="group" aria-label="Camera view">
      <button className={view === "front" ? "active" : ""} onClick={() => onView("front")} aria-pressed={view === "front"}><ScanFace size={15} /><span>Front</span></button>
      <button className={view === "back" ? "active" : ""} onClick={() => onView("back")} aria-pressed={view === "back"}><ScanLine size={15} /><span>Back</span></button>
      <button className={view === "side" ? "active" : ""} onClick={() => onView("side")} aria-pressed={view === "side"}><ScanSearch size={15} /><span>Side</span></button>
    </div>
    <div className="view-actions">
      <button className={autoRotate ? "active-icon" : ""} onClick={onToggleRotate} aria-label="Toggle automatic rotation" aria-pressed={autoRotate}><Rotate3D size={17} /></button>
      <button onClick={onReset} aria-label="Reset body rotation"><RotateCcw size={17} /></button>
      <button className="desktop-only" onClick={() => document.documentElement.requestFullscreen?.()} aria-label="Enter fullscreen"><Maximize2 size={16} /></button>
    </div>
  </div>;
}
