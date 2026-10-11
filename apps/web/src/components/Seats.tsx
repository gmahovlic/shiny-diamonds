import { currentActor, type GameView } from "@shiny/core";
import { t } from "../i18n";
import { seatColor } from "../strings";

export function Seats(p: { game: GameView; mySeat?: number | null; big?: boolean }) {
  const actor = currentActor(p.game);
  const answering = p.game.pending !== null;
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
            {p.mySeat === s.seat ? ` ${t("seat.you")}` : ""}
          </span>
          {actor === s.seat && (
            <span class="hint">
              {answering
                ? t("seat.answering")
                : p.game.pendingCube === s.seat
                  ? t("seat.cubing")
                  : t("seat.turn")}
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}
