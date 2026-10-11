import { describe, expect, it } from "vitest";
import { BANK, bankKey } from "../src/bank";
import { botAction } from "../src/bot";
import { newGame, reduce } from "../src/game";
import { clueCountFor, generate, seatClues } from "../src/generator";
import { oracleFromClues } from "../src/oracle";
import { Rng } from "../src/rng";

function playBots(seed: number, players: number, hard: boolean) {
  const puzzle = generate(seed, clueCountFor(players), hard);
  if (!puzzle) throw new Error(`seed ${seed} invalid`);
  const seats = seatClues(puzzle, players);
  const oracle = oracleFromClues(seats, puzzle.map);
  const rng = new Rng(seed * 7919);
  let state = newGame(players);
  let steps = 0;
  while (state.phase !== "finished") {
    const seat = state.pendingCube ?? state.turn;
    const action = botAction(
      state,
      seat,
      {
        map: puzzle.map,
        hard,
        cluesPerSeat: players === 2 ? 2 : 1,
        myClues: seats[seat] as NonNullable<(typeof seats)[number]>,
      },
      rng,
    );
    const r = reduce(state, action, oracle);
    if (!r.ok)
      throw new Error(`seed ${seed} step ${steps}: ${r.error} (${JSON.stringify(action)})`);
    state = r.state;
    if (++steps > 400) throw new Error(`seed ${seed}: game did not finish`);
  }
  const found = state.history.find((e) => e.type === "found");
  return { state, steps, found, solution: puzzle.solution };
}

describe("bots", () => {
  it("play full games to the real solution, for every player count and mode", () => {
    for (const hard of [false, true]) {
      for (const players of [2, 3, 4, 5]) {
        const seeds = BANK[bankKey(clueCountFor(players), hard)]?.slice(0, 4) as number[];
        for (const seed of seeds) {
          const { state, found, solution, steps } = playBots(seed, players, hard);
          expect(state.winner, `seed ${seed} p${players} hard=${hard}`).not.toBeNull();
          expect(found).toMatchObject({ type: "found", cell: solution });
          expect(steps).toBeLessThan(400);
        }
      }
    }
  }, 60_000);

  it("only ever makes legal moves (never a rejected search or an accepted-cell cube)", () => {
    const { state } = playBots(BANK[bankKey(4, false)]?.[1] as number, 4, false);
    expect(state.history.filter((e) => e.type === "found").length).toBe(1);
  });
});
