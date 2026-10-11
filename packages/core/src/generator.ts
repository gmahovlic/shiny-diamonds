import { clueCatalog, clueId, clueMask } from "./clues";
import { CELLS, type Cell } from "./hex";
import { generateMap } from "./mapgen";
import { Rng } from "./rng";
import type { Clue, Puzzle } from "./types";

const CLUE_SET_ATTEMPTS = 300;

/** Number of clue slots for a player count: 2 players share 4 clues (2 each). */
export function clueCountFor(players: number): number {
  if (players < 2 || players > 5) throw new Error(`unsupported player count: ${players}`);
  return players === 2 ? 4 : players;
}

/** Split puzzle clues across seats. */
export function seatClues(puzzle: Puzzle, players: number): Clue[][] {
  if (players === 2) {
    return [puzzle.clues.slice(0, 2), puzzle.clues.slice(2, 4)];
  }
  return puzzle.clues.map((c) => [c]);
}

function intersectionSize(masks: readonly boolean[][], skip: number): number {
  let n = 0;
  for (let c = 0; c < CELLS; c++) {
    let ok = true;
    for (let i = 0; i < masks.length; i++) {
      if (i === skip) continue;
      if (!(masks[i] as boolean[])[c]) {
        ok = false;
        break;
      }
    }
    if (ok) n++;
  }
  return n;
}

/**
 * Deterministically build a puzzle from a seed, or return null when this seed doesn't yield
 * a clue set with exactly one solution where every clue is necessary.
 * The offline seed bank keeps only seeds for which this returns a puzzle.
 */
export function generate(seed: number, clueCount: number, hard: boolean): Puzzle | null {
  const rng = new Rng(seed);
  const map = generateMap(rng, hard);
  const catalog = clueCatalog(hard);
  const masks = catalog.map((c) => clueMask(c, map));
  const occupied = new Set(map.structures.map((s) => s.cell));

  for (let attempt = 0; attempt < CLUE_SET_ATTEMPTS; attempt++) {
    const target: Cell = rng.int(CELLS);
    // The diamond is never under a kiosk or umbrella.
    if (occupied.has(target)) continue;
    const passing: number[] = [];
    for (let i = 0; i < catalog.length; i++) if ((masks[i] as boolean[])[target]) passing.push(i);
    if (passing.length < clueCount) continue;

    rng.shuffle(passing);
    const chosen = passing.slice(0, clueCount);
    const chosenMasks = chosen.map((i) => masks[i] as boolean[]);

    if (intersectionSize(chosenMasks, -1) !== 1) continue;
    let allNecessary = true;
    for (let i = 0; i < chosenMasks.length; i++) {
      if (intersectionSize(chosenMasks, i) <= 1) {
        allNecessary = false;
        break;
      }
    }
    if (!allNecessary) continue;

    const clues = chosen.map((i) => catalog[i] as Clue);
    const ids = new Set(clues.map(clueId));
    if (ids.size !== clues.length) continue;

    return { seed, hard, map, clues, solution: target };
  }
  return null;
}
