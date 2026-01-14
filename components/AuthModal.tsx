"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useGame";

type AuthModalProps = {
  isOpen: boolean;
  mode: "signin" | "signup" | "convert";
  onClose: () => void;
};

export function AuthModal({ isOpen, mode, onClose }: AuthModalProps) {
  const { signInWithPassword, signUpWithEmail, convertAnonymousToEmail, updatePassword, updateNickname, user } = useAuth();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nickname, setNickname] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"email" | "password">("email");

  if (!isOpen) return null;

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await signInWithPassword(email, password);
      onClose();
      setEmail("");
      setPassword("");
    } catch (err: any) {
      setError(err.message || "Failed to sign in");
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await signUpWithEmail(email, password, nickname);
      setError("Account created! Please check your email to verify your account.");
      setTimeout(() => {
        onClose();
        setEmail("");
        setPassword("");
        setNickname("");
        setError(null);
      }, 3000);
    } catch (err: any) {
      setError(err.message || "Failed to sign up");
    } finally {
      setLoading(false);
    }
  };

  const handleConvertStep1 = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const redirectUrl = `${window.location.origin}/auth/callback`;
      await convertAnonymousToEmail(email);
      setStep("password");
      setError("Verification email sent! Please check your inbox and click the link to verify your email.");
    } catch (err: any) {
      setError(err.message || "Failed to link email");
    } finally {
      setLoading(false);
    }
  };

  const handleConvertStep2 = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await updatePassword(password);
      if (user && nickname) {
        await updateNickname(user.id, nickname);
      }
      setError("Account converted successfully!");
      setTimeout(() => {
        onClose();
        setEmail("");
        setPassword("");
        setNickname("");
        setError(null);
        setStep("email");
      }, 2000);
    } catch (err: any) {
      setError(err.message || "Failed to set password. Make sure you verified your email.");
    } finally {
      setLoading(false);
    }
  };

  const getTitle = () => {
    if (mode === "signin") return "Sign In";
    if (mode === "signup") return "Sign Up";
    return step === "email" ? "Convert to Permanent Account" : "Set Password";
  };

  const getSubmitText = () => {
    if (loading) return "Processing...";
    if (mode === "signin") return "Sign In";
    if (mode === "signup") return "Sign Up";
    return step === "email" ? "Send Verification Email" : "Set Password & Complete";
  };

  const handleSubmit = (e: React.FormEvent) => {
    if (mode === "signin") return handleSignIn(e);
    if (mode === "signup") return handleSignUp(e);
    return step === "email" ? handleConvertStep1(e) : handleConvertStep2(e);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-slate-50">{getTitle()}</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 transition-colors"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {(step === "email" || mode !== "convert") && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-4 py-3 text-slate-50 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
                placeholder="your@email.com"
              />
            </div>
          )}

          {mode === "signup" && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Nickname
              </label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                required
                minLength={2}
                maxLength={20}
                className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-4 py-3 text-slate-50 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
                placeholder="Your nickname"
              />
            </div>
          )}

          {((mode === "convert" && step === "password") || mode !== "convert") && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-4 py-3 text-slate-50 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
                placeholder="••••••••"
              />
            </div>
          )}

          {mode === "convert" && step === "password" && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Nickname (Optional)
              </label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                minLength={2}
                maxLength={20}
                className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-4 py-3 text-slate-50 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
                placeholder="Change your nickname"
              />
            </div>
          )}

          {error && (
            <div className={`p-3 rounded-lg text-sm ${
              error.includes("successfully") || error.includes("check your email")
                ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
                : "bg-red-500/10 border border-red-500/20 text-red-400"
            }`}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-medium py-3 rounded-lg transition-colors"
          >
            {getSubmitText()}
          </button>
        </form>

        {mode === "convert" && step === "email" && (
          <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
            <p className="text-amber-400 text-xs">
              <strong>Note:</strong> You&apos;ll receive a verification email. 
              Click the link in the email, then come back here to set your password.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
