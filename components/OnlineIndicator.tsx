"use client";

import { motion } from "motion/react";

type OnlineIndicatorProps = {
  count: number;
};

export function OnlineIndicator({ count }: OnlineIndicatorProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-2 px-3 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg"
    >
      <div className="relative">
        <div className="w-2 h-2 rounded-full bg-emerald-500" />
        <div className="absolute inset-0 w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
      </div>
      <span className="text-emerald-400 text-sm font-medium">
        {count} {count === 1 ? "player" : "players"} online
      </span>
    </motion.div>
  );
}
