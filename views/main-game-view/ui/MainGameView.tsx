"use client";

import { type AuthUser } from "@/features/auth";
import { BlockHeader, type BlockWithNicknames } from "@/entities/block";
import { type AttemptWithNickname } from "@/entities/attempt";
import { CPGaugeBar } from "@/features/cp-gauge";
import {
  Header,
  HackingConsole,
  LiveFeed,
  TopAttempts,
  VictoryOverlay,
} from "@/widgets";

type MainGameViewProps = {
  user: AuthUser | null;
  block: BlockWithNicknames;
  currentCP: number;
  attempts: AttemptWithNickname[];
  newAttemptId?: string;
  onlineCount: number;
  isCheckingAnswer: boolean;
  checkAnswerError: Error | null;
  showVictory: boolean;
  victoryInfo: { blockId: number; winnerNickname: string } | null;
  onSubmit: (value: string) => void;
};

export function MainGameView({
  user,
  block,
  currentCP,
  attempts,
  newAttemptId,
  onlineCount,
  isCheckingAnswer,
  checkAnswerError,
  showVictory,
  victoryInfo,
  onSubmit,
}: MainGameViewProps) {
  const config = block.difficulty_config;
  const passwordLength = config.length;

  return (
    <div className="min-h-screen bg-[#0f172a] py-4 px-4 md:py-6 md:px-6">
      <VictoryOverlay
        show={showVictory}
        blockId={victoryInfo?.blockId || 0}
        winnerNickname={victoryInfo?.winnerNickname || ""}
      />

      <div className="max-w-7xl mx-auto space-y-4 md:space-y-6">
        <Header />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 py-12">
          <div className="flex items-center justify-center">
            <BlockHeader
              blockId={block.id}
              seedHint={block.seed_hint}
              status={block.status}
              length={passwordLength}
              charset={config.charset}
              creatorNickname={block.creator_nickname}
            />
          </div>

          <div className="space-y-4">
            <CPGaugeBar current={currentCP} max={50} />

            <HackingConsole
              length={passwordLength}
              charset={config.charset}
              disabled={
                !user ||
                currentCP <= 0 ||
                block.status !== "active" ||
                isCheckingAnswer
              }
              onSubmit={onSubmit}
            />

            {currentCP <= 0 && user && (
              <div className="text-center p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <p className="text-red-400 text-sm font-medium mb-1">
                  Out of computing power
                </p>
                <p className="text-red-300/70 text-xs">
                  CP refills at 1 per minute (max 50)
                </p>
              </div>
            )}

            {checkAnswerError && (
              <div className="text-center p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <p className="text-red-400 text-sm">
                  {checkAnswerError.message || "Failed to submit. Please try again."}
                </p>
              </div>
            )}
          </div>
        </div>

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

          <div className="border border-[#334155] rounded-xl bg-[#1e293b] min-h-[200px] flex items-center justify-center">
            <span className="text-slate-500 text-sm">Ranking</span>
          </div>

          <div className="border border-[#334155] rounded-xl bg-[#1e293b] min-h-[200px] flex items-center justify-center md:col-span-2 lg:col-span-1">
            <span className="text-slate-500 text-sm">Communication</span>
          </div>
        </div>
      </div>
    </div>
  );
}
