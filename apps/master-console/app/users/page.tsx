'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminShell } from '@/components/admin-shell';
import { getAdminUsers, getAdminUser, updateUserRole, resetUserCp } from '@/lib/api';
import type { UserDetail } from '@/lib/types';

function RoleBadge({ role }: { role: string }) {
  return role === 'MASTER' ? (
    <span className="inline-flex rounded-md border border-accent/20 bg-accent/10 px-2 py-0.5 text-xs font-bold text-accent uppercase tracking-wider">
      MASTER
    </span>
  ) : (
    <span className="inline-flex rounded-md border border-border bg-surface px-2 py-0.5 text-xs font-medium text-muted uppercase tracking-wider">
      USER
    </span>
  );
}

function UserDetailPanel({ userId, onClose }: { userId: string; onClose: () => void }) {
  const queryClient = useQueryClient();
  const { data: user, isLoading } = useQuery({
    queryKey: ['admin-user', userId],
    queryFn: () => getAdminUser(userId),
  });

  const [showRoleChange, setShowRoleChange] = useState(false);
  const [newRole, setNewRole] = useState('');

  const roleMutation = useMutation({
    mutationFn: (role: string) => updateUserRole(userId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-user', userId] });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setShowRoleChange(false);
    },
  });

  const cpMutation = useMutation({
    mutationFn: () => resetUserCp(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-user', userId] });
    },
  });

  if (isLoading || !user) {
    return (
      <div className="rounded-lg border border-border bg-surface p-4">
        <div className="animate-pulse text-muted text-sm">Loading user details...</div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-accent/30 bg-surface">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="font-bold">{user.nickname}</span>
          <RoleBadge role={user.role} />
        </div>
        <button onClick={onClose} className="text-muted hover:text-foreground text-sm">
          ✕
        </button>
      </div>

      <div className="p-4 space-y-4">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-xs text-muted block">Email</span>
            <span className="font-mono">{user.email || '(anonymous)'}</span>
          </div>
          <div>
            <span className="text-xs text-muted block">Nickname</span>
            <span className="font-mono">{user.nickname}</span>
          </div>
          <div>
            <span className="text-xs text-muted block">CP</span>
            <span className="font-mono">{user.cpCount} / 50</span>
          </div>
          <div>
            <span className="text-xs text-muted block">Total Points</span>
            <span className="font-mono">{user.totalPoints}</span>
          </div>
          <div>
            <span className="text-xs text-muted block">Total Attempts</span>
            <span className="font-mono">{user.attemptCount}</span>
          </div>
          <div>
            <span className="text-xs text-muted block">Won Blocks</span>
            <span className="font-mono">{user.wonBlockCount}</span>
          </div>
          <div>
            <span className="text-xs text-muted block">Success Rate</span>
            <span className="font-mono">{user.successRate}%</span>
          </div>
          <div>
            <span className="text-xs text-muted block">Attempts (7d)</span>
            <span className="font-mono">{user.recentAttempts7d}</span>
          </div>
          <div>
            <span className="text-xs text-muted block">Active Sessions</span>
            <span className="font-mono">{user.activeSessions}</span>
          </div>
          <div>
            <span className="text-xs text-muted block">Joined</span>
            <span className="text-xs">{new Date(user.createdAt).toLocaleString()}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2 border-t border-border pt-4">
          <button
            onClick={() => {
              setNewRole(user.role === 'MASTER' ? 'USER' : 'MASTER');
              setShowRoleChange(true);
            }}
            className="rounded-lg bg-warning/10 border border-warning/20 px-3 py-1.5 text-xs font-bold text-warning hover:bg-warning/20 transition"
          >
            Change Role
          </button>
          <button
            onClick={() => cpMutation.mutate()}
            disabled={cpMutation.isPending}
            className="rounded-lg bg-info/10 border border-info/20 px-3 py-1.5 text-xs font-bold text-info hover:bg-info/20 transition disabled:opacity-50"
          >
            {cpMutation.isPending ? 'Resetting...' : 'Reset CP to 50'}
          </button>
        </div>

        {/* Role change confirmation */}
        {showRoleChange && (
          <div className="border border-warning/30 rounded-lg p-4 space-y-3 bg-warning/5">
            <h3 className="text-sm font-bold text-warning">
              Change {user.nickname}'s role to {newRole}?
            </h3>
            <p className="text-xs text-muted">
              This will invalidate all of the user's sessions, forcing them to re-login.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => roleMutation.mutate(newRole)}
                disabled={roleMutation.isPending}
                className="rounded bg-warning px-3 py-1.5 text-xs font-bold text-black hover:bg-warning/90 disabled:opacity-50"
              >
                {roleMutation.isPending ? 'Updating...' : 'Confirm'}
              </button>
              <button
                onClick={() => setShowRoleChange(false)}
                className="rounded bg-surface-hover px-3 py-1.5 text-xs text-muted hover:text-foreground"
              >
                Cancel
              </button>
            </div>
            {roleMutation.isError && (
              <div className="text-xs text-danger">
                {(roleMutation.error as any)?.response?.data?.message || 'Failed to update role'}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function UsersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', page, search, roleFilter],
    queryFn: () => getAdminUsers(page, 20, search || undefined, roleFilter || undefined),
    refetchInterval: 30000,
  });

  const totalPages = data ? Math.ceil(data.total / data.limit) : 0;

  return (
    <AdminShell>
      <div className="space-y-4">
        <h1 className="text-xl font-bold font-mono">User Management</h1>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <input
            type="text"
            placeholder="Search nickname..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-border bg-surface px-3 py-1.5 text-sm font-mono placeholder-muted/50 focus:border-accent focus:outline-none w-48"
          />
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-border bg-surface px-3 py-1.5 text-sm focus:border-accent focus:outline-none"
          >
            <option value="">All roles</option>
            <option value="USER">USER</option>
            <option value="MASTER">MASTER</option>
          </select>
          {data && (
            <span className="flex items-center text-xs text-muted">
              {data.total} users
            </span>
          )}
        </div>

        {/* Selected user detail */}
        {selectedUserId && (
          <UserDetailPanel
            userId={selectedUserId}
            onClose={() => setSelectedUserId(null)}
          />
        )}

        {/* Users table */}
        <div className="rounded-lg border border-border bg-surface overflow-hidden">
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface-hover text-xs text-muted uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3 text-left">Nickname</th>
                  <th className="px-4 py-3 text-left">Email</th>
                  <th className="px-4 py-3 text-left">Role</th>
                  <th className="px-4 py-3 text-right">Points</th>
                  <th className="px-4 py-3 text-right">CP</th>
                  <th className="px-4 py-3 text-left">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data?.users?.map((user) => (
                  <tr
                    key={user.id}
                    onClick={() => setSelectedUserId(user.id)}
                    className={`cursor-pointer transition hover:bg-surface-hover ${
                      selectedUserId === user.id ? 'bg-accent/5' : ''
                    }`}
                  >
                    <td className="px-4 py-3 font-bold">
                      {user.nickname}
                      {user.isAnonymous && <span className="ml-1 text-xs text-muted">(anon)</span>}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-muted">{user.email || '-'}</td>
                    <td className="px-4 py-3"><RoleBadge role={user.role} /></td>
                    <td className="px-4 py-3 text-right font-mono">{user.totalPoints}</td>
                    <td className="px-4 py-3 text-right font-mono">{user.cpCount}</td>
                    <td className="px-4 py-3 text-xs text-muted">{new Date(user.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile card view */}
          <div className="md:hidden divide-y divide-border">
            {data?.users?.map((user) => (
              <div
                key={user.id}
                onClick={() => setSelectedUserId(user.id)}
                className={`p-4 cursor-pointer transition hover:bg-surface-hover ${
                  selectedUserId === user.id ? 'bg-accent/5' : ''
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold">{user.nickname}</span>
                  <RoleBadge role={user.role} />
                </div>
                <div className="flex justify-between text-xs text-muted">
                  <span>{user.email || 'anonymous'}</span>
                  <span>{user.totalPoints} pts</span>
                </div>
              </div>
            ))}
          </div>

          {isLoading && (
            <div className="px-4 py-8 text-center text-sm text-muted animate-pulse">Loading users...</div>
          )}

          {!isLoading && !data?.users?.length && (
            <div className="px-4 py-8 text-center text-sm text-muted">No users found</div>
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
