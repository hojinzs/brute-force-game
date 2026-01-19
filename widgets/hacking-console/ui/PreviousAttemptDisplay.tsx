"use client";

import { motion } from "motion/react";

type PreviousAttemptDisplayProps = {
  input: string;
  similarity: number;
};

export function PreviousAttemptDisplay({ input, similarity }: PreviousAttemptDisplayProps) {
  return (
    <motion.p
      className="text-slate-300 text-xs font-mono"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 220, damping: 14 }}
    >
      직전 시도: &quot;{input}&quot; → {similarity}%
    </motion.p>
  );
}
