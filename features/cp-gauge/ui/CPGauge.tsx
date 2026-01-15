"use client";

import { useState } from "react";
import { useAuth, SignInModal, SignUpModal } from "@/features/auth";
import { useCPGauge } from "../model/use-cp-gauge";
import { CPGaugeBar } from "./CPGaugeBar";

export function CPGauge() {
  const { user, signOut } = useAuth();
  const { current, max } = useCPGauge(user?.id);
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

        <SignInModal isOpen={modalOpen === "signin"} onClose={closeModal} />
        <SignUpModal isOpen={modalOpen === "signup"} onClose={closeModal} />
      </>
    );
  }

  return (
    <div>
      <CPGaugeBar current={current} max={max} />
      <div className="flex justify-end -mt-4">
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
