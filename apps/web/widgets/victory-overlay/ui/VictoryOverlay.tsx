"use client";

import { motion } from "motion/react";

type VictoryOverlayProps = {
  blockId: number;
  winnerNickname: string;
  show: boolean;
};

export function VictoryOverlay({
  blockId,
  winnerNickname,
  show,
}: VictoryOverlayProps) {
  if (!show) return null;

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
        className="text-center"
      >
        <motion.h1
          className="text-6xl font-bold text-emerald-400 mb-6 glitch"
          animate={{
            textShadow: [
              "0 0 10px #10b981",
              "0 0 20px #10b981",
              "0 0 10px #10b981",
            ],
          }}
          transition={{ duration: 0.5, repeat: Infinity }}
        >
          BLOCK SOLVED!
        </motion.h1>

        <div className="space-y-4 text-slate-300">
          <p className="text-2xl">
            Block <span className="text-blue-400 font-mono">#{blockId}</span>
          </p>
          <p className="text-xl">
            Winner:{" "}
            <span className="text-emerald-400 font-bold">{winnerNickname}</span>
          </p>
          <motion.p
            className="text-slate-500 text-sm mt-8"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            Waiting for the next block to be created...
          </motion.p>
        </div>
      </motion.div>
    </motion.div>
  );
}
