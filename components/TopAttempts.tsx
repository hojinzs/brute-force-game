"use client";

import { motion } from "motion/react";
import type { AttemptWithNickname } from "@/lib/supabase";

type TopAttemptsProps = {
  attempts: AttemptWithNickname[];
};

export function TopAttempts({ attempts }: TopAttemptsProps) {
  const sortedAttempts = [...attempts]
    .filter(a => a.similarity > 0)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, 20);

  return (
    <div className="bg-[#1e293b] rounded-xl p-6 border border-slate-700/50">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
        <h2 className="text-slate-50 font-semibold">TOP ATTEMPTS</h2>
        <span className="text-slate-500 text-sm ml-auto">
          Closest {sortedAttempts.length} matches
        </span>
      </div>

      <div className="space-y-2 max-h-[400px] overflow-y-auto">
        {sortedAttempts.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-sm">
            No attempts with similarity yet
          </div>
        ) : (
          sortedAttempts.map((attempt, index) => (
            <motion.div
              key={attempt.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.02 }}
              className="bg-[#0f172a] rounded-lg p-3 border border-slate-700/30 hover:border-slate-600/50 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-slate-500 text-xs font-mono">
                      #{index + 1}
                    </span>
                    <span className="text-slate-400 text-sm font-medium truncate">
                      {attempt.nickname}
                    </span>
                  </div>
                  <div className="font-mono text-slate-300 text-sm break-all">
                    {attempt.input_value}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <div
                    className={`text-lg font-bold font-mono ${
                      attempt.similarity >= 70
                        ? "text-amber-400"
                        : attempt.similarity >= 40
                        ? "text-yellow-400"
                        : "text-green-400"
                    }`}
                  >
                    {attempt.similarity}%
                  </div>
                </div>
              </div>

              <div className="mt-2 flex items-center gap-2">
                <div className="flex-1 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${attempt.similarity}%` }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className={`h-full ${
                      attempt.similarity >= 70
                        ? "bg-gradient-to-r from-amber-500 to-amber-400"
                        : attempt.similarity >= 40
                        ? "bg-gradient-to-r from-yellow-500 to-yellow-400"
                        : "bg-gradient-to-r from-green-500 to-green-400"
                    }`}
                  />
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
