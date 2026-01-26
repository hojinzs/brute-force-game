"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { filterAllowedChars, createPasswordSchema, type CharsetType } from "@/shared/lib/charset";
import { emitSoundEvent, SOUND_EVENTS } from "@/shared/sounds";

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
  isCracking: boolean;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSubmit: () => void;
  resetError: () => void;
};

const SHAKE_DURATION_MS = 400;
const ERROR_BORDER_DURATION_MS = 300;
const ERROR_MESSAGE_DURATION_MS = 2000;

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

  useEffect(() => {
    return () => {
      if (shakeTimeoutRef.current) {
        clearTimeout(shakeTimeoutRef.current);
      }
      if (errorBorderTimeoutRef.current) {
        clearTimeout(errorBorderTimeoutRef.current);
      }
    };
  }, []);

  const [isCracking, setIsCracking] = useState(false);

  const handleSubmit = useCallback(() => {
    if (disabled || isCracking) return;

    setError(null);

    const result = passwordSchema.safeParse(value);

    if (!result.success) {
      const errorMessage = result.error.issues[0]?.message || "Invalid password";
      setError(errorMessage);
      triggerErrorFeedback();
      return;
    }

    setIsCracking(true);

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
            emitSoundEvent(SOUND_EVENTS.wrongAnswer);
            triggerErrorFeedback();
          }
        }
        setValue("");
      } catch (submitError: unknown) {
        const errorMessage =
          submitError instanceof Error ? submitError.message : String(submitError || "");
        setError(errorMessage || "Failed to submit answer. Please try again.");
        triggerErrorFeedback();
      } finally {
        setIsCracking(false);
      }
    })();
  }, [disabled, isCracking, passwordSchema, value, onSubmit]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      const filteredValue = filterAllowedChars(newValue, charset);

      // Check if characters were filtered out (length mismatch)
      // Ignore if deleting (newValue length is shorter than current value)
      if (newValue.length > filteredValue.length && newValue.length >= value.length) {
        setError("Invalid character");
        emitSoundEvent(SOUND_EVENTS.invalidChar);
        triggerErrorFeedback();
        
        // Clear error after 2 seconds
        if (errorBorderTimeoutRef.current) {
          clearTimeout(errorBorderTimeoutRef.current);
        }
        errorBorderTimeoutRef.current = setTimeout(() => {
          setError(null);
          setShowErrorBorder(false);
        }, ERROR_MESSAGE_DURATION_MS);
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
    isCracking,
    handleChange,
    handleSubmit,
    resetError,
  };
}
