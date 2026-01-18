"use client";

import { motion, AnimatePresence } from "motion/react";
import { type CharsetType, CHARSET_LABELS } from "@/shared/lib/charset";
import type { BlockStatus } from "../model/types";

type BlockHeaderProps = {
  blockId: number;
  seedHint: string | null;
  status: BlockStatus;
  length?: number;
  charset?: CharsetType[];
  creatorNickname?: string;
  accumulatedPoints?: number;
};

function formatPoints(points: number): string {
  return points.toLocaleString();
}

function getPointsColor(points: number): string {
  if (points >= 1000) return "text-yellow-400";
  if (points >= 500) return "text-slate-300";
  if (points >= 100) return "text-orange-500";
  return "text-emerald-400";
}

export function BlockHeader({
  blockId,
  seedHint,
  status,
  length,
  charset,
  creatorNickname,
  accumulatedPoints = 0,
}: BlockHeaderProps) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-3 mb-2">
        <span className="text-slate-400 text-sm font-mono">BLOCK</span>
        <motion.span
          key={blockId}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-2xl font-bold text-slate-50 font-mono"
        >
          #{blockId}
        </motion.span>
        <span
          className={`px-2 py-0.5 text-xs font-medium rounded-full ${
            status === "active"
              ? "bg-emerald-500/20 text-emerald-400"
              : status === "pending"
                ? "bg-amber-500/20 text-amber-400"
                : "bg-slate-500/20 text-slate-400"
          }`}
        >
          {status.toUpperCase()}
        </span>
      </div>

      {/* Prize Pool */}
      <div className="flex items-center gap-2 mb-3 py-2 px-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
        <span className="text-slate-400 text-sm">Prize Pool:</span>
        <AnimatePresence mode="popLayout">
          <motion.span
            key={accumulatedPoints}
            initial={{ opacity: 0, scale: 1.2, y: -5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 5 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            className={`font-mono font-bold text-lg ${getPointsColor(accumulatedPoints)}`}
          >
            {formatPoints(accumulatedPoints)}
          </motion.span>
        </AnimatePresence>
        <span className="text-slate-500 text-sm">pts</span>
      </div>

      {creatorNickname && (
        <p className="text-slate-400 text-sm">
          <span className="text-slate-500">Created by:</span>{" "}
          <span className="text-blue-400 font-medium">{creatorNickname}</span>
        </p>
      )}
      {seedHint && (
        <p className="text-slate-400 text-sm">
          <span className="text-slate-500">Hint:</span> {seedHint}
        </p>
      )}
      {length !== undefined && (
        <p className="text-slate-400 text-sm mt-1">
          <span className="text-slate-500">Length:</span> {length} characters
        </p>
      )}
      {charset && charset.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {(
            ["lowercase", "uppercase", "alphanumeric", "symbols"] as CharsetType[]
          ).map((type) => {
            const isEnabled = charset.includes(type);
            return (
              <span
                key={type}
                className={`px-2 py-0.5 text-xs font-mono rounded ${
                  isEnabled
                    ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                    : "bg-slate-700/30 text-slate-600 border border-slate-700/50"
                }`}
              >
                {CHARSET_LABELS[type].short}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
