/**
 * Scans seeds and stores the ones that generate a valid puzzle (exactly one solution,
 * every clue necessary) for each (clueCount, hard) configuration.
 *
 * Usage: pnpm gen-bank [perConfig=300]
 */
import { writeFileSync } from "node:fs";
import { bankKey, generate, solve } from "../packages/core/src/index";

const perConfig = Number(process.argv[2] ?? 300);
const bank: Record<string, number[]> = {};

for (const hard of [false, true]) {
  for (const clueCount of [3, 4, 5]) {
    const key = bankKey(clueCount, hard);
    const seeds: number[] = [];
    let seed = 1;
    const t0 = performance.now();
    while (seeds.length < perConfig) {
      const puzzle = generate(seed, clueCount, hard);
      if (puzzle) {
        if (solve(puzzle.clues, puzzle.map).length !== 1)
          throw new Error(`seed ${seed}: not unique`);
        seeds.push(seed);
      }
      seed++;
    }
    bank[key] = seeds;
    const ms = Math.round(performance.now() - t0);
    console.log(`${key}: ${seeds.length} seeds from ${seed - 1} tried (${ms} ms)`);
  }
}

writeFileSync(
  new URL("../packages/core/src/bank.json", import.meta.url),
  `${JSON.stringify(bank)}\n`,
);
console.log("wrote packages/core/src/bank.json");
