import { describe, expect, it } from "vitest";
import { clueCatalog, clueId, cluePasses, solve } from "../src/clues";
import { CELLS, cellAt } from "../src/hex";
import type { BeachMap } from "../src/types";

function flatMap(): BeachMap {
  return {
    terrain: new Array(CELLS).fill("sand"),
    territory: new Array(CELLS).fill(null),
    structures: [],
  };
}

describe("clue catalog", () => {
  it("has 23 normal clues and 48 hard clues, all with distinct ids", () => {
    const normal = clueCatalog(false);
    const hard = clueCatalog(true);
    expect(normal.length).toBe(23);
    expect(hard.length).toBe(48);
    expect(new Set(hard.map(clueId)).size).toBe(48);
  });
});

describe("cluePasses", () => {
  it("terrain2 matches either terrain", () => {
    const map = flatMap();
    map.terrain[0] = "sea";
    expect(cluePasses({ kind: "terrain2", a: "sea", b: "palms", negate: false }, map, 0)).toBe(
      true,
    );
    expect(cluePasses({ kind: "terrain2", a: "sea", b: "palms", negate: false }, map, 1)).toBe(
      false,
    );
    expect(cluePasses({ kind: "terrain2", a: "sea", b: "palms", negate: true }, map, 1)).toBe(true);
  });

  it("nearTerrain is within one hex", () => {
    const map = flatMap();
    const c = cellAt(5, 4);
    map.terrain[c] = "street";
    const clue = { kind: "nearTerrain", terrain: "street", negate: false } as const;
    expect(cluePasses(clue, map, c)).toBe(true);
    expect(cluePasses(clue, map, cellAt(6, 4))).toBe(true);
    expect(cluePasses(clue, map, cellAt(8, 4))).toBe(false);
  });

  it("near3Color counts structures of that color within 3", () => {
    const map = flatMap();
    map.structures.push({ cell: cellAt(2, 2), kind: "kiosk", color: "blue" });
    const clue = { kind: "near3Color", color: "blue", negate: false } as const;
    expect(cluePasses(clue, map, cellAt(5, 2))).toBe(true);
    expect(cluePasses(clue, map, cellAt(6, 2))).toBe(false);
    expect(cluePasses({ ...clue, color: "green" }, map, cellAt(2, 2))).toBe(false);
  });

  it("solve intersects clue masks", () => {
    const map = flatMap();
    map.terrain[cellAt(3, 3)] = "sea";
    map.structures.push({ cell: cellAt(3, 3), kind: "tent", color: "white" });
    const cells = solve(
      [
        { kind: "terrain2", a: "sea", b: "street", negate: false },
        { kind: "near2Structure", structure: "tent", negate: false },
      ],
      map,
    );
    expect(cells).toEqual([cellAt(3, 3)]);
  });
});
