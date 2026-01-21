"use client";

import { useState } from "react";
import { useSoundSettingsStore } from "../sound-settings-store";
import { SoundSettingsModal } from "./SoundSettingsModal";

export function SoundControlFAB() {
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const masterMuted = useSoundSettingsStore((s) => s.masterMuted);
    const toggleMasterMute = useSoundSettingsStore((s) => s.toggleMasterMute);

    return (
        <>
            <div className="fixed bottom-6 left-6 z-40 flex flex-col gap-3">
                {/* Toggle Mute FAB */}
                <button
                    onClick={toggleMasterMute}
                    className={`
            w-12 h-12 rounded-full backdrop-blur-md border shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95
            ${masterMuted
                            ? "bg-slate-900/80 border-slate-700 text-slate-400 hover:bg-slate-800/80"
                            : "bg-blue-500/10 border-blue-500/30 text-blue-400 hover:bg-blue-500/20"}
          `}
                    aria-label={masterMuted ? "Unmute" : "Mute"}
                >
                    {masterMuted ? (
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                            <line x1="23" y1="1" x2="1" y2="23" />
                        </svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                            <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                            <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                        </svg>
                    )}
                </button>

                {/* Open Settings FAB */}
                <button
                    onClick={() => setIsSettingsOpen(true)}
                    className="w-12 h-12 rounded-full bg-slate-800/80 backdrop-blur-md border border-slate-700 shadow-lg flex items-center justify-center text-slate-300 hover:bg-slate-700/80 hover:text-white transition-all duration-200 hover:scale-105 active:scale-95"
                    aria-label="Sound Settings"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="3" />
                        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                    </svg>
                </button>
            </div>

            <SoundSettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
        </>
    );
}
