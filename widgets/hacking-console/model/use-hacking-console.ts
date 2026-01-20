"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { filterAllowedChars, createPasswordSchema, type CharsetType } from "@/shared/lib/charset";

export type SubmitAnswerResult = {
  similarity: number;
  isCorrect: boolean;
};

type UseHackingConsoleParams = {
  length: number;
  charset: CharsetType[];
  disabled: boolean;
  onSubmit: (value: string) => Promise<SubmitAnswerResult | null>;
};

type LastAttempt = {
  input: string;
  similarity: number;
};

type UseHackingConsoleResult = {
  value: string;
  error: string | null;
  isShaking: boolean;
  showErrorBorder: boolean;
  lastAttempt: LastAttempt | null;
  lastAttemptIsCorrect: boolean | null;
  isValidLength: boolean;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  handleSubmit: () => void;
  resetError: () => void;
};

const SHAKE_DURATION_MS = 400;
const ERROR_BORDER_DURATION_MS = 300;

export function useHackingConsole({
  length,
  charset,
  disabled,
  onSubmit,
}: UseHackingConsoleParams): UseHackingConsoleResult {
  const [value, setValue] = useState("");
  const [isShaking, setIsShaking] = useState(false);
  const [showErrorBorder, setShowErrorBorder] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastAttempt, setLastAttempt] = useState<LastAttempt | null>(null);
  const [lastAttemptIsCorrect, setLastAttemptIsCorrect] = useState<boolean | null>(null);
  const shakeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const errorBorderTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const passwordSchema = useMemo(() => createPasswordSchema(charset, length), [charset, length]);

  const isValidLength = value.length === length;

  const clearShake = () => {
    if (shakeTimeoutRef.current) {
      clearTimeout(shakeTimeoutRef.current);
    }
    setIsShaking(false);
  };

  const clearErrorBorder = () => {
    if (errorBorderTimeoutRef.current) {
      clearTimeout(errorBorderTimeoutRef.current);
    }
    setShowErrorBorder(false);
  };

  const triggerErrorFeedback = () => {
    setIsShaking(true);
    setShowErrorBorder(true);

    shakeTimeoutRef.current = setTimeout(() => {
      setIsShaking(false);
    }, SHAKE_DURATION_MS);

    errorBorderTimeoutRef.current = setTimeout(() => {
      setShowErrorBorder(false);
    }, ERROR_BORDER_DURATION_MS);
  };

  const resetError = useCallback(() => {
    setError(null);
    clearErrorBorder();
    clearShake();
  }, []);

  const handleSubmit = useCallback(() => {
    if (disabled) return;

    setError(null);

    const result = passwordSchema.safeParse(value);

    if (!result.success) {
      const errorMessage = result.error.issues[0]?.message || "Invalid password";
      setError(errorMessage);
      triggerErrorFeedback();
      return;
    }

    void (async () => {
      try {
        const submitResult = await onSubmit(value);
        if (submitResult) {
          setLastAttempt({
            input: value,
            similarity: submitResult.similarity,
          });
          setLastAttemptIsCorrect(submitResult.isCorrect);

          if (!submitResult.isCorrect) {
            triggerErrorFeedback();
          }
        }
        setValue("");
      } catch (submitError: unknown) {
        const errorMessage =
          submitError instanceof Error ? submitError.message : String(submitError || "");
        setError(errorMessage || "Failed to submit answer. Please try again.");
        triggerErrorFeedback();
      }
    })();
  }, [disabled, passwordSchema, value, onSubmit]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      const filteredValue = filterAllowedChars(newValue, charset);

      // Check if characters were filtered out (length mismatch)
      // Ignore if deleting (newValue length is shorter than current value)
      if (newValue.length > filteredValue.length && newValue.length >= value.length) {
        setError("Invalid character");
        triggerErrorFeedback();
        
        // Clear error after 2 seconds
        if (errorBorderTimeoutRef.current) {
          clearTimeout(errorBorderTimeoutRef.current);
        }
        errorBorderTimeoutRef.current = setTimeout(() => {
          setError(null);
          setShowErrorBorder(false);
        }, 2000);
      }

      if (filteredValue.length <= length) {
        setValue(filteredValue);
        // Only clear error if we didn't just set it for invalid char
        if (newValue.length === filteredValue.length) {
          setError(null);
        }
      }
    },
    [charset, length, value, triggerErrorFeedback]
  );

  return {
    value,
    error,
    isShaking,
    showErrorBorder,
    lastAttempt,
    lastAttemptIsCorrect,
    isValidLength,
    handleChange,
    handleKeyDown,
    handleSubmit,
    resetError,
  };
}
