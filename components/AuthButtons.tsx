"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useGame";
import { AuthModal } from "./AuthModal";

export function AuthButtons() {
  const { user, isAnonymous, signOut } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"signin" | "signup" | "convert">("signin");

  const openSignIn = () => {
    setModalMode("signin");
    setModalOpen(true);
  };

  const openSignUp = () => {
    if (isAnonymous) {
      setModalMode("convert");
    } else {
      setModalMode("signup");
    }
    setModalOpen(true);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Sign out failed:", error);
    }
  };

  if (!user) return null;

  return (
    <>
      <div className="flex gap-2 mt-3">
        {isAnonymous ? (
          <>
            <button
              onClick={openSignIn}
              className="flex-1 px-4 py-2 bg-[#1e293b] hover:bg-[#334155] border border-[#334155] text-slate-300 text-sm font-medium rounded-lg transition-colors"
            >
              Sign In
            </button>
            <button
              onClick={openSignUp}
              className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Sign Up
            </button>
          </>
        ) : (
          <button
            onClick={handleSignOut}
            className="w-full px-4 py-2 bg-[#1e293b] hover:bg-red-500/20 border border-[#334155] hover:border-red-500/30 text-slate-300 hover:text-red-400 text-sm font-medium rounded-lg transition-colors"
          >
            Sign Out
          </button>
        )}
      </div>

      <AuthModal
        isOpen={modalOpen}
        mode={modalMode}
        onClose={() => setModalOpen(false)}
      />
    </>
  );
}
