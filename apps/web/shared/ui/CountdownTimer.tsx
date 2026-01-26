"use client";

import { useState, useEffect } from "react";

type CountdownTimerProps = {
  targetTime: string;
  totalSeconds: number;
  onComplete?: () => void;
  children?: (timeLeft: number, progress: number) => React.ReactNode;
};

export function useCountdown(targetTime: string, totalSeconds: number) {
  const [timeLeft, setTimeLeft] = useState(() => {
    const elapsed = Math.floor(
      (Date.now() - new Date(targetTime).getTime()) / 1000
    );
    return Math.max(0, totalSeconds - elapsed);
  });

  useEffect(() => {
    const targetMs = new Date(targetTime).getTime();

    const interval = setInterval(() => {
      const now = Date.now();
      const elapsed = Math.floor((now - targetMs) / 1000);
      const remaining = Math.max(0, totalSeconds - elapsed);

      setTimeLeft(remaining);

      if (remaining === 0) {
        clearInterval(interval);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [targetTime, totalSeconds]);

  const progress = (timeLeft / totalSeconds) * 100;

  return { timeLeft, progress };
}

export function CountdownTimer({
  targetTime,
  totalSeconds,
  onComplete,
  children,
}: CountdownTimerProps) {
  const { timeLeft, progress } = useCountdown(targetTime, totalSeconds);

  useEffect(() => {
    if (timeLeft === 0 && onComplete) {
      onComplete();
    }
  }, [timeLeft, onComplete]);

  if (children) {
    return <>{children(timeLeft, progress)}</>;
  }

  return (
    <div className="inline-block px-6 py-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
      <p className="text-amber-400 font-mono text-2xl font-bold">{timeLeft}s</p>
      <p className="text-amber-300/70 text-sm">remaining</p>
    </div>
  );
}
