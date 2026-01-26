"use client";

export const SOUND_EVENTS = {
  wrongAnswer: "sound:wrongAnswer",
  invalidChar: "sound:invalidChar",
  topAttempt: "sound:topAttempt",
} as const;

export type SoundEvent = (typeof SOUND_EVENTS)[keyof typeof SOUND_EVENTS];

export function emitSoundEvent(event: SoundEvent) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(event));
}
