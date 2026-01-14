"use client";

import { useState, useCallback } from "react";
import {
  type CharsetType,
  filterAllowedChars,
  createPasswordSchema,
  formatCharsetDisplay,
} from "@/lib/charset";

type HackingConsoleProps = {
  length: number;
  charset: CharsetType[];
  disabled: boolean;
  onSubmit: (value: string) => void;
};

export function HackingConsole({
  length,
  charset,
  disabled,
  onSubmit,
}: HackingConsoleProps) {
  const [value, setValue] = useState("");
  const [isShaking, setIsShaking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const passwordSchema = createPasswordSchema(charset, length);

  const handleSubmit = useCallback(() => {
    if (disabled) return;

    // Clear previous error
    setError(null);

    // Validate with Zod
    const result = passwordSchema.safeParse(value);

    if (!result.success) {
      const errorMessage = result.error.issues[0]?.message || "Invalid password";
      setError(errorMessage);
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 400);
      return;
    }

    onSubmit(value);
    setValue("");
  }, [value, passwordSchema, disabled, onSubmit]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSubmit();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;

    // Filter only allowed characters
    const filteredValue = filterAllowedChars(newValue, charset);

    // Only update if within length limit
    if (filteredValue.length <= length) {
      setValue(filteredValue);
      setError(null); // Clear error when user types
    }
  };

  const isValidLength = value.length === length;

  return (
    <div
      className={`bg-[#1e293b] border border-[#334155] rounded-xl p-4 ${
        isShaking ? "shake" : ""
      }`}
    >
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <input
            type="text"
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            placeholder={`Enter ${length} characters...`}
            className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-4 py-3 text-lg font-mono text-slate-50 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-shadow"
            autoComplete="off"
            spellCheck={false}
            maxLength={length}
          />
          <span
            className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono ${
              value.length === 0
                ? "text-slate-600"
                : isValidLength
                ? "text-emerald-500"
                : "text-amber-500"
            }`}
          >
            {value.length}/{length}
          </span>
        </div>
        <button
          onClick={handleSubmit}
          disabled={disabled || !isValidLength}
          className="px-6 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
        >
          CRACK
        </button>
      </div>
      <div className="mt-2 space-y-1">
        <p className="text-slate-500 text-xs">
          Password length: exactly {length} characters
        </p>
        <p className="text-slate-500 text-xs">
          Allowed characters: {formatCharsetDisplay(charset)}
        </p>
        {error && (
          <p className="text-red-400 text-xs font-medium animate-pulse">
            ⚠ {error}
          </p>
        )}
      </div>
    </div>
  );
}
