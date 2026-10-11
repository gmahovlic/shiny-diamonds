import type { Cell } from "./hex";

export const TERRAINS = ["sea", "sand", "palms", "boardwalk", "street"] as const;
export type Terrain = (typeof TERRAINS)[number];

export const TERRITORIES = ["gulls", "crabs"] as const;
export type Territory = (typeof TERRITORIES)[number];

export const STRUCTURE_KINDS = ["kiosk", "tent"] as const;
export type StructureKind = (typeof STRUCTURE_KINDS)[number];

export const COLORS = ["blue", "white", "green", "black"] as const;
export type Color = (typeof COLORS)[number];

/** Colors in play: the 4th (black) only in hard mode. */
export const colorsInPlay = (hard: boolean): readonly Color[] =>
  hard ? COLORS : COLORS.slice(0, 3);

export interface Structure {
  cell: Cell;
  kind: StructureKind;
  color: Color;
}

export interface BeachMap {
  /** Terrain per cell, length CELLS. */
  terrain: Terrain[];
  /** Territory per cell (or null), length CELLS. */
  territory: (Territory | null)[];
  structures: Structure[];
}

export type ClueBody =
  | { kind: "terrain2"; a: Terrain; b: Terrain }
  | { kind: "nearTerrain"; terrain: Terrain }
  | { kind: "nearTerritory" }
  | { kind: "near2Territory"; territory: Territory }
  | { kind: "near2Structure"; structure: StructureKind }
  | { kind: "near3Color"; color: Color };

/** A clue; `negate` flips it ("NOT within ..."), hard mode only. */
export type Clue = ClueBody & { negate: boolean };

export interface Puzzle {
  seed: number;
  hard: boolean;
  map: BeachMap;
  /** One clue per clue slot. 3–5 players: one slot per player. 2 players: 4 slots, 2 per player. */
  clues: Clue[];
  /** The hidden diamond. */
  solution: Cell;
}
