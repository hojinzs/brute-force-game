"use client";

import { useBlock } from "@/entities/block";
import { useAuth } from "@/features/auth";
import { useCPGauge } from "@/features/cp-gauge";
import { useSubmitAnswer } from "@/features/check-answer";
import { useVictory } from "@/shared/context";
import { BlockHeader } from "@/entities/block";
import {
  HackingConsole,
  VictoryOverlay,
  PendingStatusPanel,
  // StatsPanel,
  LiveFeed,
  TopAttempts,
  RankingWidget,
} from "@/widgets";
import { useAttempts } from "@/entities/attempt";
import { useOnlineUsers } from "@/features/online-presence";
import { PromotionBanner } from "./PromotionBanner";
import { BlockHistoryList } from "./BlockHistoryList";

export function MainGameView() {
  const { block } = useBlock();
  const { user } = useAuth();
  const { current: currentCP } = useCPGauge(user?.id);
  const { victory, isVisible: showVictory } = useVictory();
  const { submit, isPending: isCheckingAnswer, error: checkAnswerError } = useSubmitAnswer();

  // Stats Data
  const { attempts, newAttemptId } = useAttempts(block?.id);
  const onlineCount = useOnlineUsers(block?.id);

  if (!block) {
    return null;
  }

  const config = block.difficulty_config;
  const passwordLength = config.length;
  const isPending = block.status === "pending";

  return (
    <>
      <VictoryOverlay
        show={showVictory}
        blockId={victory?.blockId || 0}
        winnerNickname={victory?.winnerNickname || ""}
      />

      <div className="px-2 md:px-6">
        {/* Promotion Banner */}
        <PromotionBanner />

        {/* Main Grid: Block Info & Console */}
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-12 items-center my-8 lg:my-24">
          {/* Left: Block Header */}
          <div className="flex flex-col items-center justify-center">
            <BlockHeader
              blockId={block.id}
              seedHint={block.seed_hint}
              status={block.status}
              creatorNickname={block.creator_nickname}
              accumulatedPoints={block.accumulated_points}
            />
          </div>

          {/* Right: Console */}
          <div className="w-full">
             {isPending ? (
              <PendingStatusPanel />
            ) : (
              <>
                <HackingConsole
                  length={passwordLength}
                  charset={config.charset}
                  disabled={
                    !user ||
                    currentCP <= 0 ||
                    block.status !== "active" ||
                    isCheckingAnswer
                  }
                  onSubmit={submit}
                />

                {checkAnswerError && (
                  <div className="mt-4 text-center p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <p className="text-red-400 text-sm">
                      {checkAnswerError.message || "Failed to submit. Please try again."}
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Bottom Grid: Stats Widgets */}
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           {/* 1. Live Feed */}
           <div className="h-[500px]">
              <LiveFeed 
                attempts={attempts} 
                newAttemptId={newAttemptId} 
                onlineCount={onlineCount} 
              />
           </div>

           {/* 2. Top Attempts */}
           <div className="h-[500px]">
              <TopAttempts attempts={attempts} />
           </div>

           {/* 3. AD Placeholder */}
           <div className="h-[500px] border border-[#334155] rounded-xl bg-[#1e293b] flex items-center justify-center md:col-span-2 lg:col-span-1">
             <span className="text-slate-500 text-sm">AD</span>
           </div>

           {/* 4. Block History */}
           <div className="h-[500px] border border-[#334155] rounded-xl bg-[#1e293b] overflow-hidden">
             <BlockHistoryList />
           </div>

           {/* 5. Ranking */}
           <div className="h-[500px] bg-[#1e293b] border border-[#334155] rounded-xl overflow-hidden">
              <RankingWidget />
           </div>

           {/* 6. Communication Placeholder */}
           <div className="h-[500px] border border-[#334155] rounded-xl bg-[#1e293b] flex items-center justify-center md:col-span-2 lg:col-span-1">
             <span className="text-slate-500 text-sm">Communication</span>
           </div>
        </div>
      </div>
    </>
  );
}
