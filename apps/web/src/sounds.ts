import { signal } from "@preact/signals";

/** Tiny synthesized sound effects (no audio assets). Muted by default until the user opts in. */
const KEY = "sd:sound";
export const soundOn = signal<boolean>(read());

function read(): boolean {
  try {
    return localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

export function toggleSound(): void {
  soundOn.value = !soundOn.value;
  try {
    localStorage.setItem(KEY, soundOn.value ? "1" : "0");
  } catch {
    // ignore
  }
  if (soundOn.value) play("tap");
}

let ctx: AudioContext | null = null;
function audio(): AudioContext | null {
  if (typeof AudioContext === "undefined") return null;
  if (!ctx) ctx = new AudioContext();
  if (ctx.state === "suspended") ctx.resume().catch(() => {});
  return ctx;
}

type Fx = "tap" | "yes" | "no" | "turn" | "found";

function tone(
  ac: AudioContext,
  freq: number,
  start: number,
  dur: number,
  type: OscillatorType,
  gain = 0.12,
): void {
  const o = ac.createOscillator();
  const g = ac.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, start);
  g.gain.setValueAtTime(0.0001, start);
  g.gain.exponentialRampToValueAtTime(gain, start + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  o.connect(g).connect(ac.destination);
  o.start(start);
  o.stop(start + dur + 0.02);
}

export function play(fx: Fx): void {
  if (!soundOn.value) return;
  const ac = audio();
  if (!ac) return;
  const now = ac.currentTime;
  switch (fx) {
    case "tap":
      tone(ac, 660, now, 0.06, "triangle", 0.08);
      break;
    case "yes":
      tone(ac, 523, now, 0.12, "triangle");
      tone(ac, 784, now + 0.1, 0.18, "triangle");
      break;
    case "no":
      tone(ac, 220, now, 0.14, "square", 0.08);
      tone(ac, 165, now + 0.12, 0.2, "square", 0.08);
      break;
    case "turn":
      tone(ac, 880, now, 0.08, "sine");
      tone(ac, 1175, now + 0.09, 0.12, "sine");
      break;
    case "found":
      for (const [i, f] of [523, 659, 784, 1047, 1319].entries()) {
        tone(ac, f, now + i * 0.09, 0.25, "triangle", 0.14);
      }
      tone(ac, 1568, now + 0.5, 0.5, "sine", 0.12);
      break;
  }
}
