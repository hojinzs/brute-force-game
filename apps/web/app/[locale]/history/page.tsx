"use client";

import Link from "next/link";
import { useMemo, useRef, useEffect, useCallback } from "react";
import { useBlockHistory } from "@/entities/block";

function formatNumber(value: number | null | undefined) {
  if (value === null || value === undefined) return "-";
  return value.toLocaleString();
}

function formatDate(value: string | null | undefined) {
  if (!value) return "-";
  const date = new Date(value);
  return date.toLocaleString();
}

function StatusBadge({ status }: { status: string }) {
  const base = "px-3 py-1 rounded-full text-xs font-semibold border";
  switch (status) {
    case "solved":
      return <span className={`${base} border-emerald-400/40 text-emerald-300 bg-emerald-500/10`}>Solved</span>;
    case "active":
      return <span className={`${base} border-blue-400/40 text-blue-300 bg-blue-500/10`}>Active</span>;
    case "pending":
      return <span className={`${base} border-amber-400/40 text-amber-200 bg-amber-500/10`}>Pending</span>;
    case "processing":
      return <span className={`${base} border-emerald-400/40 text-emerald-300 bg-emerald-500/10`}>Solved</span>;
    default:
      return <span className={`${base} border-slate-500/40 text-slate-300 bg-slate-700/40`}>{status}</span>;
  }
}

export default function HistoryPage() {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, error, isError } = useBlockHistory();
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const entries = useMemo(() => data?.pages.flatMap((page) => page) ?? [], [data]);

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Global Ledger</h1>
          <p className="text-sm text-slate-400 mt-1">
            Immutable record of all cracked blocks and verified transactions
          </p>
        </div>
        <Link
          href="/"
          className="px-4 py-2 text-sm text-slate-300 hover:text-slate-100 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
        >
          ← Back to Game
        </Link>
      </div>

      <div className="rounded-xl border border-slate-700 bg-slate-800/50 overflow-hidden">
        <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-slate-800 border-b border-slate-700 text-xs font-medium text-slate-400 uppercase tracking-wider">
          <div className="col-span-1">#</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-2">Seed Hint</div>
          <div className="col-span-1">Winner</div>
          <div className="col-span-1 text-right">Prize</div>
          <div className="col-span-1 text-right">Attempts</div>
          <div className="col-span-1 text-right">Players</div>
          <div className="col-span-3">PASSWORD</div>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" aria-label="Loading history" />
          </div>
        )}

        {isError && (
          <div className="flex flex-col items-center justify-center py-12 text-red-400">
            <p className="text-lg">Failed to load history</p>
            <p className="text-sm mt-1">{error instanceof Error ? error.message : "Unknown error occurred"}</p>
          </div>
        )}

        {!isLoading && entries.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-slate-500">
            <p className="text-lg">No history yet</p>
            <p className="text-sm mt-1">Solve the first block to see history here.</p>
          </div>
        )}

        <div className="divide-y divide-slate-700/50">
          {entries.map((entry) => (
            <div
              key={entry.block_id}
              className="grid grid-cols-12 gap-4 px-4 py-3 items-start hover:bg-slate-700/30 transition-colors"
            >
              <div className="col-span-1 font-mono text-slate-200">#{entry.block_id}</div>
              <div className="col-span-2">
                <StatusBadge status={entry.status} />
                <div className="text-xs text-slate-500 mt-1">{formatDate(entry.created_at)}</div>
              </div>
              <div className="col-span-2 text-slate-200 truncate" title={entry.seed_hint ?? undefined}>
                {entry.seed_hint ?? "-"}
              </div>
              <div className="col-span-1 truncate" title={entry.winner_nickname || entry.winner_id || undefined}>
                {entry.winner_nickname || entry.winner_id || "-"}
              </div>
              <div className="col-span-1 text-right font-mono text-emerald-400">
                {formatNumber(entry.accumulated_points)}
              </div>
              <div className="col-span-1 text-right text-slate-200 font-mono">
                {formatNumber(entry.total_attempts)}
              </div>
              <div className="col-span-1 text-right text-slate-200 font-mono">
                {formatNumber(entry.unique_participants)}
              </div>
              <div className="col-span-3">
                <code
                  className="block max-w-full truncate rounded-md border border-slate-700/60 bg-slate-900/60 px-2 py-1 font-mono text-slate-100"
                  title={entry.solved_answer ?? undefined}
                >
                  {entry.solved_answer ?? "-"}
                </code>
              </div>
            </div>
          ))}
        </div>

        <div ref={loadMoreRef} className="py-4">
          {isFetchingNextPage && (
            <div className="flex items-center justify-center">
              <div
                className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"
                aria-label="Loading more history entries"
              />
              <span className="ml-2 text-sm text-slate-400">Loading more...</span>
            </div>
          )}
          {!hasNextPage && entries.length > 0 && (
            <p className="text-center text-sm text-slate-500">
              You&apos;ve reached the end of the history
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
