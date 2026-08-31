import { Activity, ArrowUpRight, Flame, Sparkles, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { muscleLibrary, type MuscleId, getRecoveryStatus } from "@/lib/fitness-data";

export function MuscleRecoveryOverviewCard() {
  const [, setLocation] = useLocation();
  const muscleList = Object.values(muscleLibrary);

  const readyMuscles = muscleList.filter((m) => m.score >= 80);
  const recoveringMuscles = muscleList.filter((m) => m.score >= 65 && m.score < 80);
  const restMuscles = muscleList.filter((m) => m.score < 65);

  const totalMuscles = muscleList.length;
  const readyCount = readyMuscles.length;
  const overallReadiness = Math.round((readyCount / totalMuscles) * 100);

  return (
    <section className="bg-gradient-to-br from-[#121914] to-[#0a0e0b] border border-white/10 rounded-2xl p-5 shadow-xl relative overflow-hidden flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-white/5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#c6ff3d]/10 border border-[#c6ff3d]/30 flex items-center justify-center text-[#c6ff3d]">
              <Activity size={16} />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#8b9c8a] block">
                Muscle Readiness
              </span>
              <h3 className="text-base font-bold text-white uppercase font-sans">
                Recovery Studio
              </h3>
            </div>
          </div>

          <span className="text-xs font-mono text-[#c6ff3d] bg-[#c6ff3d]/10 px-2.5 py-1 rounded-full border border-[#c6ff3d]/30 font-bold">
            {readyCount}/{totalMuscles} Ready
          </span>
        </div>

        {/* Readiness Bar */}
        <div className="my-4">
          <div className="flex justify-between items-center text-xs font-mono text-[#8b9c8a] mb-1.5">
            <span>Body Readiness Score</span>
            <span className="text-white font-bold">{overallReadiness}%</span>
          </div>
          <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden flex">
            <motion.div
              className="h-full bg-[#22c55e]"
              initial={{ width: 0 }}
              animate={{ width: `${(readyCount / totalMuscles) * 100}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
            <motion.div
              className="h-full bg-[#f59e0b]"
              initial={{ width: 0 }}
              animate={{ width: `${(recoveringMuscles.length / totalMuscles) * 100}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
            <motion.div
              className="h-full bg-[#ef4444]"
              initial={{ width: 0 }}
              animate={{ width: `${(restMuscles.length / totalMuscles) * 100}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </div>
        </div>

        {/* Readiness Badges */}
        <div className="space-y-2 mb-4">
          <div>
            <span className="text-[10px] font-mono text-[#8b9c8a] uppercase tracking-wider block mb-1">
              🟢 Ready for Training ({readyCount})
            </span>
            <div className="flex flex-wrap gap-1.5">
              {readyMuscles.map((m) => (
                <span
                  key={m.id}
                  className="bg-[#22c55e]/10 border border-[#22c55e]/30 text-[#22c55e] text-[10px] font-mono px-2 py-0.5 rounded-md"
                >
                  {m.label} ({m.score}%)
                </span>
              ))}
            </div>
          </div>

          {recoveringMuscles.length > 0 && (
            <div>
              <span className="text-[10px] font-mono text-[#8b9c8a] uppercase tracking-wider block mb-1">
                🟡 Recovering ({recoveringMuscles.length})
              </span>
              <div className="flex flex-wrap gap-1.5">
                {recoveringMuscles.map((m) => (
                  <span
                    key={m.id}
                    className="bg-[#f59e0b]/10 border border-[#f59e0b]/30 text-[#f59e0b] text-[10px] font-mono px-2 py-0.5 rounded-md"
                  >
                    {m.label} ({m.score}%)
                  </span>
                ))}
              </div>
            </div>
          )}

          {restMuscles.length > 0 && (
            <div>
              <span className="text-[10px] font-mono text-[#8b9c8a] uppercase tracking-wider block mb-1">
                🔴 Needs Rest ({restMuscles.length})
              </span>
              <div className="flex flex-wrap gap-1.5">
                {restMuscles.map((m) => (
                  <span
                    key={m.id}
                    className="bg-[#ef4444]/10 border border-[#ef4444]/30 text-[#ef4444] text-[10px] font-mono px-2 py-0.5 rounded-md"
                  >
                    {m.label} ({m.score}%)
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Button to Open 3D Studio */}
      <button
        onClick={() => setLocation("/body-map")}
        className="w-full py-2.5 px-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#c6ff3d]/40 rounded-xl text-xs font-mono text-white hover:text-[#c6ff3d] transition-all flex items-center justify-center gap-2 group"
      >
        <span>Open 3D Muscle Studio</span>
        <ArrowUpRight size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
      </button>
    </section>
  );
}
