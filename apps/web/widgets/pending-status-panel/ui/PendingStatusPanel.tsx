"use client";

import { motion } from "motion/react";
import { useBlock } from "@/entities/block";
import { useCountdown } from "@/shared/ui/CountdownTimer";

export function PendingStatusPanel() {
  const { block } = useBlock();

  const blockId = block?.id || 0;
  const winnerNickname = block?.winner_nickname || "Anonymous";
  const solvedAt = block?.solved_at || new Date().toISOString();

  const { timeLeft } = useCountdown(solvedAt, 180);

  return (
    <div className="space-y-4">
      <div className="bg-[#1e293b]/40 backdrop-blur-md border border-emerald-500/30 rounded-xl p-6 text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full"
          />
          <h2 className="text-xl font-bold text-slate-50">
            Block <span className="text-blue-400 font-mono">#{blockId}</span> Solved!
          </h2>
        </div>

        <p className="text-slate-300 mb-2">
          Winner <span className="text-emerald-400 font-bold">{winnerNickname}</span>
        </p>

        <p className="text-slate-400 text-sm mb-4">
          is setting the hint for the next password...
        </p>

        <div className="inline-block px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-lg">
          <span className="text-amber-400 font-mono text-xl font-bold">{timeLeft}s</span>
          <span className="text-amber-300/70 text-sm ml-2">remaining</span>
        </div>

        {timeLeft === 0 && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-amber-400 text-sm mt-4"
          >
            System is generating a random password...
          </motion.p>
        )}
      </div>
    </div>
  );
}
