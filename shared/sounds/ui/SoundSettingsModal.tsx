"use client";

import type { ChangeEvent } from "react";
import { useSoundSettingsStore } from "../sound-settings-store";
import { soundManager } from "../sound-manager";

type SoundSettingsModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function SoundSettingsModal({ isOpen, onClose }: SoundSettingsModalProps) {
  const bgmEnabled = useSoundSettingsStore((s) => s.bgmEnabled);
  const sfxEnabled = useSoundSettingsStore((s) => s.sfxEnabled);
  const volume = useSoundSettingsStore((s) => s.volume);

  const setBgmEnabled = useSoundSettingsStore((s) => s.setBgmEnabled);
  const setSfxEnabled = useSoundSettingsStore((s) => s.setSfxEnabled);
  const setVolume = useSoundSettingsStore((s) => s.setVolume);

  if (!isOpen) return null;

  const handleVolumeChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newVol = Number(e.target.value);
    setVolume(newVol / 100);
    soundManager.activateFromUserGesture();
  };

  const toggleBgm = () => {
    if (!bgmEnabled) {
      soundManager.activateFromUserGesture();
    }
    setBgmEnabled(!bgmEnabled);
  };

  const toggleSfx = () => {
    if (!sfxEnabled) {
      soundManager.activateFromUserGesture();
    }
    setSfxEnabled(!sfxEnabled);
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-[#1e293b] border border-[#334155] rounded-xl p-6 max-w-sm w-full shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-slate-50 tracking-wide">AUDIO CONFIG</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 transition-colors font-mono"
            aria-label="Close"
          >
            [X]
          </button>
        </div>

        <div className="space-y-6">
          <div>
            <div className="flex justify-between mb-2 items-end">
              <label className="text-sm font-medium text-slate-300">MASTER GAIN</label>
              <span className="text-xs font-mono text-blue-400">
                {Math.round(volume * 100).toString().padStart(3, "0")}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={volume * 100}
              onChange={handleVolumeChange}
              className="w-full h-2 bg-[#0f172a] rounded-lg appearance-none cursor-pointer accent-blue-500 border border-[#334155]"
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-[#0f172a] border border-[#334155] rounded-lg group hover:border-slate-500 transition-colors">
              <span className="text-slate-300 font-medium text-sm">BGM STREAM</span>
              <button
                onClick={toggleBgm}
                className="font-mono text-sm font-bold focus:outline-none"
              >
                {bgmEnabled ? (
                  <span className="text-blue-400">[ON]</span>
                ) : (
                  <span className="text-slate-600">[OFF]</span>
                )}
              </button>
            </div>

            <div className="flex items-center justify-between p-3 bg-[#0f172a] border border-[#334155] rounded-lg group hover:border-slate-500 transition-colors">
              <span className="text-slate-300 font-medium text-sm">SFX MODULE</span>
              <button
                onClick={toggleSfx}
                className="font-mono text-sm font-bold focus:outline-none"
              >
                {sfxEnabled ? (
                  <span className="text-blue-400">[ON]</span>
                ) : (
                  <span className="text-slate-600">[OFF]</span>
                )}
              </button>
            </div>
          </div>
        </div>
        
        <div className="mt-6 pt-4 border-t border-[#334155] flex justify-center">
          <p className="text-[10px] text-slate-500 uppercase tracking-[0.2em] font-mono">
            System Audio Control
          </p>
        </div>
      </div>
    </div>
  );
}
