"use client";

import { motion } from "motion/react";

type AttemptCardProps = {
  nickname: string;
  inputValue: string;
  similarity: number;
  timestamp: string;
  isNew?: boolean;
};

function getSimilarityColor(sim: number) {
  if (sim >= 80) return "text-emerald-400";
  if (sim >= 40) return "text-amber-400";
  return "text-red-400";
}

function getSimilarityBgColor(sim: number) {
  if (sim >= 80) return "bg-emerald-500/10";
  if (sim >= 40) return "bg-amber-500/10";
  return "bg-red-500/10";
}

function formatTime(ts: string) {
  const date = new Date(ts);
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

export function AttemptCard({
  nickname,
  inputValue,
  similarity,
  timestamp,
  isNew = false,
}: AttemptCardProps) {
  return (
    <motion.div
      initial={isNew ? { opacity: 0, y: 20 } : false}
      animate={{ opacity: 1, y: 0 }}
      className={`p-3 border-b border-[#334155] last:border-b-0 ${
        isNew ? "pulse-scale" : ""
      }`}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-slate-400 text-xs truncate">{nickname}</span>
            <span className="text-slate-600 text-xs">
              {formatTime(timestamp)}
            </span>
          </div>
          <code className="text-slate-50 font-mono text-sm">{inputValue}</code>
        </div>
        <div
          className={`relative px-3 py-1 rounded-md ${getSimilarityBgColor(similarity)}`}
        >
          <span
            className={`font-mono text-sm font-medium ${getSimilarityColor(similarity)}`}
          >
            {similarity.toFixed(1)}%
          </span>
        </div>
      </div>
    </motion.div>
  );
}
