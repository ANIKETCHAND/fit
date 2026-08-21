/* Kinetic Anatomy Lab workflow shell: a linear instrument surface that carries a task-specific athlete scan through every routed flow. */
/* Carbon Command Deck: shared workflow chrome pairs a task-specific diagnostic strip with a quieter operational topbar. */
import type { ReactNode } from "react";
import { ArrowLeft, Bell, ChevronDown } from "lucide-react";
import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { Sidebar } from "@/components/navigation/Sidebar";

type WorkflowLayoutProps = { kicker: string; title: string; detail: string; children: ReactNode };

export function WorkflowLayout({ kicker, title, detail, children }: WorkflowLayoutProps) {
  const [, setLocation] = useLocation();
  return <div className="app-shell"><Sidebar /><main className="workflow-main"><header className="workflow-topbar"><div className="workflow-topbar-left"><button className="back-button" onClick={() => setLocation("/")}><ArrowLeft size={17} />Command center</button><div className="workflow-brand" aria-label="FitTrack"><img src="/manus-storage/fittrack-signal-mark_e3117665.png" alt="" /><strong>FIT<span>TRACK</span></strong></div></div><div className="workflow-status"><span><i />Live protocol</span><button className="icon-button" aria-label="Notifications" onClick={() => setLocation("/notifications")}><Bell size={18} /></button><button className="avatar-button" aria-label="Profile">JM<ChevronDown size={14} /></button></div></header><motion.section className="workflow-intro" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .42, ease: [0.23, 1, 0.32, 1] }}><span className="eyebrow">{kicker}</span><h1>{title}</h1><p>{detail}</p></motion.section><motion.div className="workflow-content" initial="hidden" animate="visible" variants={{ hidden: {}, visible: { transition: { staggerChildren: .08 } } }}>{children}</motion.div></main></div>;
}
