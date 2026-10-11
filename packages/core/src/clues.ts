import { CELLS, type Cell, distance } from "./hex";
import {
  type BeachMap,
  type Clue,
  type ClueBody,
  colorsInPlay,
  STRUCTURE_KINDS,
  TERRAINS,
  TERRITORIES,
} from "./types";

/** Every clue available for a mode. Normal: 23 clues. Hard: 24 clues × 2 (negated). */
export function clueCatalog(hard: boolean): Clue[] {
  const bodies: ClueBody[] = [];
  for (let i = 0; i < TERRAINS.length; i++) {
    for (let j = i + 1; j < TERRAINS.length; j++) {
      const a = TERRAINS[i];
      const b = TERRAINS[j];
      if (a && b) bodies.push({ kind: "terrain2", a, b });
    }
  }
  for (const terrain of TERRAINS) bodies.push({ kind: "nearTerrain", terrain });
  bodies.push({ kind: "nearTerritory" });
  for (const territory of TERRITORIES) bodies.push({ kind: "near2Territory", territory });
  for (const structure of STRUCTURE_KINDS) bodies.push({ kind: "near2Structure", structure });
  for (const color of colorsInPlay(hard)) bodies.push({ kind: "near3Color", color });

  const clues: Clue[] = bodies.map((b) => ({ ...b, negate: false }));
  if (hard) clues.push(...bodies.map((b) => ({ ...b, negate: true })));
  return clues;
}

/** Stable identifier, e.g. "terrain2:sea|sand" or "!near3Color:blue". */
export function clueId(clue: Clue): string {
  const neg = clue.negate ? "!" : "";
  switch (clue.kind) {
    case "terrain2":
      return `${neg}terrain2:${clue.a}|${clue.b}`;
    case "nearTerrain":
      return `${neg}nearTerrain:${clue.terrain}`;
    case "nearTerritory":
      return `${neg}nearTerritory`;
    case "near2Territory":
      return `${neg}near2Territory:${clue.territory}`;
    case "near2Structure":
      return `${neg}near2Structure:${clue.structure}`;
    case "near3Color":
      return `${neg}near3Color:${clue.color}`;
  }
}

function bodyPasses(clue: ClueBody, map: BeachMap, cell: Cell): boolean {
  switch (clue.kind) {
    case "terrain2": {
      const t = map.terrain[cell];
      return t === clue.a || t === clue.b;
    }
    case "nearTerrain":
      return anyCellWithin(cell, 1, (c) => map.terrain[c] === clue.terrain);
    case "nearTerritory":
      return anyCellWithin(cell, 1, (c) => map.territory[c] !== null);
    case "near2Territory":
      return anyCellWithin(cell, 2, (c) => map.territory[c] === clue.territory);
    case "near2Structure":
      return map.structures.some((s) => s.kind === clue.structure && distance(s.cell, cell) <= 2);
    case "near3Color":
      return map.structures.some((s) => s.color === clue.color && distance(s.cell, cell) <= 3);
  }
}

function anyCellWithin(cell: Cell, d: number, pred: (c: Cell) => boolean): boolean {
  for (let c = 0; c < CELLS; c++) if (distance(cell, c) <= d && pred(c)) return true;
  return false;
}

/** Does `cell` satisfy `clue` on `map`? */
export function cluePasses(clue: Clue, map: BeachMap, cell: Cell): boolean {
  const p = bodyPasses(clue, map, cell);
  return clue.negate ? !p : p;
}

/** Boolean mask over all cells: which satisfy the clue. */
export function clueMask(clue: Clue, map: BeachMap): boolean[] {
  const out = new Array<boolean>(CELLS);
  for (let c = 0; c < CELLS; c++) out[c] = cluePasses(clue, map, c);
  return out;
}

/** Cells satisfying every clue in the set. */
export function solve(clues: readonly Clue[], map: BeachMap): Cell[] {
  const masks = clues.map((c) => clueMask(c, map));
  const out: Cell[] = [];
  for (let c = 0; c < CELLS; c++) if (masks.every((m) => m[c])) out.push(c);
  return out;
}
