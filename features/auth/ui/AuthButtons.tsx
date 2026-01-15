"use client";

import { useState } from "react";
import { useAuth } from "../model/use-auth";
import { SignInModal } from "./SignInModal";
import { SignUpModal } from "./SignUpModal";

export function AuthButtons() {
  const { user, signOut } = useAuth();
  const [modalOpen, setModalOpen] = useState<"signin" | "signup" | null>(null);

  const openSignIn = () => setModalOpen("signin");
  const openSignUp = () => setModalOpen("signup");
  const closeModal = () => setModalOpen(null);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Sign out failed:", error);
    }
  };

  if (user) {
    return (
      <>
        <div className="flex gap-2 mt-3">
          <button
            onClick={handleSignOut}
            className="w-full px-4 py-2 bg-[#1e293b] hover:bg-red-500/20 border border-[#334155] hover:border-red-500/30 text-slate-300 hover:text-red-400 text-sm font-medium rounded-lg transition-colors"
          >
            Sign Out
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="flex gap-2 mt-3">
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
      </div>

      <SignInModal isOpen={modalOpen === "signin"} onClose={closeModal} />
      <SignUpModal isOpen={modalOpen === "signup"} onClose={closeModal} />
    </>
  );
}
