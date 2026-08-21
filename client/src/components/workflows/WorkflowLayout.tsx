/* Kinetic Anatomy Lab workflow shell: a linear instrument surface that carries a task-specific athlete scan through every routed flow. */
/* Carbon Command Deck: shared workflow chrome pairs a task-specific diagnostic strip with a quieter operational topbar. */
import type { ReactNode } from "react";
import { ArrowLeft, Bell, ChevronDown } from "lucide-react";
import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { Sidebar } from "@/components/navigation/Sidebar";
import { PixelAthlete } from "@/components/PixelAthlete";

type WorkflowLayoutProps = { kicker: string; title: string; detail: string; children: ReactNode };
type ScanSignal = { label: string; code: string; nodes: string[]; visual: "anatomy" | "calibration" | "support" };
const taskSignals: Record<string, ScanSignal> = {
  "Nutrition / live entry": { label: "Fuel reserve", code: "MET / 04", nodes: ["GLY", "CHO", "REC"], visual: "anatomy" },
  "Training / strength log": { label: "Pectoral major", code: "MUS / 01", nodes: ["PEC", "LOAD", "RPE"], visual: "anatomy" },
  "Biometrics / daily checkpoint": { label: "Mass trend", code: "BIO / 07", nodes: ["MASS", "TREND", "DELTA"], visual: "anatomy" },
  "Session / live launch": { label: "Readiness scan", code: "PRE / 02", nodes: ["SLEEP", "FUEL", "LOAD"], visual: "anatomy" },
  "Progress / achievement cabinet": { label: "Pectoral / record", code: "REW / 05", nodes: ["PR", "LOAD", "CHAIN"], visual: "anatomy" },
  "Training / movement library": { label: "Movement / scan", code: "MOV / 03", nodes: ["FORM", "RANGE", "LOAD"], visual: "anatomy" },
  "System / calibration": { label: "Baseline / calibration", code: "SYS / 08", nodes: ["BASE", "ENERGY", "GOAL"], visual: "calibration" },
  "Support / operations": { label: "Support / signal", code: "SUP / 09", nodes: ["GUIDE", "TRACE", "ROUTE"], visual: "support" },
};

function ScanVisual({ visual }: { visual: ScanSignal["visual"] }) {
  if (visual === "calibration") return <div className="calibration-scan-visual" aria-hidden="true"><i className="baseline-axis axis-h" /><i className="baseline-axis axis-v" /><i className="baseline-ring ring-a" /><i className="baseline-ring ring-b" /><i className="baseline-node node-a" /><i className="baseline-node node-b" /><i className="baseline-node node-c" /><span>MEASURE</span><b>0.00 / BASE</b></div>;
  if (visual === "support") return <div className="support-scan-visual" aria-hidden="true"><i className="trace-line trace-one" /><i className="trace-line trace-two" /><i className="trace-line trace-three" /><i className="trace-node trace-a" /><i className="trace-node trace-b" /><i className="trace-node trace-c" /><span>TRACE / 3</span><b>ROUTE LOCK</b></div>;
  return <><div className="scan-orb"><i /><i /><i /></div><div className="workflow-anatomy-tile"><i className="scan-head" /><i className="scan-torso" /><i className="scan-pec left" /><i className="scan-pec right" /><i className="scan-core" /><span /></div><PixelAthlete focus="Athlete scan" compact /></>;
}

export function WorkflowLayout({ kicker, title, detail, children }: WorkflowLayoutProps) {
  const [, setLocation] = useLocation();
  const scan: ScanSignal = taskSignals[kicker] ?? { label: "Athlete scan", code: "FIT / 00", nodes: ["LIVE", "CORE", "SYNC"], visual: "anatomy" };
  return <div className="app-shell"><Sidebar /><main className="workflow-main"><header className="workflow-topbar"><div className="workflow-topbar-left"><button className="back-button" onClick={() => setLocation("/")}><ArrowLeft size={17} />Command center</button><div className="workflow-brand" aria-label="FitTrack"><img src="/manus-storage/fittrack-signal-mark_e3117665.png" alt="" /><strong>FIT<span>TRACK</span></strong></div></div><div className="workflow-status"><span><i />Live protocol</span><button className="icon-button" aria-label="Notifications" onClick={() => setLocation("/notifications")}><Bell size={18} /></button><button className="avatar-button" aria-label="Profile">JM<ChevronDown size={14} /></button></div></header><div className={`workflow-scan-signal ${scan.visual}-signal`} aria-hidden="true"><div className="workflow-scan-grid" /><span className="scan-index">{scan.code}</span><ScanVisual visual={scan.visual} /><div className="scan-copy"><small>Active signal</small><b>{scan.label}</b></div><div className="scan-nodes">{scan.nodes.map((node, index) => <span key={node}><i />0{index + 1} {node}</span>)}</div></div><div className="workflow-signal-rail" aria-hidden="true"><span>0.1 {scan.nodes[0]}</span><i /><span>0.2 {scan.nodes[1]}</span><i /><span>0.3 {scan.nodes[2]}</span></div><motion.section className="workflow-intro" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .42, ease: [0.23, 1, 0.32, 1] }}><span className="eyebrow">{kicker}</span><h1>{title}</h1><p>{detail}</p></motion.section><motion.div className="workflow-content" initial="hidden" animate="visible" variants={{ hidden: {}, visible: { transition: { staggerChildren: .08 } } }}>{children}</motion.div></main></div>;
}
