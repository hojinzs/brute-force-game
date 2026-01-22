"use client";

import { type CharsetType } from "@/shared/lib/charset";
import { useHackingConsole } from "../model/use-hacking-console";
import { HackingConsoleView } from "./HackingConsoleView";

type HackingConsoleProps = {
  length: number;
  charset: CharsetType[];
  disabled: boolean;
  onSubmit: (value: string) => Promise<{ similarity: number; isCorrect: boolean } | null>;
  currentCP: number;
  maxCP: number;
};

export function HackingConsole({
  length,
  charset,
  disabled,
  onSubmit,
  currentCP,
  maxCP,
}: HackingConsoleProps) {
  // Logic moved to GameSessionManager
  const {
    value,
    error,
    isShaking,
    showErrorBorder,
    lastAttempt,
    lastAttemptIsCorrect,
    isValidLength,
    isCracking,
    handleChange,
    handleSubmit,
  } = useHackingConsole({
    length,
    charset,
    disabled,
    onSubmit,
  });

  return (
    <>
      {/* Debug UI Removed/Moved */}

      <HackingConsoleView
        length={length}
        charset={charset}
        disabled={disabled}
        isValidLength={isValidLength}
        value={value}
        error={error}
        isShaking={isShaking}
        showErrorBorder={showErrorBorder}
        lastAttempt={lastAttempt}
        lastAttemptIsCorrect={lastAttemptIsCorrect}
        cpCurrent={currentCP}
        cpMax={maxCP}
        isCracking={isCracking}
        onChange={handleChange}
        onSubmit={handleSubmit}
      />
    </>
  );
}
