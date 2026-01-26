"use client";

import { useEffect, type ChangeEvent } from "react";
import { useSoundSettingsStore } from "../sound-settings-store";
import { soundManager } from "../sound-manager";

type SoundSettingsModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function SoundSettingsModal({ isOpen, onClose }: SoundSettingsModalProps) {
  const volume = useSoundSettingsStore((s) => s.volume);
  const bgmVolume = useSoundSettingsStore((s) => s.bgmVolume);
  const sfxVolume = useSoundSettingsStore((s) => s.sfxVolume);
  const masterMuted = useSoundSettingsStore((s) => s.masterMuted);

  const setVolume = useSoundSettingsStore((s) => s.setVolume);
  const setBgmVolume = useSoundSettingsStore((s) => s.setBgmVolume);
  const setSfxVolume = useSoundSettingsStore((s) => s.setSfxVolume);
  const toggleMasterMute = useSoundSettingsStore((s) => s.toggleMasterMute);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleVolumeChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newVol = Number(e.target.value);
    setVolume(newVol / 100);
    // Only play sound if not muted
    if (!masterMuted) {
      soundManager.activateFromUserGesture();
    }
  };

  const handleBgmVolumeChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newVol = Number(e.target.value);
    setBgmVolume(newVol / 100);
    if (!masterMuted) {
      soundManager.activateFromUserGesture();
    }
  }

  const handleSfxVolumeChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newVol = Number(e.target.value);
    setSfxVolume(newVol / 100);
    if (!masterMuted) {
      soundManager.activateFromUserGesture();
    }
  }



  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-[#0f172a] border border-[#334155] rounded-xl overflow-hidden max-w-sm w-full shadow-2xl ring-1 ring-white/10"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="bg-[#1e293b] p-4 flex justify-between items-center border-b border-[#334155]">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            <h2 className="text-sm font-bold text-slate-200 tracking-widest font-mono">
              AUDIO_CONFIG
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
            aria-label="Close"
          >
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
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-8">
          {/* Master Mute Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-slate-200 font-bold tracking-wide">MASTER AUDIO</span>
              <span className="text-xs text-slate-500 font-mono">GLOBAL SYSTEM SOUND</span>
            </div>
            <button
              onClick={toggleMasterMute}
              aria-label="Toggle master audio"
              aria-pressed={masterMuted}
              className={`
                relative w-12 h-6 rounded-full transition-colors duration-200 ease-in-out focus:outline-none ring-offset-2 ring-offset-[#0f172a] focus:ring-2 focus:ring-blue-500
                ${!masterMuted ? "bg-blue-600" : "bg-slate-700"}
              `}
            >
              <span
                className={`
                  absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform duration-200
                  ${!masterMuted ? "translate-x-6" : "translate-x-0"}
                `}
              />
            </button>
          </div>

          <div className={`space-y-6 transition-opacity duration-200 ${masterMuted ? "opacity-50 pointer-events-none" : ""}`}>
            {/* Volume Slider */}
            <div className="space-y-3">
              <div className="flex justify-between items-end">
                <label
                  className="text-xs font-bold text-slate-400 font-mono tracking-wider"
                  htmlFor="master-gain"
                >
                  MASTER GAIN
                </label>
                <span className="text-xs font-mono text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded">
                  {Math.round(volume * 100).toString().padStart(3, "0")}%
                </span>
              </div>
              <input
                id="master-gain"
                type="range"
                min="0"
                max="100"
                value={volume * 100}
                onChange={handleVolumeChange}
                disabled={masterMuted}
                aria-valuetext={`${Math.round(volume * 100)}%`}
                className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500 hover:accent-blue-400"
              />
            </div>

            {/* BGM Volume Slider */}
            <div className="space-y-3">
              <div className="flex justify-between items-end">
                <label
                  className="text-xs font-bold text-slate-400 font-mono tracking-wider"
                  htmlFor="bgm-gain"
                >
                  BGM GAIN
                </label>
                <span className="text-xs font-mono text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded">
                  {Math.round(bgmVolume * 100).toString().padStart(3, "0")}%
                </span>
              </div>
              <input
                id="bgm-gain"
                type="range"
                min="0"
                max="100"
                value={bgmVolume * 100}
                onChange={handleBgmVolumeChange}
                disabled={masterMuted}
                aria-valuetext={`${Math.round(bgmVolume * 100)}%`}
                className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500 hover:accent-blue-400"
              />
            </div>

            {/* SFX Volume Slider */}
            <div className="space-y-3">
              <div className="flex justify-between items-end">
                <label
                  className="text-xs font-bold text-slate-400 font-mono tracking-wider"
                  htmlFor="sfx-gain"
                >
                  SFX GAIN
                </label>
                <span className="text-xs font-mono text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded">
                  {Math.round(sfxVolume * 100).toString().padStart(3, "0")}%
                </span>
              </div>
              <input
                id="sfx-gain"
                type="range"
                min="0"
                max="100"
                value={sfxVolume * 100}
                onChange={handleSfxVolumeChange}
                disabled={masterMuted}
                aria-valuetext={`${Math.round(sfxVolume * 100)}%`}
                className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500 hover:accent-blue-400"
              />
            </div>

            {/* Individual Toggles */}

          </div>

        </div>

        {/* Footer */}
        <div className="bg-[#1e293b] p-3 border-t border-[#334155] flex justify-between items-center text-[10px] text-slate-500 font-mono">
          <span>SYSTEM_AUDIO_CTL</span>
          <span className={masterMuted ? "text-red-400" : "text-emerald-500"}>
            STATUS: {masterMuted ? "MUTED" : "ACTIVE"}
          </span>
        </div>
      </div>
    </div>
  );
}
