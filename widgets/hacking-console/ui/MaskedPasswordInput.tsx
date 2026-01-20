"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";

type MaskedPasswordInputProps = {
  length: number;
  value: string;
  disabled?: boolean;
  isError?: boolean;
  onChange: (value: string) => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  onEnter?: () => void;
};

export function MaskedPasswordInput({
  length,
  value,
  disabled = false,
  isError = false,
  onChange,
  onKeyDown,
  onEnter,
}: MaskedPasswordInputProps) {
  // Track if we should restore focus after submission (disabled state cycle)
  const shouldRestoreFocus = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isFocused, setIsFocused] = useState(false);

  // Focus input when container is clicked
  const handleContainerClick = () => {
    if (!disabled) {
      inputRef.current?.focus();
    }
  };

  // Restore focus if needed when enabled
  useEffect(() => {
    if (!disabled && shouldRestoreFocus.current) {
      inputRef.current?.focus();
      shouldRestoreFocus.current = false;
    }
  }, [disabled]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value.slice(0, length);
    onChange(newValue);
  };

  const handleKeyDownInternal = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && onEnter) {
      shouldRestoreFocus.current = true;
      onEnter();
    }
    onKeyDown?.(e);
  };

  return (
    <div
      className={`
        relative w-full border rounded-lg bg-[#0f172a]
        cursor-text px-4 py-3 transition-colors duration-200
        ${disabled ? "opacity-50 cursor-not-allowed border-slate-700" : 
          isError ? "border-rose-500 bg-rose-500/5" : 
          isFocused ? "border-blue-500 ring-1 ring-blue-500/30" : "border-slate-600 hover:border-slate-500"}
      `}
      onClick={handleContainerClick}
    >
      {/* Hidden Input for handling typing */}
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDownInternal}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className="absolute inset-0 w-full h-full opacity-0 cursor-text"
        disabled={disabled}
        maxLength={length}
        autoComplete="off"
        spellCheck={false}
      />

      {/* Visual Display */}
      <div className="flex items-center justify-center gap-2 font-mono text-xl font-medium tracking-wide">
        {Array.from({ length }).map((_, index) => {
          const char = value[index];
          const isCurrent = isFocused && index === value.length;
          
          return (
            <div key={index} className="relative w-4 text-center flex justify-center h-8 items-center">
              {char ? (
                <span className="text-slate-50">{char}</span>
              ) : (
                <span className="text-slate-700">·</span>
              )}
              {isCurrent && !disabled && (
                <motion.div
                  layoutId="cursor"
                  className="absolute bottom-1 w-full h-0.5 bg-blue-500"
                  animate={{ opacity: [1, 1, 0, 0] }}
                  transition={{ 
                    opacity: { duration: 0.8, repeat: Infinity, times: [0, 0.5, 0.5, 1] },
                    layout: { duration: 0 }
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
