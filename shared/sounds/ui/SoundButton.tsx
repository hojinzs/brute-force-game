"use client";

import { useSoundSettingsStore } from "../sound-settings-store";

type SoundButtonProps = {
  onClick: () => void;
};

export function SoundButton({ onClick }: SoundButtonProps) {
  const bgmEnabled = useSoundSettingsStore((s) => s.bgmEnabled);
  const sfxEnabled = useSoundSettingsStore((s) => s.sfxEnabled);

  const isSoundOn = bgmEnabled || sfxEnabled;

  return (
    <button
      onClick={onClick}
      className="px-3 py-2 text-slate-400 hover:text-slate-200 text-sm font-bold font-mono transition-colors tracking-tight"
      aria-label="Sound Settings"
    >
      {isSoundOn ? "[VOL]" : "[MUT]"}
    </button>
  );
}
