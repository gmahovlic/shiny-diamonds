import { allCells, CELLS, type Cell, distance, neighbors } from "./hex";
import type { Rng } from "./rng";
import {
  type BeachMap,
  colorsInPlay,
  STRUCTURE_KINDS,
  TERRAINS,
  TERRITORIES,
  type Terrain,
  type Territory,
} from "./types";

/** Seeds per terrain: more seeds → more, smaller patches, like a mixed-tile board. */
const SEEDS_PER_TERRAIN = 4;
/** Any two seeds are at least this far apart; two seeds of the same terrain much farther. */
const MIN_SEED_GAP = 2;
const MIN_SAME_SEED_GAP = 5;
/** Balance: every terrain ends up with between MIN and MAX of the 108 cells (mean is 21.6). */
const MIN_TERRAIN_CELLS = 16;
const MAX_TERRAIN_CELLS = 28;
/** Mixing: every terrain in at least MIN_PATCHES separate patches, MIN_TOTAL_PATCHES overall. */
const MIN_PATCHES = 2;
const MIN_TOTAL_PATCHES = 13;
/** How often growth favours the terrain with the fewest cells (keeps counts balanced). */
const BALANCE_BIAS = 0.7;
const MIN_STRUCTURE_GAP = 2;
const TERRITORY_BLOBS: Record<Territory, number> = { gulls: 2, crabs: 2 };

/**
 * Terrain as many small organic patches: seeds spread across the board (same-terrain seeds
 * far apart), then a flood fill that usually grows the terrain with the fewest cells so the
 * five types stay balanced instead of one sea swallowing the map.
 */
function growTerrain(rng: Rng): Terrain[] | null {
  const terrain = new Array<Terrain | null>(CELLS).fill(null);
  const counts = new Map<Terrain, number>(TERRAINS.map((t) => [t, 0]));

  const seeds: { cell: Cell; t: Terrain }[] = [];
  const order: Terrain[] = [];
  for (let i = 0; i < SEEDS_PER_TERRAIN; i++) order.push(...rng.shuffle([...TERRAINS]));
  for (const t of order) {
    const options = allCells().filter((c) =>
      seeds.every((s) => distance(s.cell, c) >= (s.t === t ? MIN_SAME_SEED_GAP : MIN_SEED_GAP)),
    );
    if (options.length === 0) return null;
    seeds.push({ cell: rng.pick(options), t });
  }

  const frontier = new Map<Terrain, Cell[]>(TERRAINS.map((t) => [t, []]));
  for (const s of seeds) (frontier.get(s.t) as Cell[]).push(s.cell);
  for (;;) {
    const available = TERRAINS.filter((t) => (frontier.get(t) as Cell[]).length > 0);
    if (available.length === 0) break;
    let t: Terrain;
    if (rng.next() < BALANCE_BIAS) {
      const min = Math.min(...available.map((a) => counts.get(a) as number));
      t = rng.pick(available.filter((a) => counts.get(a) === min));
    } else {
      t = rng.pick(available);
    }
    const f = frontier.get(t) as Cell[];
    const i = rng.int(f.length);
    const cell = f[i] as Cell;
    f[i] = f[f.length - 1] as Cell;
    f.pop();
    if (terrain[cell] !== null) continue;
    terrain[cell] = t;
    counts.set(t, (counts.get(t) as number) + 1);
    for (const n of neighbors(cell)) if (terrain[n] === null) f.push(n);
  }
  if (terrain.includes(null)) return null;

  let totalPatches = 0;
  for (const t of TERRAINS) {
    const n = counts.get(t) as number;
    if (n < MIN_TERRAIN_CELLS || n > MAX_TERRAIN_CELLS) return null;
    const patches = patchCount(terrain as Terrain[], t);
    if (patches < MIN_PATCHES) return null;
    totalPatches += patches;
  }
  if (totalPatches < MIN_TOTAL_PATCHES) return null;
  return terrain as Terrain[];
}

/** Number of connected patches of a terrain. */
export function patchCount(terrain: readonly Terrain[], t: Terrain): number {
  const seen = new Set<Cell>();
  let patches = 0;
  for (let c = 0; c < CELLS; c++) {
    if (terrain[c] !== t || seen.has(c)) continue;
    patches++;
    const stack = [c];
    seen.add(c);
    while (stack.length > 0) {
      const cur = stack.pop() as Cell;
      for (const n of neighbors(cur)) {
        if (terrain[n] === t && !seen.has(n)) {
          seen.add(n);
          stack.push(n);
        }
      }
    }
  }
  return patches;
}

/** Small connected blobs (2–3 cells) per territory, never touching another blob. */
function placeTerritories(rng: Rng): (Territory | null)[] | null {
  const territory = new Array<Territory | null>(CELLS).fill(null);
  const blocked = new Set<Cell>();

  for (const t of TERRITORIES) {
    for (let b = 0; b < TERRITORY_BLOBS[t]; b++) {
      const size = rng.range(2, 3);
      let placed = false;
      for (let attempt = 0; attempt < 40 && !placed; attempt++) {
        const start = rng.int(CELLS);
        if (blocked.has(start)) continue;
        const blob: Cell[] = [start];
        while (blob.length < size) {
          const edge = rng.pick(blob);
          const options = neighbors(edge).filter((n) => !blocked.has(n) && !blob.includes(n));
          if (options.length === 0) break;
          blob.push(rng.pick(options));
        }
        if (blob.length < size) continue;
        for (const c of blob) {
          territory[c] = t;
          for (let o = 0; o < CELLS; o++) if (distance(c, o) <= 1) blocked.add(o);
        }
        placed = true;
      }
      if (!placed) return null;
    }
  }
  return territory;
}

/** One kiosk + one tent per color in play, never on sea, spaced apart. */
function placeStructures(
  rng: Rng,
  terrain: Terrain[],
  hard: boolean,
): BeachMap["structures"] | null {
  const structures: BeachMap["structures"] = [];
  const candidates = allCells().filter((c) => terrain[c] !== "sea");
  for (const color of colorsInPlay(hard)) {
    for (const kind of STRUCTURE_KINDS) {
      const options = candidates.filter((c) =>
        structures.every((s) => distance(s.cell, c) >= MIN_STRUCTURE_GAP),
      );
      if (options.length === 0) return null;
      structures.push({ cell: rng.pick(options), kind, color });
    }
  }
  return structures;
}

export function generateMap(rng: Rng, hard: boolean): BeachMap {
  for (let attempt = 0; attempt < 500; attempt++) {
    const terrain = growTerrain(rng);
    if (!terrain) continue;
    const territory = placeTerritories(rng);
    if (!territory) continue;
    const structures = placeStructures(rng, terrain, hard);
    if (!structures) continue;
    return { terrain, territory, structures };
  }
  throw new Error("generateMap: could not build a map");
}
