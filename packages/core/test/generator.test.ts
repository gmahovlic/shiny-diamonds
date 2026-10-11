import { describe, expect, it } from "vitest";
import { BANK, bankKey } from "../src/bank";
import { clueId, solve } from "../src/clues";
import { clueCountFor, generate, seatClues } from "../src/generator";
import { CELLS } from "../src/hex";
import { generateMap } from "../src/mapgen";
import { Rng } from "../src/rng";
import { colorsInPlay, TERRAINS } from "../src/types";

describe("generateMap", () => {
  it("fills every cell, places all structures off the sea", () => {
    const map = generateMap(new Rng(3), true);
    expect(map.terrain.length).toBe(CELLS);
    for (const t of TERRAINS)
      expect(map.terrain.filter((x) => x === t).length).toBeGreaterThanOrEqual(10);
    expect(map.structures.length).toBe(colorsInPlay(true).length * 2);
    for (const s of map.structures) expect(map.terrain[s.cell]).not.toBe("sea");
    expect(map.territory.filter((t) => t === "gulls").length).toBeGreaterThanOrEqual(4);
    expect(map.territory.filter((t) => t === "crabs").length).toBeGreaterThanOrEqual(4);
  });
});

describe("generate", () => {
  it("is deterministic", () => {
    const a = generate(11, 4, false);
    const b = generate(11, 4, false);
    expect(a).toEqual(b);
  });

  it("yields exactly one solution with all clues necessary", () => {
    let found = 0;
    for (let seed = 1; seed < 40 && found < 5; seed++) {
      const p = generate(seed, 3, false);
      if (!p) continue;
      found++;
      expect(solve(p.clues, p.map)).toEqual([p.solution]);
      for (let i = 0; i < p.clues.length; i++) {
        const without = p.clues.filter((_, j) => j !== i);
        expect(solve(without, p.map).length).toBeGreaterThan(1);
      }
      expect(new Set(p.clues.map(clueId)).size).toBe(p.clues.length);
    }
    expect(found).toBe(5);
  });

  it("maps player counts to clue slots and seats", () => {
    expect(clueCountFor(2)).toBe(4);
    expect(clueCountFor(3)).toBe(3);
    expect(clueCountFor(5)).toBe(5);
    expect(() => clueCountFor(6)).toThrow();
    const p = generate(BANK[bankKey(4, false)]?.[0] as number, 4, false);
    if (!p) throw new Error("bank seed failed");
    expect(seatClues(p, 2).map((s) => s.length)).toEqual([2, 2]);
    expect(seatClues(p, 4).map((s) => s.length)).toEqual([1, 1, 1, 1]);
  });
});

describe("seed bank", () => {
  it("has every configuration and every seed produces a unique-solution puzzle", () => {
    for (const hard of [false, true]) {
      for (const clueCount of [3, 4, 5]) {
        const seeds = BANK[bankKey(clueCount, hard)];
        expect(seeds?.length).toBeGreaterThanOrEqual(100);
        for (const seed of seeds as number[]) {
          const p = generate(seed, clueCount, hard);
          expect(p, `seed ${seed} ${bankKey(clueCount, hard)}`).not.toBeNull();
          expect(
            solve((p as NonNullable<typeof p>).clues, (p as NonNullable<typeof p>).map),
          ).toEqual([(p as NonNullable<typeof p>).solution]);
        }
      }
    }
  }, 60_000);
});
