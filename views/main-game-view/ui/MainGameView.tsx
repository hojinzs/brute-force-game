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
  StatsPanel,
} from "@/widgets";

export function MainGameView() {
  const { block } = useBlock();
  const { user } = useAuth();
  const { current: currentCP } = useCPGauge(user?.id);
  const { victory, isVisible: showVictory } = useVictory();
  const { submit, isPending: isCheckingAnswer, error: checkAnswerError } = useSubmitAnswer();

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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 py-12">
        <div className="flex items-center justify-center">
          <BlockHeader
            blockId={block.id}
            seedHint={block.seed_hint}
            status={block.status}
            length={passwordLength}
            charset={config.charset}
            creatorNickname={block.creator_nickname}
            accumulatedPoints={block.accumulated_points}
          />
        </div>

        <div className="space-y-4">
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
                <div className="text-center p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <p className="text-red-400 text-sm">
                    {checkAnswerError.message || "Failed to submit. Please try again."}
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <StatsPanel />
    </>
  );
}
