/* Kinetic Anatomy Lab session screen: an immersive pre-session launch surface with a working interval clock. */
import { useEffect, useState } from "react";
import { Activity, Pause, Play, RotateCcw, Timer } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { WorkflowLayout } from "@/components/workflows/WorkflowLayout";

const format = (seconds: number) => `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
export default function StartSession() {
  const [running, setRunning] = useState(false); const [seconds, setSeconds] = useState(0); const [mode, setMode] = useState("Strength");
  useEffect(() => { if (!running) return; const interval = window.setInterval(() => setSeconds((value) => value + 1), 1000); return () => window.clearInterval(interval); }, [running]);
  const end = () => { setRunning(false); toast(`Session archived at ${format(seconds)}`); };
  return <WorkflowLayout kicker="Session / launch" title="Start a session" detail="Choose the training mode, verify the body signal, then run the session clock from the floor."><motion.section className="workflow-grid session-grid" variants={{ hidden: { opacity: 0, y: 14 }, visible: { opacity: 1, y: 0 } }}><div className="workflow-panel session-console"><span className="panel-label">Select training mode</span><div className="mode-grid">{["Strength", "Conditioning", "Recovery"].map((item) => <button key={item} className={mode === item ? "selected" : ""} onClick={() => setMode(item)}><Activity size={17} />{item}</button>)}</div><div className={running ? "session-clock running" : "session-clock"}><Timer size={22} /><strong>{format(seconds)}</strong><span>{mode} session</span><i /></div><div className="session-controls"><button onClick={() => setSeconds(0)} aria-label="Reset session"><RotateCcw size={17} /></button><button className="session-primary" onClick={() => setRunning((value) => !value)}>{running ? <Pause size={18} /> : <Play size={18} />}{running ? "Pause session" : "Launch session"}</button></div></div><aside className="workflow-panel session-readiness"><span className="panel-label">Pre-session readout</span><div className="readiness-number"><b>84</b><span>/100<br />ready</span></div><div className="signal-row"><i />Pectoral load cleared</div><div className="signal-row"><i />Fuel reserve sufficient</div><div className="signal-row soft"><i />Hydration stable</div><button className="commit-button subdued" onClick={end}>End and archive <span>↗</span></button></aside></motion.section></WorkflowLayout>;
}
