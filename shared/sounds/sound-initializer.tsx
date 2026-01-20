"use client";

import { useEffect } from "react";
import { useSoundSettingsStore } from "./sound-settings-store";
import { soundManager } from "./sound-manager";

export function SoundInitializer() {
  const bgmEnabled = useSoundSettingsStore((s) => s.bgmEnabled);
  const sfxEnabled = useSoundSettingsStore((s) => s.sfxEnabled);
  const volume = useSoundSettingsStore((s) => s.volume);

  useEffect(() => {
    soundManager.syncSettings({ bgmEnabled, sfxEnabled, volume });
  }, [bgmEnabled, sfxEnabled, volume]);

  return null;
}
