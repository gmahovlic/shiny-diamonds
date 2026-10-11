import { describe, expect, it } from "vitest";
import {
  allCells,
  CELLS,
  COLS,
  cellAt,
  colOf,
  distance,
  neighbors,
  ROWS,
  rowOf,
  within,
} from "../src/hex";

describe("hex grid", () => {
  it("has a 12x9 board", () => {
    expect(COLS).toBe(12);
    expect(ROWS).toBe(9);
    expect(CELLS).toBe(108);
  });

  it("round-trips col/row", () => {
    for (const c of allCells()) expect(cellAt(colOf(c), rowOf(c))).toBe(c);
  });

  it("distance is symmetric, zero on self, one on neighbors", () => {
    for (const a of allCells()) {
      expect(distance(a, a)).toBe(0);
      for (const b of allCells()) expect(distance(a, b)).toBe(distance(b, a));
      for (const n of neighbors(a)) expect(distance(a, n)).toBe(1);
    }
  });

  it("interior cells have 6 neighbors, corners fewer", () => {
    expect(neighbors(cellAt(5, 4)).length).toBe(6);
    expect(neighbors(cellAt(0, 0)).length).toBeLessThan(6);
  });

  it("within(c, 1) is c plus its neighbors", () => {
    const c = cellAt(6, 3);
    expect(new Set(within(c, 1))).toEqual(new Set([c, ...neighbors(c)]));
  });
});
