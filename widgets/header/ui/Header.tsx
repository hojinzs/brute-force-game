"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/shared/api";
import { useAuth, SignInModal } from "@/features/auth";

export function Header() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  return (
    <>
      <header className="flex items-center justify-between px-4 py-3 md:px-6 md:py-4 border border-[#334155] rounded-xl bg-[#1e293b]">
        <h1 className="text-xl md:text-2xl font-bold text-slate-50 tracking-wide">
          BRUTE FORCE
        </h1>
        {!loading &&
          (user ? (
            <button
              onClick={handleSignOut}
              className="text-slate-400 hover:text-slate-200 text-sm font-medium transition-colors"
            >
              Sign Out
            </button>
          ) : (
            <button
              onClick={() => setShowAuthModal(true)}
              className="px-4 py-2 bg-[#3b82f6] hover:bg-[#2563eb] text-white text-sm font-semibold rounded-lg transition-colors"
            >
              Sign In
            </button>
          ))}
      </header>

      <SignInModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </>
  );
}
