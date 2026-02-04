import Link from "next/link";
import { getBlockHistoryPage } from "@/entities/block/api";
import { normalizeBlockHistoryResponse } from "@/entities/block/model/normalize-history";
import type { BlockHistoryEntry } from "@/entities/block/model/use-block-history";

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

export const dynamic = "force-dynamic";

type HistoryPageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

function parsePositiveInt(value: unknown, fallback: number) {
  if (typeof value !== "string") return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

async function fetchHistoryPage(page: number, limit: number) {
  const data = await getBlockHistoryPage({ page, limit });

  return {
    page: data.page,
    limit: data.limit,
    total: data.total,
    entries: normalizeBlockHistoryResponse(data.blocks),
  };
}

export default async function HistoryPage({ searchParams }: HistoryPageProps) {
  const pageParam = searchParams?.page;
  const limitParam = searchParams?.limit;

  const page = parsePositiveInt(Array.isArray(pageParam) ? pageParam[0] : pageParam, 1);
  const limit = parsePositiveInt(
    Array.isArray(limitParam) ? limitParam[0] : limitParam,
    50
  );

  let entries: BlockHistoryEntry[] = [];
  let total = 0;
  let resolvedPage = page;
  let resolvedLimit = limit;
  let errorMessage: string | null = null;

  try {
    const result = await fetchHistoryPage(page, limit);
    entries = result.entries;
    total = result.total;
    resolvedPage = result.page;
    resolvedLimit = result.limit;

    const totalPages = Math.max(1, Math.ceil(total / resolvedLimit));
    if (resolvedPage > totalPages && total > 0) {
      const fallback = await fetchHistoryPage(totalPages, resolvedLimit);
      entries = fallback.entries;
      total = fallback.total;
      resolvedPage = fallback.page;
      resolvedLimit = fallback.limit;
    }
  } catch (error) {
    errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
  }

  const totalPages = Math.max(1, Math.ceil(total / resolvedLimit));
  const safePage = Math.min(Math.max(1, resolvedPage), totalPages);
  const hasPrev = safePage > 1;
  const hasNext = safePage < totalPages;

  const buildHref = (nextPage: number) => {
    const params = new URLSearchParams();
    params.set("page", String(nextPage));
    params.set("limit", String(resolvedLimit));
    return `?${params.toString()}`;
  };

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

        {errorMessage && (
          <div className="flex flex-col items-center justify-center py-12 text-red-400">
            <p className="text-lg">Failed to load history</p>
            <p className="text-sm mt-1">{errorMessage}</p>
          </div>
        )}

        {!errorMessage && entries.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-slate-500">
            <p className="text-lg">No history yet</p>
            <p className="text-sm mt-1">Solve the first block to see history here.</p>
          </div>
        )}

        {!errorMessage && entries.length > 0 && (
          <>
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

            <div className="flex items-center justify-between px-4 py-3 bg-slate-800 border-t border-slate-700 text-sm text-slate-300">
              <div className="text-slate-400">
                Page <span className="font-mono text-slate-200">{safePage}</span> /{" "}
                <span className="font-mono text-slate-200">{totalPages}</span>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href={hasPrev ? buildHref(safePage - 1) : buildHref(1)}
                  aria-disabled={!hasPrev}
                  className={`px-3 py-1 rounded-lg border transition-colors ${
                    hasPrev
                      ? "border-slate-600 hover:bg-slate-700/50 text-slate-200"
                      : "border-slate-800 text-slate-600 pointer-events-none"
                  }`}
                >
                  ← Prev
                </Link>
                <Link
                  href={hasNext ? buildHref(safePage + 1) : buildHref(totalPages)}
                  aria-disabled={!hasNext}
                  className={`px-3 py-1 rounded-lg border transition-colors ${
                    hasNext
                      ? "border-slate-600 hover:bg-slate-700/50 text-slate-200"
                      : "border-slate-800 text-slate-600 pointer-events-none"
                  }`}
                >
                  Next →
                </Link>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
