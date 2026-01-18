"use client";

import { useBlock } from "@/entities/block";
import { useAttempts } from "@/entities/attempt";
import { useOnlineUsers } from "@/features/online-presence";
import { LiveFeed, TopAttempts, RankingWidget } from "@/widgets";

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

      <div className="border border-[#334155] rounded-xl bg-[#1e293b] min-h-[200px] flex items-center justify-center">
        <span className="text-slate-500 text-sm">Block History</span>
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
