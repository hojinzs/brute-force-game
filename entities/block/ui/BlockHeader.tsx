"use client";

import { motion, AnimatePresence } from "motion/react";
import type { BlockStatus } from "../model/types";

type BlockHeaderProps = {
  blockId: number;
  seedHint: string | null;
  status: BlockStatus; // Kept in props for compatibility but unused in view
  creatorNickname?: string;
  accumulatedPoints?: number;
};

function formatPoints(points: number): string {
  return points.toLocaleString();
}

export function BlockHeader({
  blockId,
  seedHint,
  status,
  creatorNickname,
  accumulatedPoints = 0,
}: BlockHeaderProps) {
  return (
    <div className="mb-6 flex flex-col items-center text-center">
      {/* Block Title */}
      <div className="flex flex-col items-center mb-6">
        <span className="text-blue-500 text-[10px] font-bold tracking-[0.2em] uppercase mb-1">CURRENT BLOCK</span>
        <motion.span
          key={blockId}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-bold text-slate-50 font-mono tracking-tight"
        >
          #{blockId}
        </motion.span>
      </div>

      {/* Prize Pool */}
      <div className="mb-6 flex flex-col items-center">
         <span className="text-slate-500 text-[10px] font-bold tracking-widest uppercase mb-1">Prize Pool</span>
         <AnimatePresence mode="popLayout">
          <motion.div
            key={accumulatedPoints}
            initial={{ opacity: 0, scale: 1.2, y: -5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 5 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            className={`font-mono font-bold text-5xl text-emerald-400 tracking-tighter mb-1`}
          >
            {formatPoints(accumulatedPoints)}
          </motion.div>
        </AnimatePresence>
        <p className="text-slate-400 text-xs font-medium">
          Crack the password to <span className="text-emerald-400">claim the reward</span>
        </p>
      </div>

      {/* Hint & Master Card */}
      <div className="w-full max-w-sm bg-[#1e293b]/40 backdrop-blur-md border border-slate-700/50 rounded-xl p-4 shadow-sm relative overflow-hidden">
        {/* Hint Section */}
        {seedHint && (
          <div className="mb-6 text-left">
            <span className="text-slate-500 text-[10px] font-bold tracking-widest uppercase block mb-1.5 pl-1">Password Hint</span>
            <p className="text-base font-medium text-slate-200 font-serif italic bg-slate-800/50 rounded-lg">
              "{seedHint}"
            </p>
          </div>
        )}

        {/* Master Section (Right Aligned Inline) */}
        {creatorNickname && (
          <div className="flex justify-end items-center gap-2">
            <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Block Master</span>
            <span className="text-blue-400 text-sm font-bold">
              {creatorNickname}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
