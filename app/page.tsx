"use client";

import { useCallback, useState } from "react";
import { BlockHeader } from "@/components/BlockHeader";
import { CPGauge } from "@/components/CPGauge";
import { HackingConsole } from "@/components/HackingConsole";
import { LiveFeed } from "@/components/LiveFeed";
import { TopAttempts } from "@/components/TopAttempts";
import { AuthGuard } from "@/components/AuthGuard";
import { VictoryOverlay } from "@/components/VictoryOverlay";
import { GenesisBlockForm } from "@/components/GenesisBlockForm";
import {
  useActiveBlock,
  useAttempts,
  useAuth,
  useCurrentCP,
  useCheckAnswer,
  useBlockSubscription,
} from "@/hooks/useGame";
import { useOnlineUsers } from "@/hooks/useOnlineUsers";
import { supabase } from "@/lib/supabase";

function GameContent() {
  const { user } = useAuth();
  const { data: activeBlock, isLoading: blockLoading, refetch: refetchBlock } = useActiveBlock();
  const { data: currentCP = 0 } = useCurrentCP(user?.id);
  const { attempts, newAttemptId } = useAttempts(activeBlock?.id);
  const onlineCount = useOnlineUsers(activeBlock?.id);
  const checkAnswer = useCheckAnswer();
  const [showVictory, setShowVictory] = useState(false);
  const [victoryInfo, setVictoryInfo] = useState<{ blockId: number; winnerNickname: string } | null>(null);

  useBlockSubscription(
    useCallback(async (block) => {
      if (block.status === "pending" && block.winner_id) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("nickname")
          .eq("id", block.winner_id)
          .single();

        setVictoryInfo({
          blockId: block.id,
          winnerNickname: profile?.nickname || "Anonymous",
        });
        setShowVictory(true);

        setTimeout(() => {
          setShowVictory(false);
          refetchBlock();
        }, 5000);
      } else if (block.status === "active") {
        setShowVictory(false);
        refetchBlock();
      }
    }, [refetchBlock])
  );

  const handleSubmit = useCallback(
    async (value: string) => {
      if (!activeBlock || currentCP <= 0) return;

      try {
        const result = await checkAnswer.mutateAsync({
          inputValue: value,
          blockId: activeBlock.id,
        });

        if (result.correct) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("nickname")
            .eq("id", user?.id!)
            .single();

          setVictoryInfo({
            blockId: activeBlock.id,
            winnerNickname: profile?.nickname || "You",
          });
          setShowVictory(true);
        }
      } catch (error: any) {
        if (error?.message?.includes("RATE_LIMITED")) {
          alert("Rate limit exceeded. Please wait a moment before trying again.");
        } else if (error?.message?.includes("NO_CP")) {
          alert("Insufficient Computing Power. Please wait for CP to refill.");
        } else {
          console.error("Failed to submit answer:", error);
          alert("Failed to submit answer. Please try again.");
        }
      }
    },
    [activeBlock, currentCP, checkAnswer, user]
  );

  if (blockLoading) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
        <div className="text-slate-400 text-center">
          <div className="animate-pulse mb-4">Loading...</div>
        </div>
      </div>
    );
  }

  if (!activeBlock) {
    return <GenesisBlockForm onSuccess={() => refetchBlock()} />;
  }

  const config = activeBlock.difficulty_config;
  const passwordLength = config.length;

  return (
    <div className="min-h-screen bg-[#0f172a] py-8 px-4">
      <VictoryOverlay
        show={showVictory}
        blockId={victoryInfo?.blockId || 0}
        winnerNickname={victoryInfo?.winnerNickname || ""}
      />

      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-50 mb-2">
            BRUTE FORCE AI
          </h1>
          <p className="text-slate-400">
            Crack the AI-generated password before anyone else
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-6">
            <BlockHeader
              blockId={activeBlock.id}
              seedHint={activeBlock.seed_hint}
              status={activeBlock.status}
              length={passwordLength}
              charset={config.charset}
            />

            <CPGauge current={currentCP} max={50} />

            <HackingConsole
              length={passwordLength}
              disabled={
                !user ||
                currentCP <= 0 ||
                activeBlock.status !== "active" ||
                checkAnswer.isPending
              }
              onSubmit={handleSubmit}
            />

            {currentCP <= 0 && user && (
              <div className="text-center p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                <p className="text-red-400 text-sm font-medium mb-1">
                  Out of computing power
                </p>
                <p className="text-red-300/70 text-xs">
                  CP refills at 1 per minute (max 50)
                </p>
              </div>
            )}

            {activeBlock.status === "pending" && (
              <div className="text-center p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                <p className="text-amber-400 text-sm">
                  Block solved! Waiting for next block...
                </p>
              </div>
            )}

            {checkAnswer.isError && (
              <div className="text-center p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                <p className="text-red-400 text-sm">
                  {checkAnswer.error?.message || "Failed to submit. Please try again."}
                </p>
              </div>
            )}
          </div>

          <div>
            <LiveFeed attempts={attempts} newAttemptId={newAttemptId} onlineCount={onlineCount} />
          </div>

          <div>
            <TopAttempts attempts={attempts} />
          </div>
        </div>

        <footer className="mt-12 text-center text-slate-600 text-sm">
          <p>Global players competing to crack the same password</p>
        </footer>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <AuthGuard>
      <GameContent />
    </AuthGuard>
  );
}
