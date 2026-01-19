"use client";

import { CPGaugeBar } from "@/features/cp-gauge";
import { formatCharsetDisplay, type CharsetType } from "@/shared/lib/charset";
import { PreviousAttemptDisplay } from "./PreviousAttemptDisplay";

type LastAttempt = {
  input: string;
  similarity: number;
};

type HackingConsoleViewProps = {
  length: number;
  charset: CharsetType[];
  disabled: boolean;
  isValidLength: boolean;
  value: string;
  error: string | null;
  isShaking: boolean;
  showErrorBorder: boolean;
  lastAttempt: LastAttempt | null;
  lastAttemptIsCorrect: boolean | null;
  cpCurrent: number;
  cpMax: number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onSubmit: () => void;
};

export function HackingConsoleView({
  length,
  charset,
  disabled,
  isValidLength,
  value,
  error,
  isShaking,
  showErrorBorder,
  lastAttempt,
  lastAttemptIsCorrect,
  cpCurrent,
  cpMax,
  onChange,
  onKeyDown,
  onSubmit,
}: HackingConsoleViewProps) {
  const cpEmpty = cpCurrent <= 0;
  const inputBorderClass = showErrorBorder ? "border-red-500" : "border-[#334155]";

  return (
    <div className={`bg-[#1e293b] border border-[#334155] rounded-xl p-4 ${isShaking ? "shake" : ""}`}>
      <CPGaugeBar current={cpCurrent} max={cpMax} />

      <div className="flex gap-3">
        <div className="flex-1 relative">
          <input
            type="text"
            value={value}
            onChange={onChange}
            onKeyDown={onKeyDown}
            disabled={disabled}
            placeholder={`Enter ${length} characters...`}
            className={`w-full bg-[#0f172a] ${inputBorderClass} border rounded-lg px-4 py-3 text-lg font-mono text-slate-50 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-shadow`}
            autoComplete="off"
            spellCheck={false}
            maxLength={length}
          />
          <span
            className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono ${
              value.length === 0 ? "text-slate-600" : isValidLength ? "text-emerald-500" : "text-amber-500"
            }`}
          >
            {value.length}/{length}
          </span>
        </div>
        <button
          onClick={onSubmit}
          disabled={disabled || !isValidLength}
          className="px-6 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
        >
          CRACK
        </button>
      </div>

      <div className="mt-2 space-y-1">
        <p className="text-slate-500 text-xs">Password length: exactly {length} characters</p>
        <p className="text-slate-500 text-xs">Allowed characters: {formatCharsetDisplay(charset)}</p>
        {cpEmpty && (
          <p className="text-red-400 text-xs font-medium">CP 부족</p>
        )}
        {error && (
          <p className="text-red-400 text-xs font-medium animate-pulse">{error}</p>
        )}
        {lastAttempt && <PreviousAttemptDisplay input={lastAttempt.input} similarity={lastAttempt.similarity} />}
      </div>

      <div className="sr-only" aria-live="polite">
        {lastAttempt && lastAttemptIsCorrect === false
          ? `Incorrect. ${lastAttempt.similarity}% similarity`
          : ""}
      </div>
    </div>
  );
}
