'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminShell } from '@/components/admin-shell';
import { getAdminBlocks, getAdminBlock, forceTransition, regeneratePassword } from '@/lib/api';
import type { Block, BlockDetail } from '@/lib/types';

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

function BlockDetailPanel({ blockId, onClose }: { blockId: number; onClose: () => void }) {
  const queryClient = useQueryClient();
  const { data: block, isLoading } = useQuery({
    queryKey: ['admin-block', blockId],
    queryFn: () => getAdminBlock(blockId),
  });

  const [showForceTransition, setShowForceTransition] = useState(false);
  const [targetStatus, setTargetStatus] = useState('');
  const [hint, setHint] = useState('');
  const [password, setPassword] = useState('');
  const [reason, setReason] = useState('');
  const [confirmSkip, setConfirmSkip] = useState(false);

  const forceMutation = useMutation({
    mutationFn: (body: { targetStatus: string; hint?: string; password?: string; reason?: string }) =>
      forceTransition(blockId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-block', blockId] });
      queryClient.invalidateQueries({ queryKey: ['admin-blocks'] });
      setShowForceTransition(false);
      setConfirmSkip(false);
    },
  });

  const regenMutation = useMutation({
    mutationFn: () => regeneratePassword(blockId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-block', blockId] });
    },
  });

  if (isLoading || !block) {
    return (
      <div className="rounded-lg border border-border bg-surface p-4">
        <div className="animate-pulse text-muted text-sm">Loading block details...</div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-accent/30 bg-surface">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="font-mono text-sm font-bold">Block #{block.id}</span>
          <StatusBadge status={block.status} />
        </div>
        <button onClick={onClose} className="text-muted hover:text-foreground text-sm">
          ✕
        </button>
      </div>

      <div className="p-4 space-y-4">
        {/* Block info grid */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-xs text-muted block">Hint</span>
            <span className="font-mono">{block.seedHint || '-'}</span>
          </div>
          <div>
            <span className="text-xs text-muted block">Answer (plaintext)</span>
            <span className="font-mono text-accent font-bold">{block.answerPlaintext || '-'}</span>
          </div>
          <div>
            <span className="text-xs text-muted block">Difficulty</span>
            <span className="font-mono">
              {block.difficultyConfig?.length}chars [{block.difficultyConfig?.charset?.join(', ')}]
            </span>
          </div>
          <div>
            <span className="text-xs text-muted block">Points</span>
            <span className="font-mono">{block.accumulatedPoints}</span>
          </div>
          <div>
            <span className="text-xs text-muted block">Winner</span>
            <span>{block.winner?.nickname || '-'}</span>
          </div>
          <div>
            <span className="text-xs text-muted block">Block Master</span>
            <span>{block.blockMaster?.nickname || '-'}</span>
          </div>
          <div>
            <span className="text-xs text-muted block">Attempts</span>
            <span className="font-mono">{block.attemptCount}</span>
          </div>
          <div>
            <span className="text-xs text-muted block">Password Retries</span>
            <span className="font-mono">{block.passwordRetryCount}</span>
          </div>
          <div>
            <span className="text-xs text-muted block">Created</span>
            <span className="text-xs">{new Date(block.createdAt).toLocaleString()}</span>
          </div>
          <div>
            <span className="text-xs text-muted block">Solved</span>
            <span className="text-xs">{block.solvedAt ? new Date(block.solvedAt).toLocaleString() : '-'}</span>
          </div>
        </div>

        {/* Actions */}
        {block.status !== 'SOLVED' && (
          <div className="flex flex-wrap gap-2 border-t border-border pt-4">
            {(block.status === 'WAITING_HINT' || block.status === 'WAITING_PASSWORD') && (
              <button
                onClick={() => setShowForceTransition(true)}
                className="rounded-lg bg-warning/10 border border-warning/20 px-3 py-1.5 text-xs font-bold text-warning hover:bg-warning/20 transition"
              >
                Force Transition
              </button>
            )}

            {block.status === 'WAITING_PASSWORD' && (
              <button
                onClick={() => regenMutation.mutate()}
                disabled={regenMutation.isPending}
                className="rounded-lg bg-info/10 border border-info/20 px-3 py-1.5 text-xs font-bold text-info hover:bg-info/20 transition disabled:opacity-50"
              >
                {regenMutation.isPending ? 'Regenerating...' : 'Regenerate Password'}
              </button>
            )}

            <button
              onClick={() => setConfirmSkip(true)}
              className="rounded-lg bg-danger/10 border border-danger/20 px-3 py-1.5 text-xs font-bold text-danger hover:bg-danger/20 transition"
            >
              Skip Block
            </button>
          </div>
        )}

        {/* Force Transition Form */}
        {showForceTransition && (
          <div className="border border-border rounded-lg p-4 space-y-3">
            <h3 className="text-sm font-bold">Force Transition</h3>

            {block.status === 'WAITING_HINT' && (
              <div>
                <label className="block text-xs text-muted mb-1">Hint *</label>
                <input
                  value={hint}
                  onChange={(e) => setHint(e.target.value)}
                  className="w-full rounded border border-border bg-background px-3 py-1.5 text-sm font-mono focus:border-accent focus:outline-none"
                  placeholder="Enter hint..."
                />
              </div>
            )}

            {(block.status === 'WAITING_HINT' || block.status === 'WAITING_PASSWORD') && (
              <div>
                <label className="block text-xs text-muted mb-1">
                  Password {block.status === 'WAITING_PASSWORD' ? '*' : '(optional)'}
                </label>
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded border border-border bg-background px-3 py-1.5 text-sm font-mono focus:border-accent focus:outline-none"
                  placeholder="Enter password..."
                />
              </div>
            )}

            <div>
              <label className="block text-xs text-muted mb-1">Reason</label>
              <input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full rounded border border-border bg-background px-3 py-1.5 text-sm font-mono focus:border-accent focus:outline-none"
                placeholder="Reason for intervention..."
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() =>
                  forceMutation.mutate({
                    targetStatus: 'ACTIVE',
                    hint: hint || undefined,
                    password: password || undefined,
                    reason: reason || undefined,
                  })
                }
                disabled={forceMutation.isPending}
                className="rounded bg-accent px-3 py-1.5 text-xs font-bold text-black hover:bg-accent/90 disabled:opacity-50"
              >
                {forceMutation.isPending ? 'Processing...' : 'Force to ACTIVE'}
              </button>
              <button
                onClick={() => setShowForceTransition(false)}
                className="rounded bg-surface-hover px-3 py-1.5 text-xs text-muted hover:text-foreground"
              >
                Cancel
              </button>
            </div>

            {forceMutation.isError && (
              <div className="text-xs text-danger">{(forceMutation.error as any)?.response?.data?.message || 'Failed'}</div>
            )}
          </div>
        )}

        {/* Skip Confirm Dialog */}
        {confirmSkip && (
          <div className="border border-danger/30 rounded-lg p-4 space-y-3 bg-danger/5">
            <h3 className="text-sm font-bold text-danger">Skip Block #{block.id}?</h3>
            <p className="text-xs text-muted">This will mark the block as SOLVED without a winner and create a new block.</p>
            <div>
              <label className="block text-xs text-muted mb-1">Reason *</label>
              <input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full rounded border border-border bg-background px-3 py-1.5 text-sm font-mono focus:border-accent focus:outline-none"
                placeholder="Reason for skipping..."
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() =>
                  forceMutation.mutate({
                    targetStatus: 'SOLVED',
                    reason: reason || 'manual skip',
                  })
                }
                disabled={forceMutation.isPending}
                className="rounded bg-danger px-3 py-1.5 text-xs font-bold text-white hover:bg-danger/90 disabled:opacity-50"
              >
                {forceMutation.isPending ? 'Skipping...' : 'Confirm Skip'}
              </button>
              <button
                onClick={() => setConfirmSkip(false)}
                className="rounded bg-surface-hover px-3 py-1.5 text-xs text-muted hover:text-foreground"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function BlocksPage() {
  const [page, setPage] = useState(1);
  const [selectedBlockId, setSelectedBlockId] = useState<number | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-blocks', page],
    queryFn: () => getAdminBlocks(page, 20),
    refetchInterval: 10000,
  });

  const totalPages = data ? Math.ceil(data.total / data.limit) : 0;

  return (
    <AdminShell>
      <div className="space-y-4">
        <h1 className="text-xl font-bold font-mono">Block Management</h1>

        {/* Selected block detail */}
        {selectedBlockId !== null && (
          <BlockDetailPanel
            blockId={selectedBlockId}
            onClose={() => setSelectedBlockId(null)}
          />
        )}

        {/* Blocks table */}
        <div className="rounded-lg border border-border bg-surface overflow-hidden">
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface-hover text-xs text-muted uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3 text-left">ID</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Answer</th>
                  <th className="px-4 py-3 text-left">Winner</th>
                  <th className="px-4 py-3 text-right">Attempts</th>
                  <th className="px-4 py-3 text-right">Points</th>
                  <th className="px-4 py-3 text-left">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data?.blocks?.map((block) => (
                  <tr
                    key={block.id}
                    onClick={() => setSelectedBlockId(block.id)}
                    className={`cursor-pointer transition hover:bg-surface-hover ${
                      selectedBlockId === block.id ? 'bg-accent/5' : ''
                    }`}
                  >
                    <td className="px-4 py-3 font-mono font-bold">#{block.id}</td>
                    <td className="px-4 py-3"><StatusBadge status={block.status} /></td>
                    <td className="px-4 py-3 font-mono text-accent text-xs">{block.answerPlaintext || '-'}</td>
                    <td className="px-4 py-3">{block.winner?.nickname || '-'}</td>
                    <td className="px-4 py-3 text-right font-mono">{block.attemptCount}</td>
                    <td className="px-4 py-3 text-right font-mono">{block.accumulatedPoints}</td>
                    <td className="px-4 py-3 text-xs text-muted">{new Date(block.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile card view */}
          <div className="md:hidden divide-y divide-border">
            {data?.blocks?.map((block) => (
              <div
                key={block.id}
                onClick={() => setSelectedBlockId(block.id)}
                className={`p-4 cursor-pointer transition hover:bg-surface-hover ${
                  selectedBlockId === block.id ? 'bg-accent/5' : ''
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono font-bold">#{block.id}</span>
                  <StatusBadge status={block.status} />
                </div>
                <div className="flex justify-between text-xs text-muted">
                  <span>{block.answerPlaintext ? `Answer: ${block.answerPlaintext}` : ''}</span>
                  <span>{block.attemptCount} attempts</span>
                </div>
              </div>
            ))}
          </div>

          {isLoading && (
            <div className="px-4 py-8 text-center text-sm text-muted animate-pulse">Loading blocks...</div>
          )}

          {!isLoading && !data?.blocks?.length && (
            <div className="px-4 py-8 text-center text-sm text-muted">No blocks found</div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="rounded border border-border px-3 py-1 text-sm text-muted hover:text-foreground disabled:opacity-30"
            >
              Prev
            </button>
            <span className="text-sm text-muted font-mono">
              {page} / {totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
              className="rounded border border-border px-3 py-1 text-sm text-muted hover:text-foreground disabled:opacity-30"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
