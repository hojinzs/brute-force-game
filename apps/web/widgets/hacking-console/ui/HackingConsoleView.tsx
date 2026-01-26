"use client";

import { motion } from "motion/react";
import { CPGaugeBar } from "@/features/cp-gauge";
import { type CharsetType } from "@/shared/lib/charset";
import { CharsetBadge } from "@/shared/ui/CharsetBadge";
import { MaskedPasswordInput } from "./MaskedPasswordInput";

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
  isCracking: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
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
  isCracking,
  onChange,
  onSubmit,
}: HackingConsoleViewProps) {
  const cpEmpty = cpCurrent <= 0;
  const isErrorState = !!error || showErrorBorder;

  return (
    <motion.div
      animate={isShaking ? { x: [0, -5, 5, -5, 5, 0] } : { x: 0 }}
      transition={{ duration: 0.2 }}
      className="bg-[#1e293b]/40 backdrop-blur-md border border-slate-700/50 rounded-xl p-5"
    >
      {/* CP Gauge */}
      <CPGaugeBar 
        current={cpCurrent} 
        max={cpMax} 
        refillRateText="Recovers 1 CP per minute" 
      />

      {/* Input Area */}
      <div className="mt-4 mb-4">
        <MaskedPasswordInput
          length={length}
          value={value}
          onChange={(val) => onChange({ target: { value: val } } as any)}
          disabled={disabled || isCracking}
          isError={isErrorState}
          onEnter={isValidLength && !disabled && !isCracking ? onSubmit : undefined}
        />
        <div className="flex justify-start mt-2">
          {/* Rules Area */}
          <div className="flex items-center gap-3">
            <span className="font-mono text-slate-400 text-xs">Length: <span className="text-slate-200">{value.length}</span>/<span className="text-slate-200 font-medium">{length}</span></span>
            <div className="w-px h-3 bg-slate-700 mx-1" />
            <div className="flex gap-1.5">
              {charset.map((type) => (
                <CharsetBadge key={type} type={type} />
              ))}
            </div>
          </div>
          {/* Error Area */}
          <div className="flex flex-1 justify-end mt-2 h-4">
            {error && (
              <span className="text-red-400 text-[10px] font-medium animate-pulse">{error}</span>
            )}
            {cpEmpty && !error && (
                <span className="text-red-400 text-[10px] font-medium">Not enough CP</span>
            )}
          </div>
        </div>
      </div>

      {/* Crack Button */}
      <button
        onClick={onSubmit}
        disabled={disabled || !isValidLength || isCracking}
        className={`
          relative w-full py-3 rounded-lg overflow-hidden
          font-medium text-sm tracking-wide text-white
          transition-colors duration-200
          ${isErrorState 
            ? "bg-rose-500 hover:bg-rose-600 border border-rose-400/50 shadow-[0_0_15px_rgba(244,63,94,0.3)]" 
            : "bg-blue-500 hover:bg-blue-600 active:bg-blue-700 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed"
          }
          mb-4
        `}
      >
        {/* Progress Bar Background */}
        {isCracking && !isErrorState && (
          <motion.div
            className="absolute inset-0 bg-blue-700 z-0 origin-left"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 3, ease: "linear" }}
          />
        )}

        {/* Button Content */}
        <span className="relative z-10 flex items-center justify-center gap-2">
          {isCracking ? (
            <>
              <svg 
                className="animate-spin h-4 w-4 text-white" 
                xmlns="http://www.w3.org/2000/svg" 
                fill="none" 
                viewBox="0 0 24 24"
              >
                <circle 
                  className="opacity-25" 
                  cx="12" 
                  cy="12" 
                  r="10" 
                  stroke="currentColor" 
                  strokeWidth="4"
                />
                <path 
                  className="opacity-75" 
                  fill="currentColor" 
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              CRACKING...
            </>
          ) : (
            isErrorState ? "ERROR" : "CRACK"
          )}
        </span>
      </button>

      {/* Previous Attempt */}
      {lastAttempt && (
        <div className="border border-slate-700 bg-slate-800/50 rounded-lg p-2.5">
          <p className="text-slate-500 text-[10px] font-bold mb-1 uppercase tracking-wider">Previous Attempt</p>
          <div className="flex justify-between items-center">
             <span className="font-mono text-base text-slate-200 tracking-wider">{lastAttempt.input}</span>
             <div className={`
               px-1.5 py-0.5 rounded text-[10px] font-mono font-bold
               ${lastAttempt.similarity >= 80 ? 'bg-emerald-500/10 text-emerald-400' : 
                 lastAttempt.similarity >= 40 ? 'bg-amber-500/10 text-amber-400' : 
                 'bg-rose-500/10 text-rose-400'}
             `}>
               {(lastAttempt.similarity ?? 0).toFixed(1)}%
             </div>
          </div>
        </div>
      )}

      <div className="sr-only" aria-live="polite">
        {lastAttempt && lastAttemptIsCorrect === false
          ? `Incorrect. ${lastAttempt.similarity}% similarity`
          : ""}
      </div>
    </motion.div>
  );
}
