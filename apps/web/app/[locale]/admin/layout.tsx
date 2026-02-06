"use client";

import { useAuth } from "@/features/auth/model/use-auth";
import { redirect } from "next/navigation";
import { useEffect } from "react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        redirect("/");
      }
      if (user.role !== "MASTER") {
        redirect("/");
      }
    }
  }, [user, loading]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-950">
        <div className="text-green-400">Loading...</div>
      </div>
    );
  }

  if (!user || user.role !== "MASTER") {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <header className="border-b border-green-500/20 bg-gray-900/50 backdrop-blur">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-green-400">
              Game Master Console
            </h1>
            <span className="rounded bg-green-500/20 px-2 py-1 text-xs font-mono text-green-400 border border-green-500/30">
              MASTER
            </span>
          </div>
          <nav className="flex items-center gap-6">
            <a
              href="/admin"
              className="text-sm text-gray-400 hover:text-green-400 transition-colors"
            >
              Dashboard
            </a>
            <a
              href="/admin/blocks"
              className="text-sm text-gray-400 hover:text-green-400 transition-colors"
            >
              Blocks
            </a>
            <a
              href="/admin/users"
              className="text-sm text-gray-400 hover:text-green-400 transition-colors"
            >
              Users
            </a>
            <a
              href="/"
              className="text-sm text-gray-400 hover:text-green-400 transition-colors"
            >
              Back to Game
            </a>
          </nav>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
