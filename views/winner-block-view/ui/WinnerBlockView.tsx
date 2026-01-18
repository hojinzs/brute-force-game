"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { useCountdown } from "@/shared/ui/CountdownTimer";
import { useBlock } from "@/entities/block";
import { useHintSubmit } from "@/features/generate-block";
import { LoadingSpinner } from "@/shared/ui";

export function WinnerBlockView() {
  const { block, isLoading } = useBlock();
  const { submit, isPending: isSubmitting, error } = useHintSubmit();
  const [hint, setHint] = useState("");

  const solvedAt = block?.solved_at ?? new Date().toISOString();
  const { timeLeft, progress } = useCountdown(solvedAt, 180);

  if (isLoading || !block?.solved_at) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0f172a]/90 backdrop-blur-sm">
        <LoadingSpinner message="Loading..." />
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (hint.trim().length === 0 || hint.length > 200) return;
    await submit(hint);
  };

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
        className="text-center max-w-lg w-full px-4"
      >
        <motion.h1
          className="text-5xl font-bold text-emerald-400 mb-8 glitch"
          animate={{
            textShadow: [
              "0 0 10px #10b981",
              "0 0 20px #10b981",
              "0 0 10px #10b981",
            ],
          }}
          transition={{ duration: 0.5, repeat: Infinity }}
        >
          YOU WIN!
        </motion.h1>

        <div className="relative w-40 h-40 mx-auto mb-8">
          <svg className="transform -rotate-90 w-40 h-40">
            <circle
              cx="80"
              cy="80"
              r="70"
              stroke="#334155"
              strokeWidth="8"
              fill="none"
            />
            <circle
              cx="80"
              cy="80"
              r="70"
              stroke="#F59E0B"
              strokeWidth="8"
              fill="none"
              strokeDasharray={`${2 * Math.PI * 70}`}
              strokeDashoffset={`${2 * Math.PI * 70 * (1 - progress / 100)}`}
              className="transition-all duration-100"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-4xl font-mono font-bold text-amber-400">
              {timeLeft}
            </span>
          </div>
        </div>

        <p className="text-slate-300 mb-6">
          Set the hint for the next password
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <input
              type="text"
              value={hint}
              onChange={(e) => setHint(e.target.value)}
              maxLength={200}
              placeholder="Enter your hint..."
              disabled={isSubmitting || timeLeft === 0}
              className="w-full px-4 py-3 bg-[#1e293b] border-2 border-blue-500 rounded-xl text-slate-50 font-mono focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50 disabled:cursor-not-allowed"
              autoFocus
            />
            <div className="absolute right-3 top-3 text-xs text-slate-500">
              {hint.length}/200
            </div>
          </div>

          <button
            type="submit"
            disabled={
              isSubmitting ||
              hint.trim().length === 0 ||
              hint.length > 200 ||
              timeLeft === 0
            }
            className="w-full py-3 px-6 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-colors"
          >
            {isSubmitting ? "Generating..." : "Submit Hint"}
          </button>
        </form>

        {error && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-red-400 text-sm mt-4"
          >
            Failed to generate block. Please try again.
          </motion.p>
        )}

        {timeLeft === 0 && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-amber-400 text-sm mt-4"
          >
            Time&apos;s up! System will generate a random password...
          </motion.p>
        )}
      </motion.div>
    </motion.div>
  );
}
