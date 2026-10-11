import { clueCatalog, clueMask } from "./clues";
import type { Action, GameState, Marker } from "./game";
import { CELLS, type Cell } from "./hex";
import type { Rng } from "./rng";
import type { BeachMap, Clue } from "./types";

/**
 * A bot plays with the same information a human has: its own clue(s) plus the public
 * markers. It reasons like the assist tools will: for every opponent, keep the set of
 * catalog clue combinations still consistent with that opponent's discs and cubes.
 */
export interface BotContext {
  map: BeachMap;
  hard: boolean;
  /** 1 for 3–5 players, 2 for 2 players. */
  cluesPerSeat: number;
  myClues: readonly Clue[];
}

type Mask = boolean[];

function andMasks(masks: readonly Mask[]): Mask {
  const out = new Array<boolean>(CELLS).fill(true);
  for (const m of masks) for (let c = 0; c < CELLS; c++) if (!m[c]) out[c] = false;
  return out;
}

function combinations(n: number, k: number): number[][] {
  const out: number[][] = [];
  const cur: number[] = [];
  const rec = (start: number) => {
    if (cur.length === k) {
      out.push([...cur]);
      return;
    }
    for (let i = start; i < n; i++) {
      cur.push(i);
      rec(i + 1);
      cur.pop();
    }
  };
  rec(0);
  return out;
}

const hypCache = new Map<string, Mask[]>();

/** Every possible clue set a seat could hold, as a combined mask. Cached per map. */
function hypotheses(ctx: BotContext): Mask[] {
  const key = `${ctx.hard}:${ctx.cluesPerSeat}:${JSON.stringify(ctx.map)}`;
  const cached = hypCache.get(key);
  if (cached) return cached;
  const masks = clueCatalog(ctx.hard).map((c) => clueMask(c, ctx.map));
  const hyps = combinations(masks.length, ctx.cluesPerSeat).map((idx) =>
    andMasks(idx.map((i) => masks[i] as Mask)),
  );
  if (hypCache.size > 8) hypCache.clear();
  hypCache.set(key, hyps);
  return hyps;
}

function consistentWith(hyps: readonly Mask[], markers: readonly Marker[]): Mask[] {
  return hyps.filter((h) =>
    markers.every((m) => (m.kind === "disc" ? h[m.cell] : !h[m.cell]) === true),
  );
}

function hasMarker(markers: readonly Marker[], seat: number, cell: Cell): boolean {
  return markers.some((m) => m.seat === seat && m.cell === cell);
}

function argmax<T>(items: readonly T[], score: (t: T) => number, rng: Rng): T {
  let best: T[] = [];
  let bestScore = Number.NEGATIVE_INFINITY;
  for (const it of items) {
    const s = score(it);
    if (s > bestScore) {
      bestScore = s;
      best = [it];
    } else if (s === bestScore) best.push(it);
  }
  return rng.pick(best);
}

/** What the assist needs from the board: everything public. */
export interface PublicBoard {
  seats: number;
  markers: readonly Marker[];
}

export interface Analysis {
  /** Cells that can still be the diamond given my clue and everyone's public markers. */
  possible: Cell[];
  /** Cells every remaining hypothesis of every opponent accepts (safe to search). */
  certain: Cell[];
  /** Per cell, product over opponents of the fraction of their hypotheses accepting it. */
  likelihood: number[];
  /** Remaining hypotheses (clue-set masks) per opponent seat. */
  oppHyps: Map<number, Mask[]>;
  opponents: number[];
}

/** Deduce what the public board says, from `seat`'s point of view. Also powers the assist UI. */
export function analyze(state: PublicBoard, seat: number, ctx: BotContext): Analysis {
  const myMask = andMasks(ctx.myClues.map((c) => clueMask(c, ctx.map)));
  const hyps = hypotheses(ctx);
  const opponents: number[] = [];
  for (let s = 0; s < state.seats; s++) if (s !== seat) opponents.push(s);
  const oppHyps = new Map<number, Mask[]>();
  for (const o of opponents) {
    oppHyps.set(
      o,
      consistentWith(
        hyps,
        state.markers.filter((m) => m.seat === o),
      ),
    );
  }

  const possible: Cell[] = [];
  const certain: Cell[] = [];
  const likelihood = new Array<number>(CELLS).fill(0);
  for (let c = 0; c < CELLS; c++) {
    if (!myMask[c]) continue;
    let ok = true;
    let sure = true;
    let score = 1;
    for (const o of opponents) {
      const hs = oppHyps.get(o) as Mask[];
      const accepting = hs.filter((h) => h[c]).length;
      if (accepting === 0) ok = false;
      if (accepting !== hs.length) sure = false;
      score *= hs.length === 0 ? 0 : accepting / hs.length;
    }
    if (!ok) continue;
    possible.push(c);
    likelihood[c] = score;
    if (sure) certain.push(c);
  }
  return { possible, certain, likelihood, oppHyps, opponents };
}

/** Choose the bot's next action for `seat`. Assumes it is this seat's move. */
export function botAction(state: GameState, seat: number, ctx: BotContext, rng: Rng): Action {
  const myMask = andMasks(ctx.myClues.map((c) => clueMask(c, ctx.map)));
  const hyps = hypotheses(ctx);
  const mine = state.markers.filter((m) => m.seat === seat);

  // Cube owed (setup or penalty): reject a cell, revealing as little as possible about my clue.
  if (state.pendingCube === seat) {
    const selfHyps = consistentWith(hyps, mine);
    const options: Cell[] = [];
    for (let c = 0; c < CELLS; c++) if (!myMask[c] && !hasMarker(mine, seat, c)) options.push(c);
    return {
      type: "placeCube",
      seat,
      cell: argmax(options, (c) => selfHyps.filter((h) => !h[c]).length + rng.next() * 0.01, rng),
    };
  }

  const { possible, certain, likelihood, oppHyps, opponents } = analyze(state, seat, ctx);

  const hasCube = (c: Cell) => state.markers.some((m) => m.cell === c && m.kind === "cube");
  const searchable = (c: Cell) => !hasCube(c);

  if (certain.length > 0) return { type: "search", seat, cell: rng.pick(certain) };
  if (possible.length === 1 && searchable(possible[0] as Cell)) {
    return { type: "search", seat, cell: possible[0] as Cell };
  }

  // Ask the question that best splits an opponent's remaining hypotheses.
  type Q = { target: number; cell: Cell; score: number };
  const questions: Q[] = [];
  for (const o of opponents) {
    const hs = oppHyps.get(o) as Mask[];
    for (let c = 0; c < CELLS; c++) {
      if (hasMarker(state.markers, o, c)) continue;
      const accept = hs.filter((h) => h[c]).length;
      const split = Math.min(accept, hs.length - accept);
      if (split === 0) continue;
      const bonus = likelihood[c] as number;
      questions.push({ target: o, cell: c, score: split * (1 + bonus) });
    }
  }
  if (questions.length > 0) {
    const q = argmax(questions, (x) => x.score, rng);
    return { type: "ask", seat, target: q.target, cell: q.cell };
  }

  // Nothing left to learn by asking: gamble on the most likely cell.
  const gambles = possible.filter(searchable);
  if (gambles.length > 0) {
    return { type: "search", seat, cell: argmax(gambles, (c) => likelihood[c] as number, rng) };
  }
  // Degenerate fallback: any cell my clue accepts without a cube.
  const any: Cell[] = [];
  for (let c = 0; c < CELLS; c++) if (myMask[c] && searchable(c)) any.push(c);
  return { type: "search", seat, cell: rng.pick(any) };
}
