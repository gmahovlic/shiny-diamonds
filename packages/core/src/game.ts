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

/** House rules chosen in the lobby. */
export interface GameOptions {
  /** Cubes each player places before the first turn (0 to skip setup). */
  setupCubes: number;
  /** After a NO answer or a failed search, the asker must place a cube. */
  penaltyCube: boolean;
  /** Humans answer questions themselves (bots always answer at once). */
  manualAnswers: boolean;
}

export const DEFAULT_OPTIONS: GameOptions = {
  setupCubes: 2,
  penaltyCube: true,
  manualAnswers: true,
};

/** A question or search waiting for someone's answer. */
export type Pending =
  | { type: "ask"; asker: number; target: number; cell: Cell }
  | { type: "search"; searcher: number; cell: Cell; responder: number };

export interface GameState {
  seats: number;
  options: GameOptions;
  phase: Phase;
  /** Seat whose turn it is. */
  turn: number;
  markers: Marker[];
  /** Seat that still owes a cube before play continues. */
  pendingCube: number | null;
  /** Question or search awaiting an answer. */
  pending: Pending | null;
  /** Setup cubes each seat still has to place. */
  setupLeft: number[];
  winner: number | null;
  history: GameEvent[];
}

export type Action =
  | { type: "placeCube"; seat: number; cell: Cell }
  | { type: "ask"; seat: number; target: number; cell: Cell }
  | { type: "search"; seat: number; cell: Cell }
  | { type: "answer"; seat: number; yes: boolean };

export type GameEvent =
  | { type: "marker"; marker: Marker; by: "setup" | "answer" | "search" | "penalty" }
  | { type: "question"; seat: number; target: number; cell: Cell }
  | { type: "asked"; seat: number; target: number; cell: Cell; yes: boolean }
  | { type: "searchStart"; seat: number; cell: Cell }
  | { type: "searched"; seat: number; cell: Cell; stoppedBy: number | null }
  | { type: "found"; seat: number; cell: Cell }
  | { type: "turn"; seat: number };

/** Rule violation codes; the client translates them. */
export type RuleError =
  | "game_over"
  | "invalid_seat"
  | "no_cube_owed"
  | "already_marked"
  | "cube_needs_no"
  | "not_in_play"
  | "cube_owed"
  | "answer_owed"
  | "not_your_turn"
  | "invalid_target"
  | "target_marked"
  | "search_cubed"
  | "search_needs_yes"
  | "nothing_to_answer"
  | "wrong_answer";

export type Result =
  | { ok: true; state: GameState; events: GameEvent[] }
  | { ok: false; error: RuleError };

export const SETUP_CUBES = 2;

export function newGame(seats: number, options: GameOptions = DEFAULT_OPTIONS): GameState {
  const setup = options.setupCubes > 0;
  return {
    seats,
    options: { ...options },
    phase: setup ? "setup" : "playing",
    turn: 0,
    markers: [],
    pendingCube: setup ? 0 : null,
    pending: null,
    setupLeft: Array.from({ length: seats }, () => options.setupCubes),
    winner: null,
    history: [],
  };
}

/** Seat that must act next: answer a question, pay a cube, or take the turn. */
export function currentActor(
  s: Pick<GameState, "phase" | "pending" | "pendingCube" | "turn">,
): number | null {
  if (s.phase === "finished") return null;
  if (s.pending) return s.pending.type === "ask" ? s.pending.target : s.pending.responder;
  return s.pendingCube ?? s.turn;
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

/** After a NO: the asker pays a cube if the house rule is on, else play just moves on. */
function afterNo(s: GameState, events: GameEvent[], asker: number): void {
  if (s.options.penaltyCube) s.pendingCube = asker;
  else nextTurn(s, events);
}

function resolveAsk(
  s: GameState,
  events: GameEvent[],
  q: { asker: number; target: number; cell: Cell },
  yes: boolean,
): void {
  events.push({ type: "asked", seat: q.asker, target: q.target, cell: q.cell, yes });
  addMarker(s, events, { cell: q.cell, seat: q.target, kind: yes ? "disc" : "cube" }, "answer");
  s.pending = null;
  if (yes) nextTurn(s, events);
  else afterNo(s, events, q.asker);
}

/** One responder's verdict during a search. Returns true when the search is over. */
function resolveSearchStep(
  s: GameState,
  events: GameEvent[],
  q: { searcher: number; cell: Cell; responder: number },
  yes: boolean,
): boolean {
  if (yes) {
    addMarker(s, events, { cell: q.cell, seat: q.responder, kind: "disc" }, "search");
    const next = (q.responder + 1) % s.seats;
    if (next === q.searcher) {
      s.pending = null;
      events.push({ type: "searched", seat: q.searcher, cell: q.cell, stoppedBy: null });
      s.phase = "finished";
      s.winner = q.searcher;
      events.push({ type: "found", seat: q.searcher, cell: q.cell });
      return true;
    }
    s.pending = { type: "search", searcher: q.searcher, cell: q.cell, responder: next };
    return false;
  }
  addMarker(s, events, { cell: q.cell, seat: q.responder, kind: "cube" }, "search");
  s.pending = null;
  events.push({ type: "searched", seat: q.searcher, cell: q.cell, stoppedBy: q.responder });
  afterNo(s, events, q.searcher);
  return true;
}

function clone(s: GameState): GameState {
  return {
    ...s,
    options: { ...s.options },
    markers: s.markers.map((m) => ({ ...m })),
    pending: s.pending ? { ...s.pending } : null,
    setupLeft: [...s.setupLeft],
    history: [...s.history],
  };
}

/** Apply an action. Pure: returns a new state, never mutates the input. */
export function reduce(prev: GameState, action: Action, oracle: Oracle): Result {
  const s = clone(prev);
  const events: GameEvent[] = [];
  const fail = (error: RuleError): Result => ({ ok: false, error });

  if (s.phase === "finished") return fail("game_over");
  if (action.seat < 0 || action.seat >= s.seats) return fail("invalid_seat");

  switch (action.type) {
    case "placeCube": {
      if (s.pending) return fail("answer_owed");
      if (s.pendingCube !== action.seat) return fail("no_cube_owed");
      if (hasMarker(s, action.seat, action.cell)) return fail("already_marked");
      if (oracle(action.seat, action.cell)) return fail("cube_needs_no");

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
      if (s.phase !== "playing") return fail("not_in_play");
      if (s.pending) return fail("answer_owed");
      if (s.pendingCube !== null) return fail("cube_owed");
      if (action.seat !== s.turn) return fail("not_your_turn");
      if (action.target === action.seat || action.target < 0 || action.target >= s.seats)
        return fail("invalid_target");
      if (hasMarker(s, action.target, action.cell)) return fail("target_marked");

      const q = { asker: action.seat, target: action.target, cell: action.cell };
      if (s.options.manualAnswers) {
        s.pending = { type: "ask", ...q };
        events.push({ type: "question", seat: q.asker, target: q.target, cell: q.cell });
      } else {
        resolveAsk(s, events, q, oracle(q.target, q.cell));
      }
      break;
    }

    case "search": {
      if (s.phase !== "playing") return fail("not_in_play");
      if (s.pending) return fail("answer_owed");
      if (s.pendingCube !== null) return fail("cube_owed");
      if (action.seat !== s.turn) return fail("not_your_turn");
      if (hasCube(s, action.cell)) return fail("search_cubed");
      if (!oracle(action.seat, action.cell)) return fail("search_needs_yes");

      addMarker(s, events, { cell: action.cell, seat: action.seat, kind: "disc" }, "search");
      events.push({ type: "searchStart", seat: action.seat, cell: action.cell });
      const first = (action.seat + 1) % s.seats;
      if (s.options.manualAnswers) {
        s.pending = { type: "search", searcher: action.seat, cell: action.cell, responder: first };
      } else {
        let q = { searcher: action.seat, cell: action.cell, responder: first };
        for (;;) {
          if (resolveSearchStep(s, events, q, oracle(q.responder, q.cell))) break;
          q = { ...q, responder: (q.responder + 1) % s.seats };
        }
      }
      break;
    }

    case "answer": {
      const p = s.pending;
      if (!p) return fail("nothing_to_answer");
      const responder = p.type === "ask" ? p.target : p.responder;
      if (responder !== action.seat) return fail("nothing_to_answer");
      if (oracle(action.seat, p.cell) !== action.yes) return fail("wrong_answer");
      if (p.type === "ask") resolveAsk(s, events, p, action.yes);
      else resolveSearchStep(s, events, p, action.yes);
      break;
    }
  }

  s.history.push(...events);
  return { ok: true, state: s, events };
}
