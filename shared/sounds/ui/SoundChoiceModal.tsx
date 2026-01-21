"use client";

import { useEffect, useState } from "react";
import { useSoundSettingsStore } from "../sound-settings-store";
import { soundManager } from "../sound-manager";

export function SoundChoiceModal() {
  const [isOpen, setIsOpen] = useState(false);
  const setMasterMuted = useSoundSettingsStore((s) => s.setMasterMuted);

  useEffect(() => {
    // Show modal on mount (initial entry)
    // We can add logic here to check if we should show it (e.g. session storage)
    // For now, based on requirements, we show it on entry.
    // To prevent hydration mismatch or flashing, we can wait a tick or use a flag.
    const hasChosen = sessionStorage.getItem("bf-sound-chosen");
    if (!hasChosen) {
      setIsOpen(true);
    }
  }, []);

  const handleSoundOn = () => {
    soundManager.activateFromUserGesture();
    setMasterMuted(false);
    completeChoice();
  };

  const handleSoundOff = () => {
    // Ensure muted/disabled
    setMasterMuted(true);
    completeChoice();
  };

  const completeChoice = () => {
    setIsOpen(false);
    sessionStorage.setItem("bf-sound-chosen", "true");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300">
      <div className="max-w-md w-full bg-[#0f172a] border border-[#334155] rounded-2xl p-6 md:p-8 space-y-8 shadow-2xl relative overflow-hidden">
        {/* Background Effect */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-50" />

        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-white tracking-tight">Audio Experience</h2>
          <p className="text-slate-400 text-sm">
            This game features dedicated BGM and SFX.<br />
            Turn on sound for the best immersion.
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <button
            onClick={handleSoundOn}
            className="flex-1 group relative overflow-hidden p-6 rounded-xl border border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/20 hover:border-blue-500/60 transition-all duration-300"
          >
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 group-hover:scale-110 group-hover:bg-blue-500 group-hover:text-white transition-all duration-300">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                  <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                </svg>
              </div>
              <span className="font-bold text-blue-100 group-hover:text-white">SOUND ON</span>
            </div>
          </button>

          <button
            onClick={handleSoundOff}
            className="flex-1 group relative overflow-hidden p-6 rounded-xl border border-slate-700 bg-slate-800/30 hover:bg-slate-800/50 hover:border-slate-600 transition-all duration-300"
          >
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-slate-700/50 flex items-center justify-center text-slate-400 group-hover:scale-110 group-hover:bg-slate-700 group-hover:text-slate-200 transition-all duration-300">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                  <line x1="23" y1="1" x2="1" y2="23" />
                </svg>
              </div>
              <span className="font-bold text-slate-400 group-hover:text-slate-300">SOUND OFF</span>
            </div>
          </button>
        </div>

        <p className="text-center text-xs text-slate-600 font-mono">
          You can change this anytime in settings.
        </p>
      </div>
    </div>
  );
}
