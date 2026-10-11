/**
 * Rectangular board of flat-top hexes, "odd-q" offset layout:
 * odd columns are shifted half a hex down. Cells are addressed by index = row * COLS + col.
 */
export const COLS = 12;
export const ROWS = 9;
export const CELLS = COLS * ROWS;

export type Cell = number;

export const colOf = (c: Cell): number => c % COLS;
export const rowOf = (c: Cell): number => Math.floor(c / COLS);
export const cellAt = (col: number, row: number): Cell => row * COLS + col;
export const inBounds = (col: number, row: number): boolean =>
  col >= 0 && col < COLS && row >= 0 && row < ROWS;

/** Cube coordinates (x, y, z) with x + y + z = 0. */
export function toCube(c: Cell): [number, number, number] {
  const col = colOf(c);
  const row = rowOf(c);
  const x = col;
  const z = row - (col - (col & 1)) / 2;
  return [x, -x - z, z];
}

function cubeDistance(a: Cell, b: Cell): number {
  const [ax, ay, az] = toCube(a);
  const [bx, by, bz] = toCube(b);
  return Math.max(Math.abs(ax - bx), Math.abs(ay - by), Math.abs(az - bz));
}

/** Precomputed pairwise distances. Index: a * CELLS + b. */
const DIST = new Uint8Array(CELLS * CELLS);
for (let a = 0; a < CELLS; a++) {
  for (let b = 0; b < CELLS; b++) DIST[a * CELLS + b] = cubeDistance(a, b);
}

export const distance = (a: Cell, b: Cell): number => DIST[a * CELLS + b] as number;

const NEIGHBORS: readonly (readonly Cell[])[] = Array.from({ length: CELLS }, (_, c) => {
  const out: Cell[] = [];
  for (let o = 0; o < CELLS; o++) if (o !== c && distance(c, o) === 1) out.push(o);
  return out;
});

export const neighbors = (c: Cell): readonly Cell[] => NEIGHBORS[c] as readonly Cell[];

/** All cells at distance ≤ d from c (including c). */
export function within(c: Cell, d: number): Cell[] {
  const out: Cell[] = [];
  for (let o = 0; o < CELLS; o++) if (distance(c, o) <= d) out.push(o);
  return out;
}

export const allCells = (): Cell[] => Array.from({ length: CELLS }, (_, i) => i);
