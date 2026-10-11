import { type Analysis, analyze, type Clue, type GameView } from "@shiny/core";

/** Run the deduction assist from this seat's point of view. */
export function runAssist(game: GameView, seat: number, myClues: Clue[], hard: boolean): Analysis {
  return analyze({ seats: game.seats.length, markers: game.markers }, seat, {
    map: game.map,
    hard,
    cluesPerSeat: game.seats.length === 2 ? 2 : 1,
    myClues,
  });
}
