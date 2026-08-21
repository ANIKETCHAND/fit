/** Kinetic Anatomy Lab: compact SVG radial metric with a crisp performance-data treatment. */
import { motion } from "framer-motion";

type MetricRingProps = { label: string; value: number; goal: number; unit: string; color: string; };
export function MetricRing({ label, value, goal, unit, color }: MetricRingProps) {
  const pct = Math.min(value / goal, 1); const circumference = 2 * Math.PI * 44;
  return <div className="macro-ring"><div className="ring-visual"><svg viewBox="0 0 112 112"><circle cx="56" cy="56" r="44" /><motion.circle cx="56" cy="56" r="44" style={{ stroke: color }} initial={{ strokeDashoffset: circumference }} animate={{ strokeDashoffset: circumference * (1 - pct) }} transition={{ duration: 0.8, ease: "easeOut" }} /></svg><div><strong>{value}</strong><small>{unit}</small></div></div><div className="ring-copy"><span>{label}</span><p>{goal - value} {unit} <em>left</em></p></div></div>;
}
