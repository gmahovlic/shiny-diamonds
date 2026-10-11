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

const TERRAIN_SEEDS = 11;
const MIN_TERRAIN_CELLS = 10;
const MIN_STRUCTURE_GAP = 2;
const TERRITORY_BLOBS: Record<Territory, number> = { gulls: 2, crabs: 2 };

/**
 * Terrain as organic blobs: a few seed cells per terrain, then a random-priority flood fill
 * so regions grow irregularly instead of as clean Voronoi cells.
 */
function growTerrain(rng: Rng): Terrain[] | null {
  const terrain = new Array<Terrain | null>(CELLS).fill(null);
  const seeds: Terrain[] = [];
  for (let i = 0; i < TERRAIN_SEEDS; i++) seeds.push(TERRAINS[i % TERRAINS.length] as Terrain);
  rng.shuffle(seeds);

  const frontier: { cell: Cell; t: Terrain }[] = [];
  for (const cell of rng.shuffle(allCells()).slice(0, seeds.length)) {
    frontier.push({ cell, t: seeds.pop() as Terrain });
  }
  while (frontier.length > 0) {
    const i = rng.int(frontier.length);
    const { cell, t } = frontier[i] as { cell: Cell; t: Terrain };
    frontier[i] = frontier[frontier.length - 1] as { cell: Cell; t: Terrain };
    frontier.pop();
    if (terrain[cell] !== null) continue;
    terrain[cell] = t;
    for (const n of neighbors(cell)) if (terrain[n] === null) frontier.push({ cell: n, t });
  }

  const counts = new Map<Terrain, number>();
  for (const t of terrain) counts.set(t as Terrain, (counts.get(t as Terrain) ?? 0) + 1);
  for (const t of TERRAINS) if ((counts.get(t) ?? 0) < MIN_TERRAIN_CELLS) return null;
  return terrain as Terrain[];
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
  for (let attempt = 0; attempt < 200; attempt++) {
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
