"use client";

/**
 * The plastic clack of a Guess Who window snapping shut, synthesized on the fly:
 * a filtered noise burst for the impact plus a short low body tone. Nothing is
 * downloaded and no audio files ship — the whole kit is maths.
 */

import { createLocalStore } from "./store";

const MUTE_KEY = "roster-royale.muted.v1";

type Voice = "pick" | "flip" | "slam" | "win";

/** Same store shape as the series tally, so the toggle survives a reload. */
export const mutedStore = createLocalStore<boolean>(MUTE_KEY, false, (parsed) =>
  typeof parsed === "boolean" ? parsed : null,
);

let context: AudioContext | null = null;
let noise: AudioBuffer | null = null;

function ensureContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (context) return context;

  const Ctor = window.AudioContext ?? (window as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;

  // Safe here because every call site is downstream of a click.
  context = new Ctor();
  return context;
}

function noiseBuffer(ctx: AudioContext): AudioBuffer {
  if (noise) return noise;
  const length = Math.floor(ctx.sampleRate * 0.08);
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
  noise = buffer;
  return buffer;
}

export function isMuted(): boolean {
  return mutedStore.read();
}

export function setMuted(muted: boolean): void {
  mutedStore.write(muted);
}

const VOICES: Record<Voice, { band: number; q: number; body: number; decay: number; level: number }> = {
  // Drafting: a crisp mid clack.
  pick: { band: 1900, q: 1.4, body: 190, decay: 0.09, level: 0.5 },
  // Reveal: brighter and shorter, so a cascade of eight doesn't turn to mud.
  flip: { band: 2600, q: 1.8, body: 240, decay: 0.07, level: 0.42 },
  // The losing tray slamming shut: lower and heavier.
  slam: { band: 900, q: 1.0, body: 110, decay: 0.16, level: 0.6 },
  // Winner: the body tone rings a little longer, an octave up.
  win: { band: 2200, q: 2.2, body: 380, decay: 0.4, level: 0.4 },
};

export function play(voice: Voice, muted = isMuted()): void {
  if (muted) return;
  const ctx = ensureContext();
  if (!ctx) return;
  if (ctx.state === "suspended") void ctx.resume();

  const spec = VOICES[voice];
  const now = ctx.currentTime;

  const out = ctx.createGain();
  out.gain.value = spec.level;
  out.connect(ctx.destination);

  // Impact: noise through a bandpass, decaying fast.
  const burst = ctx.createBufferSource();
  burst.buffer = noiseBuffer(ctx);
  const band = ctx.createBiquadFilter();
  band.type = "bandpass";
  band.frequency.value = spec.band;
  band.Q.value = spec.q;
  const burstGain = ctx.createGain();
  burstGain.gain.setValueAtTime(1, now);
  burstGain.gain.exponentialRampToValueAtTime(0.001, now + spec.decay);
  burst.connect(band).connect(burstGain).connect(out);
  burst.start(now);
  burst.stop(now + spec.decay + 0.02);

  // Body: the hollow plastic tone underneath the impact.
  const tone = ctx.createOscillator();
  tone.type = "triangle";
  tone.frequency.setValueAtTime(spec.body, now);
  tone.frequency.exponentialRampToValueAtTime(spec.body * 0.6, now + spec.decay);
  const toneGain = ctx.createGain();
  toneGain.gain.setValueAtTime(0.5, now);
  toneGain.gain.exponentialRampToValueAtTime(0.001, now + spec.decay);
  tone.connect(toneGain).connect(out);
  tone.start(now);
  tone.stop(now + spec.decay + 0.02);
}
