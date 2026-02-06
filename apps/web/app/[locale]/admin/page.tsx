"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/shared/api/api-client";

interface BlockStatus {
  id: string;
  status: string;
  createdAt: string;
  waitingStartedAt?: string;
}

interface UserStats {
  totalUsers: number;
  totalAnonymous: number;
  totalRegistered: number;
  totalMasters: number;
  activeUsersLast24h: number;
}

export default function AdminDashboard() {
  const { data: blocks } = useQuery({
    queryKey: ["admin-blocks"],
    queryFn: async () => {
      const response = await apiClient.get("/api/admin/blocks?limit=1");
      return response.data.blocks || [];
    },
    refetchInterval: 30000,
  });

  const { data: stats } = useQuery<UserStats>({
    queryKey: ["admin-user-stats"],
    queryFn: async () => {
      const response = await apiClient.get("/api/admin/users/stats");
      return response.data;
    },
    refetchInterval: 60000,
  });

  const currentBlock = blocks?.[0] as BlockStatus | undefined;
  const isStuck =
    currentBlock?.waitingStartedAt &&
    (currentBlock.status === "WAITING_HINT" ||
      currentBlock.status === "WAITING_PASSWORD")
      ? Date.now() - new Date(currentBlock.waitingStartedAt).getTime() >
        5 * 60 * 1000
      : false;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-green-400">Dashboard</h2>

      {isStuck && (
        <div className="rounded-lg border border-red-500/50 bg-red-500/10 p-4">
          <div className="flex items-center gap-2">
            <span className="text-red-400">⚠️</span>
            <h3 className="font-semibold text-red-400">Stuck Block Detected</h3>
          </div>
          <p className="mt-2 text-sm text-gray-300">
            Block #{currentBlock?.id} has been in {currentBlock?.status} state
            for more than 5 minutes. Consider manual intervention.
          </p>
          <a
            href="/admin/blocks"
            className="mt-3 inline-block rounded bg-red-500/20 px-4 py-2 text-sm text-red-400 hover:bg-red-500/30 transition-colors"
          >
            Manage Block
          </a>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-lg border border-green-500/20 bg-gray-900/50 p-6">
          <h3 className="mb-4 text-lg font-semibold text-green-400">
            Current Block
          </h3>
          {currentBlock ? (
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-400">Block ID:</span>
                <span className="font-mono text-green-400">
                  #{currentBlock.id}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Status:</span>
                <span
                  className={`font-mono ${
                    currentBlock.status === "ACTIVE"
                      ? "text-green-400"
                      : currentBlock.status === "SOLVED"
                        ? "text-blue-400"
                        : "text-yellow-400"
                  }`}
                >
                  {currentBlock.status}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Created:</span>
                <span className="text-gray-300">
                  {new Date(currentBlock.createdAt).toLocaleString()}
                </span>
              </div>
            </div>
          ) : (
            <p className="text-gray-400">No active block</p>
          )}
        </div>

        <div className="rounded-lg border border-green-500/20 bg-gray-900/50 p-6">
          <h3 className="mb-4 text-lg font-semibold text-green-400">
            User Statistics
          </h3>
          {stats ? (
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-400">Total Users:</span>
                <span className="font-mono text-green-400">
                  {stats.totalUsers}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Active (24h):</span>
                <span className="font-mono text-green-400">
                  {stats.activeUsersLast24h}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Anonymous:</span>
                <span className="font-mono text-gray-300">
                  {stats.totalAnonymous}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Registered:</span>
                <span className="font-mono text-gray-300">
                  {stats.totalRegistered}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Masters:</span>
                <span className="font-mono text-yellow-400">
                  {stats.totalMasters}
                </span>
              </div>
            </div>
          ) : (
            <p className="text-gray-400">Loading stats...</p>
          )}
        </div>
      </div>
    </div>
  );
}
