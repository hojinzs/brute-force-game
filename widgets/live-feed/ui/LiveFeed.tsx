"use client";

import { AnimatePresence } from "motion/react";
import { AttemptCard, type AttemptWithNickname } from "@/entities/attempt";

type LiveFeedProps = {
  attempts: AttemptWithNickname[];
  newAttemptId?: string;
  onlineCount?: number;
};

export function LiveFeed({ attempts, newAttemptId, onlineCount }: LiveFeedProps) {
  return (
    <div className="bg-[#1e293b] border border-[#334155] rounded-xl overflow-hidden h-full">
      <div className="px-4 py-3 border-b border-[#334155] flex items-center justify-between">
        <div>
          <h2 className="text-slate-50 font-medium">Live Feed</h2>
          <p className="text-slate-500 text-xs">Global attempts in real-time</p>
        </div>
        {onlineCount !== undefined && (
          <div className="flex items-center gap-2">
            <div className="relative">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <div className="absolute inset-0 w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            </div>
            <span className="text-emerald-400 text-sm font-medium">
              {onlineCount} Online
            </span>
          </div>
        )}
      </div>
      <div className="max-h-[400px] overflow-y-auto">
        {attempts.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            No attempts yet. Be the first!
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {attempts.map((attempt) => (
              <AttemptCard
                key={attempt.id}
                nickname={attempt.nickname}
                inputValue={attempt.input_value}
                similarity={attempt.similarity}
                timestamp={attempt.created_at}
                isNew={attempt.id === newAttemptId}
              />
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
