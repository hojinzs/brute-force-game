"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useGame";
import { AuthModal } from "./AuthModal";

type CPGaugeProps = {
  current: number;
  max: number;
};

export function CPGauge({ current, max }: CPGaugeProps) {
  const { user, signOut } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"signin" | "signup">("signin");
  
  const percentage = Math.min((current / max) * 100, 100);

  const openSignIn = () => {
    setModalMode("signin");
    setModalOpen(true);
  };

  const openSignUp = () => {
    setModalMode("signup");
    setModalOpen(true);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Sign out failed:", error);
    }
  };

  if (!user) {
    return (
      <>
        <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-4 mb-6">
          <p className="text-slate-300 text-center mb-4 text-sm">
            Sign in or create an account to start playing
          </p>
          <div className="flex gap-2">
            <button
              onClick={openSignIn}
              className="flex-1 px-4 py-2 bg-[#0f172a] hover:bg-[#334155] border border-[#334155] text-slate-300 text-sm font-medium rounded-lg transition-colors"
            >
              Sign In
            </button>
            <button
              onClick={openSignUp}
              className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Sign Up
            </button>
          </div>
        </div>

        <AuthModal
          isOpen={modalOpen}
          mode={modalMode}
          onClose={() => setModalOpen(false)}
        />
      </>
    );
  }

  return (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-2">
        <span className="text-slate-400 text-sm">Computing Power</span>
        <span className="text-slate-50 font-mono text-sm">
          {current}/{max}
        </span>
      </div>
      <div className="h-1 bg-[#334155] rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-500 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="flex justify-between items-center mt-1">
        <p className="text-slate-500 text-xs">+1 CP per minute</p>
        <button
          onClick={handleSignOut}
          className="text-slate-500 hover:text-red-400 text-xs transition-colors"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}
