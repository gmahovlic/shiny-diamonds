import bankJson from "./bank.json";
import type { Rng } from "./rng";

/** Seeds verified offline (scripts/gen-bank.ts) to yield a puzzle with exactly one solution. */
export const BANK: Record<string, number[]> = bankJson;

export const bankKey = (clueCount: number, hard: boolean): string =>
  `${clueCount}:${hard ? "hard" : "normal"}`;

/** Pick a verified seed for this configuration. */
export function pickSeed(rng: Rng, clueCount: number, hard: boolean): number {
  const seeds = BANK[bankKey(clueCount, hard)];
  if (!seeds || seeds.length === 0)
    throw new Error(`no seeds in bank for ${bankKey(clueCount, hard)}`);
  return rng.pick(seeds);
}
