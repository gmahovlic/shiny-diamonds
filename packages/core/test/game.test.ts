import { describe, expect, it } from "vitest";
import { type GameState, newGame, type Oracle, reduce } from "../src/game";

/** Seat s accepts cells where cell % (s + 2) === 0; cell 0 is accepted by everyone. */
const oracle: Oracle = (seat, cell) => cell % (seat + 2) === 0;

function apply(state: GameState, action: Parameters<typeof reduce>[1]): GameState {
  const r = reduce(state, action, oracle);
  if (!r.ok) throw new Error(r.error);
  return r.state;
}

function playingState(seats = 3): GameState {
  let s = newGame(seats);
  // Setup: each seat places 2 cubes on rejected cells, in turn order.
  for (let round = 0; round < 2; round++) {
    for (let seat = 0; seat < seats; seat++) {
      const cell = [1, 3, 5, 7, 11, 13][round * seats + seat] as number;
      s = apply(s, { type: "placeCube", seat, cell: oracle(seat, cell) ? cell + 1 : cell });
    }
  }
  return s;
}

describe("setup", () => {
  it("requires cubes on rejected cells, in turn order, then starts play", () => {
    const s0 = newGame(3);
    expect(s0.phase).toBe("setup");
    expect(reduce(s0, { type: "placeCube", seat: 1, cell: 1 }, oracle).ok).toBe(false);
    expect(reduce(s0, { type: "placeCube", seat: 0, cell: 2 }, oracle).ok).toBe(false); // accepted cell
    const s = playingState(3);
    expect(s.phase).toBe("playing");
    expect(s.turn).toBe(0);
    expect(s.markers.length).toBe(6);
    expect(s.markers.every((m) => m.kind === "cube")).toBe(true);
  });
});

describe("ask", () => {
  it("places a disc on yes and advances the turn", () => {
    const s = apply(playingState(), { type: "ask", seat: 0, target: 1, cell: 9 });
    expect(s.markers.at(-1)).toEqual({ cell: 9, seat: 1, kind: "disc" });
    expect(s.pendingCube).toBeNull();
    expect(s.turn).toBe(1);
  });

  it("places a cube on no and makes the asker owe a cube", () => {
    let s = apply(playingState(), { type: "ask", seat: 0, target: 1, cell: 10 });
    expect(s.markers.at(-1)).toEqual({ cell: 10, seat: 1, kind: "cube" });
    expect(s.pendingCube).toBe(0);
    expect(reduce(s, { type: "ask", seat: 1, target: 0, cell: 4 }, oracle).ok).toBe(false);
    s = apply(s, { type: "placeCube", seat: 0, cell: 15 });
    expect(s.turn).toBe(1);
  });

  it("rejects asking yourself, out of turn, or a cell the target marked", () => {
    const s = playingState();
    expect(reduce(s, { type: "ask", seat: 0, target: 0, cell: 4 }, oracle).ok).toBe(false);
    expect(reduce(s, { type: "ask", seat: 1, target: 0, cell: 4 }, oracle).ok).toBe(false);
    const marked = s.markers.find((m) => m.seat === 1)?.cell as number;
    expect(reduce(s, { type: "ask", seat: 0, target: 1, cell: marked }, oracle).ok).toBe(false);
  });
});

describe("search", () => {
  it("stops at the first no and the searcher owes a cube", () => {
    // cell 6: seat0 (÷2) yes, seat1 (÷3) yes, seat2 (÷4) no
    const s = apply(playingState(), { type: "search", seat: 0, cell: 6 });
    expect(s.phase).toBe("playing");
    expect(s.pendingCube).toBe(0);
    const kinds = s.markers.filter((m) => m.cell === 6).map((m) => `${m.seat}:${m.kind}`);
    expect(kinds).toEqual(["0:disc", "1:disc", "2:cube"]);
    expect(s.history.at(-1)).toEqual({ type: "searched", seat: 0, cell: 6, stoppedBy: 2 });
  });

  it("wins when everyone says yes", () => {
    const s = apply(playingState(), { type: "search", seat: 0, cell: 12 }); // 12 % 2,3,4 === 0
    expect(s.phase).toBe("finished");
    expect(s.winner).toBe(0);
    expect(s.history.at(-1)).toEqual({ type: "found", seat: 0, cell: 12 });
    expect(reduce(s, { type: "ask", seat: 1, target: 0, cell: 4 }, oracle).ok).toBe(false);
  });

  it("rejects searching a rejected cell or a cell with a cube", () => {
    const s = playingState();
    expect(reduce(s, { type: "search", seat: 0, cell: 9 }, oracle).ok).toBe(false);
    const cubed = s.markers[0]?.cell as number;
    expect(reduce(s, { type: "search", seat: 0, cell: cubed }, oracle).ok).toBe(false);
  });

  it("never mutates the previous state", () => {
    const before = playingState();
    const snapshot = JSON.stringify(before);
    apply(before, { type: "ask", seat: 0, target: 1, cell: 9 });
    expect(JSON.stringify(before)).toBe(snapshot);
  });
});
