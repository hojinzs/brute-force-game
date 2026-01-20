"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

const STORAGE_KEY = "brute-force-sound";
const EXPIRY_DAYS = 3;
const EXPIRY_MS = EXPIRY_DAYS * 24 * 60 * 60 * 1000;

type SoundSettingsState = {
  bgmEnabled: boolean;
  sfxEnabled: boolean;
  volume: number;
  masterMuted: boolean;
  lastUpdated: number;
};

type SoundSettingsActions = {
  setBgmEnabled: (enabled: boolean) => void;
  setSfxEnabled: (enabled: boolean) => void;
  setVolume: (volume: number) => void;
  setMasterMuted: (muted: boolean) => void;
  toggleMasterMute: () => void;
  touch: () => void;
  reset: () => void;
};

const DEFAULT_SETTINGS: SoundSettingsState = {
  bgmEnabled: false,
  sfxEnabled: false,
  volume: 0.5,
  masterMuted: false,
  lastUpdated: 0,
};

function isExpired(lastUpdated: number) {
  if (!lastUpdated) return true;
  return Date.now() - lastUpdated > EXPIRY_MS;
}

export const useSoundSettingsStore = create<SoundSettingsState & SoundSettingsActions>()(
  persist(
    (set) => ({
      ...DEFAULT_SETTINGS,
      setBgmEnabled: (enabled) =>
        set({
          bgmEnabled: enabled,
          lastUpdated: Date.now(),
        }),
      setSfxEnabled: (enabled) =>
        set({
          sfxEnabled: enabled,
          lastUpdated: Date.now(),
        }),
      setVolume: (volume) =>
        set({
          volume,
          lastUpdated: Date.now(),
        }),
      setMasterMuted: (muted) =>
        set({
          masterMuted: muted,
          lastUpdated: Date.now(),
        }),
      toggleMasterMute: () =>
        set((state) => ({
          masterMuted: !state.masterMuted,
          lastUpdated: Date.now(),
        })),
      touch: () => set({ lastUpdated: Date.now() }),
      reset: () => set({ ...DEFAULT_SETTINGS }),
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        if (isExpired(state.lastUpdated)) {
          useSoundSettingsStore.getState().reset();
          localStorage.removeItem(STORAGE_KEY);
          return;
        }
        useSoundSettingsStore.getState().touch();
      },
    }
  )
);
