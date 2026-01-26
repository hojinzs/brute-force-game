"use client";
import { SFX_PRESETS, type SfxPresetKey } from "./assets/zzfx-presets";
import { SOUND_EVENTS } from "./sound-events";

export type SoundSettings = {
  volume: number;
  bgmVolume: number;
  sfxVolume: number;
};

class SoundManager {
  private bgmElement: HTMLAudioElement | null = null;
  private pendingBgmPlay = false;

  private volume = 0.5;
  private bgmVolume = 0.5;
  private sfxVolume = 0.5;
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
    this.bgmElement.volume = this.volume * this.bgmVolume;
  }

  activateFromUserGesture() {
    void (async () => {
      const { ZZFX } = await this.loadZzfx();
      void ZZFX.audioContext.resume();
      this.ensureBgmElement();
      if (this.pendingBgmPlay || (this.volume > 0 && this.bgmVolume > 0)) {
        this.playBgm();
      }
    })();
  }

  syncSettings(settings: SoundSettings) {
    this.volume = settings.volume;
    this.bgmVolume = settings.bgmVolume;
    this.sfxVolume = settings.sfxVolume;

    if (this.bgmElement) {
      this.bgmElement.volume = settings.volume * settings.bgmVolume;
    }

    void (async () => {
      // ZZFX.volume is a global gain applied to all zzfx-generated sounds.
      // In this manager we treat it as (master volume * SFX volume) so that:
      // - BGM loudness is controlled via the HTMLAudioElement (bgmElement), and
      // - SFX loudness is controlled via ZZFX.volume (set in playSfx before playing).

      if (this.bgmVolume > 0 && this.volume > 0) {
        this.playBgm();
      } else {
        this.pauseBgm();
      }
    })();
  }

  private playBgm() {
    this.ensureBgmElement();
    if (!this.bgmElement) return;

    // Update volume just in case
    this.bgmElement.volume = this.volume * this.bgmVolume;

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
    if (this.sfxVolume <= 0 || this.volume <= 0) return;
    void (async () => {
      const { ZZFX, zzfx } = await this.loadZzfx();
      if (ZZFX.audioContext.state !== "running") return;

      // Force volume update before playing
      ZZFX.volume = this.volume * this.sfxVolume;

      zzfx(...SFX_PRESETS[preset]);
    })();
  }
}

export const soundManager = new SoundManager();
