"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/features/auth";

const COUNTRIES = [
  { code: "KR", name: "Korea, Republic of" },
  { code: "US", name: "United States" },
  { code: "JP", name: "Japan" },
  { code: "CN", name: "China" },
  { code: "GB", name: "United Kingdom" },
  { code: "DE", name: "Germany" },
  { code: "FR", name: "France" },
  { code: "CA", name: "Canada" },
  { code: "AU", name: "Australia" },
  { code: "SG", name: "Singapore" },
  { code: "ZZ", name: "Other" },
];

export default function SignupPage() {
  const { signUpWithEmail, user, loading: authLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [nickname, setNickname] = useState("");
  const [country, setCountry] = useState("");
  const [emailConsent, setEmailConsent] = useState(false);
  
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isAnonymousUpgrade = user?.is_anonymous;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (!country) {
      setError("Please select your country");
      return;
    }

    setLoading(true);

    try {
      await signUpWithEmail({
        email,
        password,
        nickname,
        country,
        emailConsent,
        redirectTo: "/",
      });
      setError(isAnonymousUpgrade 
        ? "Account upgraded! Please check your email to verify your permanent access." 
        : "Signup complete. Please check your email to verify your account.");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to sign up";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return <div className="min-h-screen bg-[#0f172a] flex items-center justify-center text-slate-500">Loading secure link...</div>;
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
            {isAnonymousUpgrade ? "Secure Your Guest Session" : "Join the Brutal Force Member"}
          </h1>
          <div className="space-y-6 text-slate-400 leading-relaxed">
            <p>
              {isAnonymousUpgrade 
                ? "You are currently operating on a temporary guest frequency. Converting to a permanent agent account will preserve your accumulated history, rank, and computing power."
                : "Brute Force is a massive multiplayer social hacking simulation. To participate in the global effort to decrypt the blocks, authentication is required to maintain the integrity of the ledger."
              }
            </p>
            
            <div className="bg-[#0f172a]/50 p-6 rounded-xl border border-[#334155]/50">
              <h3 className="text-slate-200 font-semibold mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                Why do we need your email?
              </h3>
              <ul className="space-y-3 text-sm">
                <li className="flex gap-3">
                  <span className="text-slate-500">01</span>
                  <span>
                    To notify you of important game events, such as when a Block is solved or when your similarity score beats the top record.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="text-slate-500">02</span>
                  <span>
                    To serve as a secure channel for future rewards distribution (Phase 2 Economy).
                  </span>
                </li>
              </ul>
            </div>

            <p className="text-sm text-slate-500">
              * Country information is collected solely for the purpose of global/regional ranking aggregation.
            </p>
          </div>
        </div>
      </div>

      {/* Right: Signup Form */}
      <div className="w-full md:w-1/2 p-8 md:p-12 lg:p-16 flex items-center justify-center">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-50 mb-2">
              {isAnonymousUpgrade ? "Upgrade Access" : "Create Account"}
            </h2>
            <p className="text-slate-400">
              {isAnonymousUpgrade 
                ? "Enter your details to finalize your permanent agent profile." 
                : "Enter your details to generate your access key."
              }
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-[#1e293b] border border-[#334155] rounded-lg px-4 py-3 text-slate-50 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                placeholder="agent@bruteforce.ai"
              />
            </div>

            {/* Nickname & Country Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Nickname</label>
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  required
                  minLength={2}
                  maxLength={20}
                  className="w-full bg-[#1e293b] border border-[#334155] rounded-lg px-4 py-3 text-slate-50 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  placeholder="Codename"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Country</label>
                <select
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  required
                  className="w-full bg-[#1e293b] border border-[#334155] rounded-lg px-4 py-3 text-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all appearance-none"
                >
                  <option value="" disabled>Select</option>
                  {COUNTRIES.map((c) => (
                    <option key={c.code} value={c.code}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full bg-[#1e293b] border border-[#334155] rounded-lg px-4 py-3 text-slate-50 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                placeholder="••••••••"
              />
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                className="w-full bg-[#1e293b] border border-[#334155] rounded-lg px-4 py-3 text-slate-50 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                placeholder="••••••••"
              />
            </div>

            {/* Email Consent */}
            <div className="flex items-start gap-3 pt-2">
              <input
                type="checkbox"
                id="emailConsent"
                checked={emailConsent}
                onChange={(e) => setEmailConsent(e.target.checked)}
                className="mt-1 w-4 h-4 rounded border-slate-600 bg-[#1e293b] text-blue-500 focus:ring-blue-500/50"
              />
              <label htmlFor="emailConsent" className="text-sm text-slate-400 leading-snug cursor-pointer select-none">
                [Optional] I agree to receive emails about game updates, major events, and reward opportunities.
              </label>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-lg transition-all shadow-lg shadow-blue-900/20"
            >
              {loading ? "Establishing Link..." : (isAnonymousUpgrade ? "Confirm Upgrade" : "Initialize Account")}
            </button>
          </form>

          <p className="mt-8 text-center text-slate-500 text-sm">
            Already have an active ledger?{" "}
            <Link href="/?signin=true" className="text-blue-400 hover:text-blue-300 transition-colors">
              Access Terminal
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
