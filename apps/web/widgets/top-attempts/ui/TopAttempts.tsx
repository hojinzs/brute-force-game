"use client";

import { motion } from "motion/react";
import type { AttemptWithNickname } from "@/entities/attempt";

type TopAttemptsProps = {
  attempts: AttemptWithNickname[];
};

export function TopAttempts({ attempts }: TopAttemptsProps) {
  const sortedAttempts = [...attempts]
    .filter((a) => a.similarity > 0 && a.is_first_submission)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, 20);

  return (
    <div className="bg-[#1e293b]/40 backdrop-blur-md border border-[#334155]/50 rounded-xl overflow-hidden h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#334155]">
        <h2 className="text-slate-50 font-medium flex items-center gap-2">
          <span>🎯</span>
          TOP ATTEMPTS
        </h2>
        <span className="text-slate-500 text-xs">
          Top {sortedAttempts.length}
        </span>
      </div>

      <div className="max-h-[400px] overflow-y-auto">
        {sortedAttempts.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">
            No attempts with similarity yet
          </div>
        ) : (
          sortedAttempts.map((attempt, index) => (
            <motion.div
              key={attempt.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.02 }}
              className="px-4 py-3 border-b border-slate-800/50 hover:bg-slate-700/20 transition-colors"
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-slate-500 text-xs font-mono w-5">
                      #{index + 1}
                    </span>
                    <span className="text-slate-300 text-sm font-medium truncate">
                      {attempt.nickname}
                    </span>
                  </div>
                  <div className="font-mono text-slate-400 text-xs break-all ml-7">
                    {attempt.input_value}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1 shrink-0">
                  <div
                    className={`text-base font-bold font-mono ${
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

               {/* Similarity Gauge */}
              <div className="ml-7 flex items-center gap-2">
                <div className="flex-1 bg-slate-800 rounded-full h-1 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${attempt.similarity}%` }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className={`h-full ${
                      attempt.similarity >= 70
                        ? "bg-linear-to-r from-amber-500 to-amber-400"
                        : attempt.similarity >= 40
                          ? "bg-linear-to-r from-yellow-500 to-yellow-400"
                          : "bg-linear-to-r from-green-500 to-green-400"
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
