"use client";

import { useSoundSettingsStore } from "../sound-settings-store";

type SoundButtonProps = {
  onClick: () => void;
};

export function SoundButton({ onClick }: SoundButtonProps) {
  const bgmEnabled = useSoundSettingsStore((s) => s.bgmEnabled);
  const sfxEnabled = useSoundSettingsStore((s) => s.sfxEnabled);
  const masterMuted = useSoundSettingsStore((s) => s.masterMuted);

  // Consider sound on if either channel is enabled AND not globally muted
  const isSoundOn = (bgmEnabled || sfxEnabled) && !masterMuted;

  return (
    <button
      onClick={onClick}
      className={`p-2 rounded-lg transition-colors ${
        isSoundOn 
          ? "text-blue-400 hover:text-blue-300 bg-blue-500/10 hover:bg-blue-500/20" 
          : "text-slate-500 hover:text-slate-400"
      }`}
      aria-label={isSoundOn ? "Mute Sound" : "Unmute Sound"}
    >
      {isSoundOn ? (
        // Speaker ON Icon
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
        </svg>
      ) : (
        // Speaker OFF Icon
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
          <line x1="23" x2="1" y1="1" y2="23" />
        </svg>
      )}
    </button>
  );
}
