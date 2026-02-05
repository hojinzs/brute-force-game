"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useAuth } from "@/features/auth";
import { SignupForm } from "./SignupForm";

export function SignupClient() {
  const t = useTranslations();
  const { signUpWithEmail, user, loading: authLoading } = useAuth();
  const isAnonymousUpgrade = user?.is_anonymous;

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center text-slate-500">
        {t("common.secureLink")}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f172a] flex flex-col md:flex-row">
      {/* Left: Info Section */}
      <div className="w-full md:w-1/2 p-8 md:p-12 lg:p-16 flex flex-col justify-center bg-[#1e293b] border-b md:border-b-0 md:border-r border-[#334155]">
        <div className="max-w-lg mx-auto md:mx-0">
          <Link href="/" className="text-2xl font-bold text-blue-500 mb-8 block">
            BRUTE FORCE
          </Link>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-50 mb-6 leading-tight">
            {isAnonymousUpgrade ? t("auth.signup.secureGuest") : t("auth.signup.title")}
          </h1>
          <div className="space-y-6 text-slate-400 leading-relaxed">
            <p>
              {isAnonymousUpgrade
                ? t("auth.signup.secureGuestDesc")
                : t("auth.signup.joinBruteForce")}
            </p>

            <div className="bg-[#0f172a]/50 p-6 rounded-xl border border-[#334155]/50">
              <h3 className="text-slate-200 font-semibold mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                {t("auth.signup.whyEmail")}
              </h3>
              <ul className="space-y-3 text-sm">
                <li className="flex gap-3">
                  <span className="text-slate-500">01</span>
                  <span>{t("auth.signup.emailReason1")}</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-slate-500">02</span>
                  <span>{t("auth.signup.emailReason2")}</span>
                </li>
              </ul>
            </div>

            <p className="text-sm text-slate-500">
              {t("auth.signup.countryDisclaimer")}
            </p>
          </div>
        </div>
      </div>

      {/* Right: Signup Form */}
      <div className="w-full md:w-1/2 p-8 md:p-12 lg:p-16 flex items-center justify-center">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-50 mb-2">
              {isAnonymousUpgrade
                ? t("auth.signup.upgradeAccess")
                : t("auth.signup.createAccount")}
            </h2>
            <p className="text-slate-400">
              {isAnonymousUpgrade
                ? t("auth.signup.upgradeAccessDesc")
                : t("auth.signup.createAccountDesc")}
            </p>
          </div>

          <SignupForm
            isAnonymousUpgrade={isAnonymousUpgrade}
            signUpWithEmail={signUpWithEmail}
          />

          <p className="mt-8 text-center text-slate-500 text-sm">
            {t("auth.signup.haveAccount")} {" "}
            <Link href="/?signin=true" className="text-blue-400 hover:text-blue-300 transition-colors">
              {t("auth.signup.accessTerminal")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
