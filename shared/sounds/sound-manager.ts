"use client";
import { SFX_PRESETS, type SfxPresetKey } from "./assets/zzfx-presets";
import { SOUND_EVENTS } from "./sound-events";

export type SoundSettings = {
  bgmEnabled: boolean;
  sfxEnabled: boolean;
  volume: number;
};

class SoundManager {
  private bgmElement: HTMLAudioElement | null = null;
  private pendingBgmPlay = false;
  private bgmEnabled = false;
  private sfxEnabled = false;
  private volume = 0.5;
  private eventAbortController: AbortController | null = null;
  private zzfxModulePromise: Promise<{
    zzfx: (...parameters: Array<number | undefined>) => AudioBufferSourceNode;
    ZZFX: { volume: number; audioContext: AudioContext };
  }> | null = null;

  constructor() {
    if (typeof window !== "undefined") {
      this.bindEventListeners();
    }
  }

  private bindEventListeners() {
    this.eventAbortController?.abort();
    this.eventAbortController = new AbortController();
    const { signal } = this.eventAbortController;

    window.addEventListener(
      SOUND_EVENTS.wrongAnswer,
      () => {
      this.playSfx("wrongAnswer");
      },
      { signal }
    );
    window.addEventListener(
      SOUND_EVENTS.invalidChar,
      () => {
      this.playSfx("invalidChar");
      },
      { signal }
    );
    window.addEventListener(
      SOUND_EVENTS.topAttempt,
      () => {
      this.playSfx("topAttempt");
      },
      { signal }
    );
  }

  dispose() {
    this.eventAbortController?.abort();
    this.eventAbortController = null;
  }

  private loadZzfx() {
    if (!this.zzfxModulePromise) {
      this.zzfxModulePromise = import("zzfx") as Promise<{
        zzfx: (...parameters: Array<number | undefined>) => AudioBufferSourceNode;
        ZZFX: { volume: number; audioContext: AudioContext };
      }>;
    }
    return this.zzfxModulePromise;
  }

  private ensureBgmElement() {
    if (this.bgmElement) return;
    this.bgmElement = new Audio("/sounds/background.mp3");
    this.bgmElement.loop = true;
    this.bgmElement.volume = this.volume;
  }

  activateFromUserGesture() {
    void (async () => {
      const { ZZFX } = await this.loadZzfx();
      void ZZFX.audioContext.resume();
      this.ensureBgmElement();
      if (this.bgmEnabled || this.pendingBgmPlay) {
        this.playBgm();
      }
    })();
  }

  syncSettings(settings: SoundSettings) {
    this.bgmEnabled = settings.bgmEnabled;
    this.sfxEnabled = settings.sfxEnabled;
    this.volume = settings.volume;

    if (this.bgmElement) {
      this.bgmElement.volume = settings.volume;
    }

    void (async () => {
      const { ZZFX } = await this.loadZzfx();
      ZZFX.volume = settings.volume;
      if (this.bgmEnabled) {
        this.playBgm();
      } else {
        this.pauseBgm();
      }
    })();
  }

  private playBgm() {
    this.ensureBgmElement();
    if (!this.bgmElement) return;

    const playPromise = this.bgmElement.play();
    if (
      playPromise &&
      typeof playPromise.then === "function" &&
      typeof playPromise.catch === "function"
    ) {
      playPromise
        .then(() => {
          this.pendingBgmPlay = false;
        })
        .catch(() => {
          this.pendingBgmPlay = true;
        });
      return;
    }
    this.pendingBgmPlay = false;
  }

  private pauseBgm() {
    if (this.bgmElement) {
      this.bgmElement.pause();
    }
    this.pendingBgmPlay = false;
  }

  private playSfx(preset: SfxPresetKey) {
    if (!this.sfxEnabled) return;
    void (async () => {
      const { ZZFX, zzfx } = await this.loadZzfx();
      if (ZZFX.audioContext.state !== "running") return;
      zzfx(...SFX_PRESETS[preset]);
    })();
  }
}

export const soundManager = new SoundManager();
