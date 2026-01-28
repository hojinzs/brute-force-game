"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useAuth, SignInModal } from "@/features/auth";

type ModalType = "signin" | null;

export function Header() {
  const { user, loading, signOut } = useAuth();
  const [modalOpen, setModalOpen] = useState<ModalType>(null);
  const t = useTranslations();

  const closeModal = () => setModalOpen(null);

  return (
    <>
      <header className="flex items-center justify-between px-4 py-3 md:px-6 md:py-4 border border-[#334155] rounded-xl bg-[#1e293b]">
        <h1 className="text-xl md:text-2xl font-bold text-slate-50 tracking-wide">
          BRUTE FORCE
        </h1>

        {!loading && (
          <nav className="flex items-center gap-2">
            <Link
              href="/settings"
              className="px-3 py-2 text-slate-400 hover:text-slate-200 text-sm font-medium transition-colors"
              title="Settings"
            >
              ⚙️
            </Link>
            {user ? (
              user.is_anonymous ? (
                <>
                  <button
                    onClick={() => setModalOpen("signin")}
                    className="px-4 py-2 text-slate-300 hover:text-slate-100 text-sm font-medium transition-colors"
                  >
                    {t('auth.signIn')}
                  </button>
                  <Link
                    href="/auth/signup"
                    className="px-4 py-2 bg-[#3b82f6] hover:bg-[#2563eb] text-white text-sm font-semibold rounded-lg transition-colors"
                  >
                    {t('auth.signUp')}
                  </Link>
                </>
              ) : (
                <button
                  onClick={signOut}
                  className="text-slate-400 hover:text-slate-200 text-sm font-medium transition-colors"
                >
                  Sign Out
                </button>
              )
            ) : (
              <>
                <button
                  onClick={() => setModalOpen("signin")}
                  className="px-4 py-2 text-slate-300 hover:text-slate-100 text-sm font-medium transition-colors"
                >
                  {t('auth.signIn')}
                </button>
                <Link
                  href="/auth/signup"
                  className="px-4 py-2 bg-[#3b82f6] hover:bg-[#2563eb] text-white text-sm font-semibold rounded-lg transition-colors"
                >
                  {t('auth.signUp')}
                </Link>
              </>
            )}
          </nav>
        )}
      </header>

      <SignInModal isOpen={modalOpen === "signin"} onClose={closeModal} />
    </>
  );
}
