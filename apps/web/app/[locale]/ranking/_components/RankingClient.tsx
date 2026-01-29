"use client";

import { useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRankingInfinite, useMyRank } from "@/entities/ranking";
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

function getRankStyle(rank: number): string {
  switch (rank) {
    case 1:
      return "bg-gradient-to-r from-amber-500/20 to-yellow-500/10 border-amber-500/30";
    case 2:
      return "bg-gradient-to-r from-slate-400/20 to-slate-300/10 border-slate-400/30";
    case 3:
      return "bg-gradient-to-r from-amber-700/20 to-orange-600/10 border-amber-700/30";
    default:
      return "bg-slate-800/50 border-slate-700/50";
  }
}

export function RankingClient() {
  const { user } = useAuth();
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useRankingInfinite();
  const { data: myRank } = useMyRank(user?.id);

  const loadMoreRef = useRef<HTMLDivElement>(null);

  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [target] = entries;
      if (target.isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
    [fetchNextPage, hasNextPage, isFetchingNextPage]
  );

  useEffect(() => {
    const element = loadMoreRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(handleObserver, {
      threshold: 0.1,
      rootMargin: "100px",
    });

    observer.observe(element);

    return () => observer.disconnect();
  }, [handleObserver]);

  const allRankings = data?.pages.flatMap((page) => page) ?? [];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Global Leaderboard</h1>
          <p className="text-sm text-slate-400 mt-1">
            Top hackers ranked by total points earned
          </p>
        </div>
        <Link
          href="/"
          className="px-4 py-2 text-sm text-slate-300 hover:text-slate-100 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
        >
          ← Back to Game
        </Link>
      </div>

      {/* My Rank Card (sticky) */}
      {myRank && (
        <div className="sticky top-4 z-10 p-4 rounded-xl border border-blue-500/30 bg-blue-500/10 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="text-center">
                <p className="text-xs text-slate-400">Your Rank</p>
                <p className="text-2xl font-bold text-blue-400 font-mono">
                  #{myRank.rank}
                </p>
              </div>
              <div className="h-10 w-px bg-slate-700" />
              <div>
                <p className="font-medium text-slate-200">{myRank.nickname}</p>
                <p className="text-sm text-slate-400">You</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-400">Total Points</p>
              <p className="text-xl font-bold text-emerald-400 font-mono">
                {formatPoints(myRank.total_points)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Rankings List */}
      <div className="rounded-xl border border-slate-700 bg-slate-800/50 overflow-hidden">
        {/* Table Header */}
        <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-slate-800 border-b border-slate-700 text-xs font-medium text-slate-400 uppercase tracking-wider">
          <div className="col-span-2">Rank</div>
          <div className="col-span-7">Player</div>
          <div className="col-span-3 text-right">Points</div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Empty State */}
        {!isLoading && allRankings.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-slate-500">
            <p className="text-lg">No rankings yet</p>
            <p className="text-sm mt-1">Be the first to solve a block!</p>
          </div>
        )}

        {/* Rankings */}
        <div className="divide-y divide-slate-700/50">
          {allRankings.map((entry) => {
            const isCurrentUser = entry.id === user?.id;
            const rank = entry.rank ?? 0;
            const icon = getRankIcon(rank);

            return (
              <div
                key={entry.id}
                className={`grid grid-cols-12 gap-4 px-4 py-3 items-center transition-colors ${
                  isCurrentUser
                    ? "bg-blue-500/10"
                    : rank <= 3
                      ? getRankStyle(rank)
                      : "hover:bg-slate-700/30"
                } ${rank <= 3 ? "border-l-2" : ""}`}
              >
                <div className="col-span-2">
                  <span className="font-mono text-lg font-bold text-slate-200">
                    {icon || `#${rank}`}
                    {icon && (
                      <span className="ml-1 text-sm text-slate-400">
                        #{rank}
                      </span>
                    )}
                  </span>
                </div>
                <div className="col-span-7">
                  <span
                    className={`font-medium ${
                      isCurrentUser
                        ? "text-blue-400"
                        : rank <= 3
                          ? "text-slate-100"
                          : "text-slate-300"
                    }`}
                  >
                    {entry.nickname}
                    {isCurrentUser && (
                      <span className="ml-2 text-xs text-blue-400">(You)</span>
                    )}
                  </span>
                </div>
                <div className="col-span-3 text-right">
                  <span
                    className={`font-mono font-semibold ${
                      rank === 1
                        ? "text-amber-400"
                        : rank === 2
                          ? "text-slate-300"
                          : rank === 3
                            ? "text-amber-600"
                            : "text-emerald-400"
                    }`}
                  >
                    {formatPoints(entry.total_points)}
                  </span>
                  <span className="text-slate-500 text-sm ml-1">pts</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Load More Trigger */}
        <div ref={loadMoreRef} className="py-4">
          {isFetchingNextPage && (
            <div className="flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <span className="ml-2 text-sm text-slate-400">Loading more...</span>
            </div>
          )}
          {!hasNextPage && allRankings.length > 0 && (
            <p className="text-center text-sm text-slate-500">
              You&apos;ve reached the end of the leaderboard
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
