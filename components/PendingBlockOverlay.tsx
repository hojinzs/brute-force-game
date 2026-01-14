"use client";

import { useState, useEffect } from "react";
import { motion } from "motion/react";

type PendingBlockOverlayProps = {
  blockId: number;
  winnerNickname: string;
  solvedAt: string;
};

export function PendingBlockOverlay({
  blockId,
  winnerNickname,
  solvedAt,
}: PendingBlockOverlayProps) {
  const [timeLeft, setTimeLeft] = useState(180);

  useEffect(() => {
    const solvedTime = new Date(solvedAt).getTime();
    
    const interval = setInterval(() => {
      const now = Date.now();
      const elapsed = Math.floor((now - solvedTime) / 1000);
      const remaining = Math.max(0, 180 - elapsed);
      
      setTimeLeft(remaining);
      
      if (remaining === 0) {
        clearInterval(interval);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [solvedAt]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{
        backdropFilter: "blur(8px)",
        background: "rgba(15, 23, 42, 0.9)",
      }}
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-center max-w-2xl px-4"
      >
        <motion.div
          animate={{
            scale: [1, 1.05, 1],
          }}
          transition={{ duration: 2, repeat: Infinity }}
          className="mb-8"
        >
          <div className="w-24 h-24 mx-auto mb-6 relative">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="w-full h-full border-4 border-blue-500 border-t-transparent rounded-full"
            />
          </div>
        </motion.div>

        <h1 className="text-3xl font-bold text-slate-50 mb-4">
          Block <span className="text-blue-400 font-mono">#{blockId}</span> Solved!
        </h1>

        <p className="text-xl text-slate-300 mb-2">
          Winner{" "}
          <span className="text-emerald-400 font-bold">{winnerNickname}</span>
        </p>

        <p className="text-lg text-slate-400 mb-8">
          is setting the hint for the next password...
        </p>

        <div className="inline-block px-6 py-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
          <p className="text-amber-400 font-mono text-2xl font-bold">
            {timeLeft}s
          </p>
          <p className="text-amber-300/70 text-sm">remaining</p>
        </div>

        <motion.p
          className="text-slate-500 text-sm mt-8"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          {timeLeft === 0
            ? "System is generating a random password..."
            : "Please wait..."}
        </motion.p>
      </motion.div>
    </motion.div>
  );
}
