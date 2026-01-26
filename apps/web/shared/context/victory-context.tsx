"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

type VictoryInfo = {
  blockId: number;
  winnerNickname: string;
};

type VictoryContextValue = {
  victory: VictoryInfo | null;
  isVisible: boolean;
  show: (info: VictoryInfo) => void;
  hide: () => void;
};

const VictoryContext = createContext<VictoryContextValue | null>(null);

export function VictoryProvider({ children }: { children: ReactNode }) {
  const [victory, setVictory] = useState<VictoryInfo | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  const show = useCallback((info: VictoryInfo) => {
    setVictory(info);
    setIsVisible(true);
  }, []);

  const hide = useCallback(() => {
    setIsVisible(false);
  }, []);

  return (
    <VictoryContext.Provider value={{ victory, isVisible, show, hide }}>
      {children}
    </VictoryContext.Provider>
  );
}

export function useVictory() {
  const context = useContext(VictoryContext);
  if (!context) {
    throw new Error("useVictory must be used within VictoryProvider");
  }
  return context;
}
