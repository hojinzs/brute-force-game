"use client";

import Link from "next/link";
import { useBlock, useRecentBlockHistory } from "@/entities/block";
import type { BlockHistoryEntry } from "@/entities/block/model/use-block-history";
import { useAttempts } from "@/entities/attempt";
import { useOnlineUsers } from "@/features/online-presence";
import { LiveFeed, TopAttempts, RankingWidget } from "@/widgets";

function formatShortTime(value: string | null | undefined) {
  if (!value) return "-";
  return new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function BlockHistoryList() {
  const { data: history, isLoading } = useRecentBlockHistory(20);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[200px]">
        <div className="w-5 h-5 border-2 border-slate-600 border-t-slate-400 rounded-full animate-spin" />
      </div>
    );
  }

  if (!history?.length) {
    return (
      <div className="flex items-center justify-center h-full min-h-[200px] text-slate-500 text-sm">
        No blocks recorded
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full max-h-[300px]">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/50 bg-[#1e293b] sticky top-0 z-10">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Recent Blocks</h3>
        <Link
          href="/history"
          className="text-xs text-blue-400 hover:text-blue-300 transition-colors font-medium flex items-center gap-1"
        >
          View All <span className="text-[10px]">→</span>
        </Link>
      </div>
      <div className="flex-1 overflow-y-auto">
        {history.map((block: BlockHistoryEntry) => {
          const isSolved = block.status === "solved";
          const displayTime = block.solved_at ?? block.created_at;

          return (
            <div
              key={block.block_id}
              className="flex items-center justify-between px-4 py-2 border-b border-slate-800/50 hover:bg-slate-700/20 transition-colors group"
            >
              <div className="flex flex-col gap-0.5 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-slate-500 group-hover:text-slate-400 transition-colors">
                    #{block.block_id}
                  </span>
                  <span
                    className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                      isSolved ? "bg-emerald-500/10 text-emerald-400" : "bg-blue-500/10 text-blue-400"
                    }`}
                  >
                    {isSolved ? "SOLVED" : block.status}
                  </span>
                </div>
                <div
                  className="text-xs text-slate-300 truncate max-w-[140px]"
                  title={block.winner_nickname || block.winner_id || undefined}
                >
                  {block.winner_nickname || block.winner_id || "-"}
                </div>
              </div>

              <div className="flex flex-col items-end gap-0.5 text-right">
                <span className="font-mono text-xs text-emerald-400">
                  {(block.accumulated_points ?? 0).toLocaleString()} PTS
                </span>
                <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                  <span>{(block.unique_participants ?? 0).toLocaleString()}P</span>
                  <span>•</span>
                  <span>{formatShortTime(displayTime)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function StatsPanel() {
  const { block } = useBlock();
  const { attempts, newAttemptId } = useAttempts(block?.id);
  const onlineCount = useOnlineUsers(block?.id);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
      <div className="border border-[#334155] rounded-xl bg-[#1e293b] overflow-hidden">
        <LiveFeed
          attempts={attempts}
          newAttemptId={newAttemptId}
          onlineCount={onlineCount}
        />
      </div>

      <div className="border border-[#334155] rounded-xl bg-[#1e293b] overflow-hidden">
        <TopAttempts attempts={attempts} />
      </div>

      <div className="border border-[#334155] rounded-xl bg-[#1e293b] min-h-[200px] flex items-center justify-center md:col-span-2 lg:col-span-1">
        <span className="text-slate-500 text-sm">AD</span>
      </div>

      <div className="border border-[#334155] rounded-xl bg-[#1e293b] min-h-[200px] overflow-hidden">
        <BlockHistoryList />
      </div>

      <div className="border border-[#334155] rounded-xl bg-[#1e293b] min-h-[200px] overflow-hidden">
        <RankingWidget />
      </div>

      <div className="border border-[#334155] rounded-xl bg-[#1e293b] min-h-[200px] flex items-center justify-center md:col-span-2 lg:col-span-1">
        <span className="text-slate-500 text-sm">Communication</span>
      </div>
    </div>
  );
}

