import type { GameEvent, GameView } from "@shiny/core";
import { cellLabel } from "./components/HexMap";

/** One-line pt-BR narration of the latest meaningful event. */
export function describeEvents(events: GameEvent[], game: GameView): string | null {
  const name = (seat: number) => game.seats[seat]?.name ?? `Jogador ${seat + 1}`;
  for (let i = events.length - 1; i >= 0; i--) {
    const e = events[i] as GameEvent;
    switch (e.type) {
      case "found":
        return `💎 ${name(e.seat)} achou o diamante em ${cellLabel(e.cell)}!`;
      case "searched":
        return e.stoppedBy === null
          ? `${name(e.seat)} procurou em ${cellLabel(e.cell)}`
          : `${name(e.seat)} procurou em ${cellLabel(e.cell)}: ${name(e.stoppedBy)} disse NÃO`;
      case "asked":
        return `${name(e.seat)} perguntou a ${name(e.target)} sobre ${cellLabel(e.cell)}: ${e.yes ? "SIM" : "NÃO"}`;
      case "marker":
        if (e.by === "setup")
          return `${name(e.marker.seat)} colocou um cubo inicial em ${cellLabel(e.marker.cell)}`;
        if (e.by === "penalty")
          return `${name(e.marker.seat)} colocou um cubo em ${cellLabel(e.marker.cell)}`;
        break;
      default:
        break;
    }
  }
  return null;
}
