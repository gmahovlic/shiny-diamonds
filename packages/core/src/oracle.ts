import { cluePasses } from "./clues";
import type { Oracle } from "./game";
import type { BeachMap, Clue } from "./types";

/** Build the server-side oracle from each seat's clues (a seat with 2 clues must pass both). */
export function oracleFromClues(
  seatCluesList: readonly (readonly Clue[])[],
  map: BeachMap,
): Oracle {
  return (seat, cell) => {
    const clues = seatCluesList[seat];
    if (!clues) throw new Error(`no clues for seat ${seat}`);
    return clues.every((c) => cluePasses(c, map, cell));
  };
}
