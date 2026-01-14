"use client";

import { useState, useCallback } from "react";

type HackingConsoleProps = {
  length: number;
  disabled: boolean;
  onSubmit: (value: string) => void;
};

export function HackingConsole({
  length,
  disabled,
  onSubmit,
}: HackingConsoleProps) {
  const [value, setValue] = useState("");
  const [isShaking, setIsShaking] = useState(false);

  const handleSubmit = useCallback(() => {
    if (disabled) return;

    if (value.length !== length) {
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 400);
      return;
    }

    onSubmit(value);
    setValue("");
  }, [value, length, disabled, onSubmit]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSubmit();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    if (newValue.length <= length) {
      setValue(newValue);
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
      <p className="text-slate-500 text-xs mt-2">
        Password length: exactly {length} characters
      </p>
    </div>
  );
}
