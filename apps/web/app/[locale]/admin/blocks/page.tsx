"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/shared/api/api-client";

interface Block {
  id: string;
  status: string;
  seedHint?: string;
  answerPlaintext?: string;
  winnerId?: string;
  winner?: { nickname: string };
  createdAt: string;
  solvedAt?: string;
}

export default function AdminBlocksPage() {
  const [selectedBlock, setSelectedBlock] = useState<Block | null>(null);
  const [forceTransitionData, setForceTransitionData] = useState({
    hint: "",
    password: "",
    reason: "",
  });
  const queryClient = useQueryClient();

  const { data: blocks } = useQuery({
    queryKey: ["admin-blocks-all"],
    queryFn: async () => {
      const response = await apiClient.get("/api/admin/blocks?limit=50");
      return response.data.blocks || [];
    },
    refetchInterval: 30000,
  });

  const forceTransitionMutation = useMutation({
    mutationFn: async (data: {
      blockId: string;
      targetStatus: string;
      hint?: string;
      password?: string;
      reason: string;
    }) => {
      await apiClient.post(
        `/api/admin/blocks/${data.blockId}/force-transition`,
        data
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-blocks-all"] });
      setSelectedBlock(null);
      setForceTransitionData({ hint: "", password: "", reason: "" });
    },
  });

  const regeneratePasswordMutation = useMutation({
    mutationFn: async (blockId: string) => {
      await apiClient.post(`/api/admin/blocks/${blockId}/regenerate-password`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-blocks-all"] });
    },
  });

  const handleForceTransition = (targetStatus: string) => {
    if (!selectedBlock) return;

    const payload: any = {
      blockId: selectedBlock.id,
      targetStatus,
      reason: forceTransitionData.reason,
    };

    if (
      targetStatus === "ACTIVE" &&
      selectedBlock.status === "WAITING_HINT"
    ) {
      payload.hint = forceTransitionData.hint;
    } else if (
      targetStatus === "ACTIVE" &&
      selectedBlock.status === "WAITING_PASSWORD"
    ) {
      payload.password = forceTransitionData.password;
    }

    forceTransitionMutation.mutate(payload);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-green-400">Block Management</h2>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-green-400">Blocks List</h3>
          <div className="space-y-2">
            {blocks?.map((block: Block) => (
              <button
                key={block.id}
                onClick={() => setSelectedBlock(block)}
                className={`w-full rounded-lg border p-4 text-left transition-colors ${
                  selectedBlock?.id === block.id
                    ? "border-green-500 bg-green-500/10"
                    : "border-green-500/20 bg-gray-900/50 hover:border-green-500/40"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-green-400">
                    Block #{block.id}
                  </span>
                  <span
                    className={`text-sm font-mono ${
                      block.status === "ACTIVE"
                        ? "text-green-400"
                        : block.status === "SOLVED"
                          ? "text-blue-400"
                          : "text-yellow-400"
                    }`}
                  >
                    {block.status}
                  </span>
                </div>
                <div className="mt-2 text-sm text-gray-400">
                  {new Date(block.createdAt).toLocaleString()}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-green-400">
            Block Details
          </h3>
          {selectedBlock ? (
            <div className="rounded-lg border border-green-500/20 bg-gray-900/50 p-6 space-y-4">
              <div>
                <span className="text-gray-400">Block ID:</span>
                <span className="ml-2 font-mono text-green-400">
                  #{selectedBlock.id}
                </span>
              </div>
              <div>
                <span className="text-gray-400">Status:</span>
                <span className="ml-2 font-mono text-yellow-400">
                  {selectedBlock.status}
                </span>
              </div>
              {selectedBlock.answerPlaintext && (
                <div>
                  <span className="text-gray-400">Answer:</span>
                  <span className="ml-2 font-mono text-red-400">
                    {selectedBlock.answerPlaintext}
                  </span>
                </div>
              )}
              {selectedBlock.seedHint && (
                <div>
                  <span className="text-gray-400">Hint:</span>
                  <span className="ml-2 text-gray-300">
                    {selectedBlock.seedHint}
                  </span>
                </div>
              )}
              {selectedBlock.winner && (
                <div>
                  <span className="text-gray-400">Winner:</span>
                  <span className="ml-2 text-green-400">
                    {selectedBlock.winner.nickname}
                  </span>
                </div>
              )}

              {(selectedBlock.status === "WAITING_HINT" ||
                selectedBlock.status === "WAITING_PASSWORD") && (
                <div className="space-y-3 border-t border-green-500/20 pt-4">
                  <h4 className="font-semibold text-yellow-400">
                    Force Transition
                  </h4>

                  {selectedBlock.status === "WAITING_HINT" && (
                    <input
                      type="text"
                      placeholder="Enter hint"
                      value={forceTransitionData.hint}
                      onChange={(e) =>
                        setForceTransitionData({
                          ...forceTransitionData,
                          hint: e.target.value,
                        })
                      }
                      className="w-full rounded bg-gray-800 border border-green-500/20 px-3 py-2 text-gray-300 focus:border-green-500 focus:outline-none"
                    />
                  )}

                  {selectedBlock.status === "WAITING_PASSWORD" && (
                    <>
                      <input
                        type="text"
                        placeholder="Enter password"
                        value={forceTransitionData.password}
                        onChange={(e) =>
                          setForceTransitionData({
                            ...forceTransitionData,
                            password: e.target.value,
                          })
                        }
                        className="w-full rounded bg-gray-800 border border-green-500/20 px-3 py-2 text-gray-300 focus:border-green-500 focus:outline-none"
                      />
                      <button
                        onClick={() =>
                          regeneratePasswordMutation.mutate(selectedBlock.id)
                        }
                        disabled={regeneratePasswordMutation.isPending}
                        className="w-full rounded bg-yellow-500/20 px-4 py-2 text-sm text-yellow-400 hover:bg-yellow-500/30 transition-colors disabled:opacity-50"
                      >
                        {regeneratePasswordMutation.isPending
                          ? "Regenerating..."
                          : "Regenerate Password"}
                      </button>
                    </>
                  )}

                  <input
                    type="text"
                    placeholder="Reason for intervention"
                    value={forceTransitionData.reason}
                    onChange={(e) =>
                      setForceTransitionData({
                        ...forceTransitionData,
                        reason: e.target.value,
                      })
                    }
                    className="w-full rounded bg-gray-800 border border-green-500/20 px-3 py-2 text-gray-300 focus:border-green-500 focus:outline-none"
                  />

                  <button
                    onClick={() => handleForceTransition("ACTIVE")}
                    disabled={
                      forceTransitionMutation.isPending ||
                      !forceTransitionData.reason
                    }
                    className="w-full rounded bg-green-500/20 px-4 py-2 text-sm text-green-400 hover:bg-green-500/30 transition-colors disabled:opacity-50"
                  >
                    {forceTransitionMutation.isPending
                      ? "Processing..."
                      : "Transition to ACTIVE"}
                  </button>
                </div>
              )}

              {selectedBlock.status !== "SOLVED" && (
                <button
                  onClick={() => {
                    if (
                      confirm(
                        "Are you sure you want to skip this block? This action cannot be undone."
                      )
                    ) {
                      handleForceTransition("SOLVED");
                    }
                  }}
                  disabled={forceTransitionMutation.isPending}
                  className="w-full rounded bg-red-500/20 px-4 py-2 text-sm text-red-400 hover:bg-red-500/30 transition-colors disabled:opacity-50"
                >
                  Skip Block (Mark as SOLVED)
                </button>
              )}
            </div>
          ) : (
            <div className="rounded-lg border border-green-500/20 bg-gray-900/50 p-6 text-center text-gray-400">
              Select a block to view details
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
