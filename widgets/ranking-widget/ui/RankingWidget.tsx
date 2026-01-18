"use client";

import Link from "next/link";
import { useTopRanking, useMyRank } from "@/entities/ranking";
import { useAuth } from "@/features/auth";

function getRankIcon(rank: number): string {
  switch (rank) {
    case 1:
      return "🥇";
    case 2:
      return "🥈";
    case 3:
      return "🥉";
    default:
      return "";
  }
}

function formatPoints(points: number): string {
  return points.toLocaleString();
}

export function RankingWidget() {
  const { user } = useAuth();
  const { data: topRanking, isLoading } = useTopRanking(50);
  const { data: myRank } = useMyRank(user?.id);

  const isUserInTop50 = myRank && myRank.rank <= 50;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
        <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
          <span>🏆</span>
          TOP PLAYERS
        </h3>
        <Link
          href="/ranking"
          className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
        >
          View All →
        </Link>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : !topRanking || topRanking.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-slate-500 text-sm">
            No rankings yet
          </div>
        ) : (
          <ul className="divide-y divide-slate-700/50">
            {topRanking.slice(0, 10).map((entry) => (
              <li
                key={entry.id}
                className={`px-4 py-2 flex items-center justify-between hover:bg-slate-700/30 transition-colors ${
                  entry.id === user?.id ? "bg-blue-500/10" : ""
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-6 text-right font-mono text-sm text-slate-400">
                    {getRankIcon(entry.rank ?? 0) || `${entry.rank}.`}
                  </span>
                  <span
                    className={`truncate text-sm ${
                      entry.rank && entry.rank <= 3
                        ? "font-semibold text-slate-100"
                        : "text-slate-300"
                    }`}
                  >
                    {entry.nickname}
                  </span>
                </div>
                <span className="font-mono text-sm text-emerald-400 ml-2">
                  {formatPoints(entry.total_points)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* My Rank (if not in top 50) */}
      {myRank && !isUserInTop50 && (
        <div className="border-t border-slate-700 px-4 py-3 bg-slate-800/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Your Rank:</span>
              <span className="font-mono text-sm font-semibold text-blue-400">
                #{myRank.rank}
              </span>
            </div>
            <span className="font-mono text-sm text-emerald-400">
              {formatPoints(myRank.total_points)} pts
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
