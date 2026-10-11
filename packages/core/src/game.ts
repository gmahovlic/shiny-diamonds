import type { Cell } from "./hex";

/** Answers "does this seat's clue(s) accept this cell?" — the server knows every clue. */
export type Oracle = (seat: number, cell: Cell) => boolean;

export type MarkerKind = "disc" | "cube";

export interface Marker {
  cell: Cell;
  seat: number;
  kind: MarkerKind;
}

export type Phase = "setup" | "playing" | "finished";

export interface GameState {
  seats: number;
  phase: Phase;
  /** Seat whose turn it is. */
  turn: number;
  markers: Marker[];
  /** Seat that still owes a cube before play continues. */
  pendingCube: number | null;
  /** Setup cubes each seat still has to place. */
  setupLeft: number[];
  winner: number | null;
  history: GameEvent[];
}

export type Action =
  | { type: "placeCube"; seat: number; cell: Cell }
  | { type: "ask"; seat: number; target: number; cell: Cell }
  | { type: "search"; seat: number; cell: Cell };

export type GameEvent =
  | { type: "marker"; marker: Marker; by: "setup" | "answer" | "search" | "penalty" }
  | { type: "asked"; seat: number; target: number; cell: Cell; yes: boolean }
  | { type: "searched"; seat: number; cell: Cell; stoppedBy: number | null }
  | { type: "found"; seat: number; cell: Cell }
  | { type: "turn"; seat: number };

export type Result =
  | { ok: true; state: GameState; events: GameEvent[] }
  | { ok: false; error: string };

export const SETUP_CUBES = 2;

export function newGame(seats: number): GameState {
  return {
    seats,
    phase: "setup",
    turn: 0,
    markers: [],
    pendingCube: 0,
    setupLeft: Array.from({ length: seats }, () => SETUP_CUBES),
    winner: null,
    history: [],
  };
}

const hasMarker = (s: GameState, seat: number, cell: Cell): boolean =>
  s.markers.some((m) => m.seat === seat && m.cell === cell);

const hasCube = (s: GameState, cell: Cell): boolean =>
  s.markers.some((m) => m.kind === "cube" && m.cell === cell);

function addMarker(
  s: GameState,
  events: GameEvent[],
  marker: Marker,
  by: "setup" | "answer" | "search" | "penalty",
): void {
  if (hasMarker(s, marker.seat, marker.cell)) return;
  s.markers.push(marker);
  events.push({ type: "marker", marker, by });
}

function nextTurn(s: GameState, events: GameEvent[]): void {
  s.turn = (s.turn + 1) % s.seats;
  events.push({ type: "turn", seat: s.turn });
}

function clone(s: GameState): GameState {
  return {
    ...s,
    markers: s.markers.map((m) => ({ ...m })),
    setupLeft: [...s.setupLeft],
    history: [...s.history],
  };
}

/** Apply an action. Pure: returns a new state, never mutates the input. */
export function reduce(prev: GameState, action: Action, oracle: Oracle): Result {
  const s = clone(prev);
  const events: GameEvent[] = [];
  const fail = (error: string): Result => ({ ok: false, error });

  if (s.phase === "finished") return fail("game is over");
  if (action.seat < 0 || action.seat >= s.seats) return fail("invalid seat");

  switch (action.type) {
    case "placeCube": {
      if (s.pendingCube !== action.seat) return fail("no cube owed by this seat");
      if (hasMarker(s, action.seat, action.cell)) return fail("you already marked this cell");
      if (oracle(action.seat, action.cell)) return fail("cube must go on a cell your clue rejects");

      const isSetup = s.phase === "setup";
      addMarker(
        s,
        events,
        { cell: action.cell, seat: action.seat, kind: "cube" },
        isSetup ? "setup" : "penalty",
      );
      s.pendingCube = null;

      if (isSetup) {
        s.setupLeft[action.seat] = (s.setupLeft[action.seat] as number) - 1;
        nextTurn(s, events);
        if (s.setupLeft.every((n) => n === 0)) {
          s.phase = "playing";
          s.turn = 0;
          events.push({ type: "turn", seat: 0 });
        } else {
          s.pendingCube = s.turn;
        }
      } else {
        nextTurn(s, events);
      }
      break;
    }

    case "ask": {
      if (s.phase !== "playing") return fail("not in play");
      if (s.pendingCube !== null) return fail("a cube is still owed");
      if (action.seat !== s.turn) return fail("not your turn");
      if (action.target === action.seat || action.target < 0 || action.target >= s.seats)
        return fail("invalid target");
      if (hasMarker(s, action.target, action.cell)) return fail("target already marked this cell");

      const yes = oracle(action.target, action.cell);
      events.push({
        type: "asked",
        seat: action.seat,
        target: action.target,
        cell: action.cell,
        yes,
      });
      addMarker(
        s,
        events,
        { cell: action.cell, seat: action.target, kind: yes ? "disc" : "cube" },
        "answer",
      );
      if (yes) nextTurn(s, events);
      else s.pendingCube = action.seat;
      break;
    }

    case "search": {
      if (s.phase !== "playing") return fail("not in play");
      if (s.pendingCube !== null) return fail("a cube is still owed");
      if (action.seat !== s.turn) return fail("not your turn");
      if (hasCube(s, action.cell)) return fail("cannot search a cell with a cube");
      if (!oracle(action.seat, action.cell))
        return fail("you can only search a cell your clue accepts");

      addMarker(s, events, { cell: action.cell, seat: action.seat, kind: "disc" }, "search");
      let stoppedBy: number | null = null;
      for (let i = 1; i < s.seats; i++) {
        const other = (action.seat + i) % s.seats;
        if (oracle(other, action.cell)) {
          addMarker(s, events, { cell: action.cell, seat: other, kind: "disc" }, "search");
        } else {
          addMarker(s, events, { cell: action.cell, seat: other, kind: "cube" }, "search");
          stoppedBy = other;
          break;
        }
      }
      events.push({ type: "searched", seat: action.seat, cell: action.cell, stoppedBy });
      if (stoppedBy === null) {
        s.phase = "finished";
        s.winner = action.seat;
        events.push({ type: "found", seat: action.seat, cell: action.cell });
      } else {
        s.pendingCube = action.seat;
      }
      break;
    }
  }

  s.history.push(...events);
  return { ok: true, state: s, events };
}
