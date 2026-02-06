'use client';

import { useQuery } from '@tanstack/react-query';
import { AdminShell } from '@/components/admin-shell';
import { getAdminBlocks, getAdminUserStats } from '@/lib/api';

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    ACTIVE: 'bg-success/10 text-success border-success/20',
    SOLVED: 'bg-info/10 text-info border-info/20',
    WAITING_HINT: 'bg-warning/10 text-warning border-warning/20',
    WAITING_PASSWORD: 'bg-danger/10 text-danger border-danger/20',
  };

  return (
    <span className={`inline-flex rounded-md border px-2 py-0.5 text-xs font-bold uppercase tracking-wider ${colors[status] || 'bg-muted/10 text-muted'}`}>
      {status.replace(/_/g, ' ')}
    </span>
  );
}

function StuckAlert({ block }: { block: any }) {
  if (!block.waitingStartedAt) return null;

  const elapsed = Date.now() - new Date(block.waitingStartedAt).getTime();
  const minutes = Math.floor(elapsed / 60000);

  if (minutes < 5 || (block.status !== 'WAITING_HINT' && block.status !== 'WAITING_PASSWORD')) {
    return null;
  }

  return (
    <div className="rounded-lg border border-warning/30 bg-warning/5 p-4">
      <div className="flex items-center gap-2 text-warning text-sm font-bold">
        ⚠ Block #{block.id} stuck in {block.status} for {minutes}m
      </div>
      <p className="mt-1 text-xs text-muted">
        Consider force-transitioning this block from the Blocks page.
      </p>
    </div>
  );
}

export default function DashboardPage() {
  const { data: blocksData } = useQuery({
    queryKey: ['admin-blocks', 1],
    queryFn: () => getAdminBlocks(1, 5),
    refetchInterval: 10000,
  });

  const { data: stats } = useQuery({
    queryKey: ['admin-user-stats'],
    queryFn: getAdminUserStats,
    refetchInterval: 30000,
  });

  const currentBlock = blocksData?.blocks?.[0];

  return (
    <AdminShell>
      <div className="space-y-6">
        <h1 className="text-xl font-bold font-mono">Dashboard</h1>

        {/* Stuck block alert */}
        {currentBlock && <StuckAlert block={currentBlock} />}

        {/* Stats cards */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {/* Current Block */}
          <div className="rounded-lg border border-border bg-surface p-4">
            <div className="text-xs text-muted uppercase tracking-wider mb-2">Current Block</div>
            {currentBlock ? (
              <>
                <div className="text-2xl font-bold font-mono">#{currentBlock.id}</div>
                <StatusBadge status={currentBlock.status} />
              </>
            ) : (
              <div className="text-muted text-sm">No blocks</div>
            )}
          </div>

          {/* Total Users */}
          <div className="rounded-lg border border-border bg-surface p-4">
            <div className="text-xs text-muted uppercase tracking-wider mb-2">Total Users</div>
            <div className="text-2xl font-bold font-mono">{stats?.totalUsers ?? '-'}</div>
            <div className="text-xs text-muted mt-1">
              {stats ? `${stats.totalRegistered} registered` : ''}
            </div>
          </div>

          {/* Active Users (24h) */}
          <div className="rounded-lg border border-border bg-surface p-4">
            <div className="text-xs text-muted uppercase tracking-wider mb-2">Active (24h)</div>
            <div className="text-2xl font-bold font-mono">{stats?.activeUsersLast24h ?? '-'}</div>
            <div className="text-xs text-muted mt-1">
              {stats ? `${stats.newUsersToday} new today` : ''}
            </div>
          </div>

          {/* Masters */}
          <div className="rounded-lg border border-border bg-surface p-4">
            <div className="text-xs text-muted uppercase tracking-wider mb-2">Masters</div>
            <div className="text-2xl font-bold font-mono text-accent">{stats?.totalMasters ?? '-'}</div>
          </div>
        </div>

        {/* Recent blocks */}
        <div className="rounded-lg border border-border bg-surface">
          <div className="border-b border-border px-4 py-3">
            <h2 className="text-sm font-bold">Recent Blocks</h2>
          </div>
          <div className="divide-y divide-border">
            {blocksData?.blocks?.map((block) => (
              <div key={block.id} className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm font-bold">#{block.id}</span>
                  <StatusBadge status={block.status} />
                </div>
                <div className="flex items-center gap-4 text-xs text-muted">
                  {block.winner && <span>Winner: {block.winner.nickname}</span>}
                  <span>{block.attemptCount} attempts</span>
                  <span className="font-mono">{block.accumulatedPoints} pts</span>
                </div>
              </div>
            ))}
            {!blocksData?.blocks?.length && (
              <div className="px-4 py-8 text-center text-sm text-muted">No blocks yet</div>
            )}
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
