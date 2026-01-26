"use client";

import { useEffect } from "react";
import { useSoundSettingsStore } from "./sound-settings-store";
import { soundManager } from "./sound-manager";

export function SoundInitializer() {

  const volume = useSoundSettingsStore((s) => s.volume);
  const bgmVolume = useSoundSettingsStore((s) => s.bgmVolume);
  const sfxVolume = useSoundSettingsStore((s) => s.sfxVolume);
  const masterMuted = useSoundSettingsStore((s) => s.masterMuted);

  useEffect(() => {
    soundManager.syncSettings({
      volume: masterMuted ? 0 : volume,
      bgmVolume,
      sfxVolume,
    });
  }, [volume, bgmVolume, sfxVolume, masterMuted]);

  return null;
}
