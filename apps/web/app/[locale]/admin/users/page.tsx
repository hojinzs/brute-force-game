"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/shared/api/api-client";

interface User {
  id: string;
  nickname: string;
  email?: string;
  role: string;
  isAnonymous: boolean;
  totalPoints: string;
  cpCount: number;
  createdAt: string;
}

export default function AdminUsersPage() {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const queryClient = useQueryClient();

  const { data: users } = useQuery({
    queryKey: ["admin-users", search, roleFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (roleFilter) params.append("role", roleFilter);
      params.append("limit", "100");

      const response = await apiClient.get(
        `/api/admin/users?${params.toString()}`
      );
      return response.data.users || [];
    },
    refetchInterval: 60000,
  });

  const changeRoleMutation = useMutation({
    mutationFn: async (data: { userId: string; role: string }) => {
      await apiClient.put(`/api/admin/users/${data.userId}/role`, {
        role: data.role,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setSelectedUser(null);
    },
  });

  const resetCpMutation = useMutation({
    mutationFn: async (userId: string) => {
      await apiClient.post(`/api/admin/users/${userId}/reset-cp`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
  });

  const handleRoleChange = (newRole: string) => {
    if (!selectedUser) return;

    if (
      confirm(
        `Are you sure you want to change ${selectedUser.nickname}'s role to ${newRole}?`
      )
    ) {
      changeRoleMutation.mutate({ userId: selectedUser.id, role: newRole });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-green-400">User Management</h2>
      </div>

      <div className="flex gap-4">
        <input
          type="text"
          placeholder="Search by nickname..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 rounded bg-gray-800 border border-green-500/20 px-4 py-2 text-gray-300 focus:border-green-500 focus:outline-none"
        />
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="rounded bg-gray-800 border border-green-500/20 px-4 py-2 text-gray-300 focus:border-green-500 focus:outline-none"
        >
          <option value="">All Roles</option>
          <option value="USER">USER</option>
          <option value="MASTER">MASTER</option>
        </select>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-green-400">
            Users ({users?.length || 0})
          </h3>
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {users?.map((user: User) => (
              <button
                key={user.id}
                onClick={() => setSelectedUser(user)}
                className={`w-full rounded-lg border p-4 text-left transition-colors ${
                  selectedUser?.id === user.id
                    ? "border-green-500 bg-green-500/10"
                    : "border-green-500/20 bg-gray-900/50 hover:border-green-500/40"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-green-400">
                    {user.nickname}
                  </span>
                  <span
                    className={`text-xs font-mono px-2 py-1 rounded ${
                      user.role === "MASTER"
                        ? "bg-yellow-500/20 text-yellow-400"
                        : "bg-green-500/20 text-green-400"
                    }`}
                  >
                    {user.role}
                  </span>
                </div>
                <div className="mt-2 text-sm text-gray-400">
                  {user.email || "Anonymous"}
                </div>
                <div className="mt-1 text-xs text-gray-500">
                  Points: {user.totalPoints} | CP: {user.cpCount}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-green-400">
            User Details
          </h3>
          {selectedUser ? (
            <div className="rounded-lg border border-green-500/20 bg-gray-900/50 p-6 space-y-4">
              <div>
                <span className="text-gray-400">Nickname:</span>
                <span className="ml-2 font-mono text-green-400">
                  {selectedUser.nickname}
                </span>
              </div>
              <div>
                <span className="text-gray-400">Email:</span>
                <span className="ml-2 text-gray-300">
                  {selectedUser.email || "N/A"}
                </span>
              </div>
              <div>
                <span className="text-gray-400">User ID:</span>
                <span className="ml-2 font-mono text-gray-300 text-xs">
                  {selectedUser.id}
                </span>
              </div>
              <div>
                <span className="text-gray-400">Role:</span>
                <span
                  className={`ml-2 font-mono ${
                    selectedUser.role === "MASTER"
                      ? "text-yellow-400"
                      : "text-green-400"
                  }`}
                >
                  {selectedUser.role}
                </span>
              </div>
              <div>
                <span className="text-gray-400">Total Points:</span>
                <span className="ml-2 font-mono text-green-400">
                  {selectedUser.totalPoints}
                </span>
              </div>
              <div>
                <span className="text-gray-400">CP Count:</span>
                <span className="ml-2 font-mono text-green-400">
                  {selectedUser.cpCount}
                </span>
              </div>
              <div>
                <span className="text-gray-400">Account Type:</span>
                <span className="ml-2 text-gray-300">
                  {selectedUser.isAnonymous ? "Anonymous" : "Registered"}
                </span>
              </div>
              <div>
                <span className="text-gray-400">Created:</span>
                <span className="ml-2 text-gray-300">
                  {new Date(selectedUser.createdAt).toLocaleString()}
                </span>
              </div>

              <div className="space-y-3 border-t border-green-500/20 pt-4">
                <h4 className="font-semibold text-yellow-400">
                  Admin Actions
                </h4>

                <div className="space-y-2">
                  <label className="text-sm text-gray-400">Change Role:</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleRoleChange("USER")}
                      disabled={
                        selectedUser.role === "USER" ||
                        changeRoleMutation.isPending
                      }
                      className="flex-1 rounded bg-green-500/20 px-4 py-2 text-sm text-green-400 hover:bg-green-500/30 transition-colors disabled:opacity-50"
                    >
                      Set USER
                    </button>
                    <button
                      onClick={() => handleRoleChange("MASTER")}
                      disabled={
                        selectedUser.role === "MASTER" ||
                        changeRoleMutation.isPending
                      }
                      className="flex-1 rounded bg-yellow-500/20 px-4 py-2 text-sm text-yellow-400 hover:bg-yellow-500/30 transition-colors disabled:opacity-50"
                    >
                      Set MASTER
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => {
                    if (
                      confirm(
                        `Reset CP to maximum (50) for ${selectedUser.nickname}?`
                      )
                    ) {
                      resetCpMutation.mutate(selectedUser.id);
                    }
                  }}
                  disabled={resetCpMutation.isPending}
                  className="w-full rounded bg-blue-500/20 px-4 py-2 text-sm text-blue-400 hover:bg-blue-500/30 transition-colors disabled:opacity-50"
                >
                  {resetCpMutation.isPending ? "Resetting..." : "Reset CP"}
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-green-500/20 bg-gray-900/50 p-6 text-center text-gray-400">
              Select a user to view details
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
