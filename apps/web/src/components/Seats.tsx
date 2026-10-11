import type { GameView } from "@shiny/core";
import { seatColor } from "../strings";

export function Seats(p: { game: GameView; mySeat?: number | null; big?: boolean }) {
  const actor = p.game.phase === "finished" ? null : (p.game.pendingCube ?? p.game.turn);
  return (
    <ul class={`seats ${p.big ? "big" : ""}`}>
      {p.game.seats.map((s) => (
        <li
          key={s.seat}
          class={`seat ${actor === s.seat ? "active" : ""} ${p.game.winner === s.seat ? "winner" : ""}`}
        >
          <span class="dot" style={`background:${seatColor(s.seat)}`} />
          <span class="name">
            {s.name}
            {s.bot ? " 🤖" : ""}
            {p.mySeat === s.seat ? " (você)" : ""}
          </span>
          {actor === s.seat && (
            <span class="hint">{p.game.pendingCube === s.seat ? "colocando cubo" : "na vez"}</span>
          )}
        </li>
      ))}
    </ul>
  );
}
