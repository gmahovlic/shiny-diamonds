import type { GameView, RoomView } from "@shiny/core";
import { cellLabel, HexMap } from "../components/HexMap";
import { Qr } from "../components/Qr";
import { Seats } from "../components/Seats";
import { clueText, describeEvents, t } from "../i18n";
import { playerUrl } from "../router";
import { lastEvents } from "../store";
import { seatColor } from "../strings";

export function TvGame(p: { room: RoomView; game: GameView }) {
  const { room, game } = p;
  const narration = describeEvents(lastEvents.value, game);
  return (
    <main class="tvgame">
      <div class="map-col">
        <HexMap map={game.map} markers={game.markers} solution={game.solution} intro />
      </div>
      <aside class="side">
        <header class="codebar">
          <span class="label">{t("lobby.room")}</span>
          <span class="code">{room.code}</span>
        </header>
        <Seats game={game} big />
        {narration && <p class="narration big">{narration}</p>}
        {game.phase === "finished" ? (
          <section class="reveal">
            <h2>
              💎{" "}
              {game.winner !== null
                ? t("game.foundShort", { name: game.seats[game.winner]?.name ?? "?" })
                : t("game.end")}
            </h2>
            <p>
              {t("game.hex", { cell: game.solution !== null ? cellLabel(game.solution) : "?" })}
            </p>
            <ul class="all-clues">
              {game.allClues?.map((cs, s) => (
                <li key={s}>
                  <span class="dot" style={`background:${seatColor(s)}`} />
                  <strong>{game.seats[s]?.name}:</strong> {cs.map(clueText).join(" · ")}
                </li>
              ))}
            </ul>
          </section>
        ) : (
          <div class="qr-box tiny">
            <Qr text={playerUrl(room.code)} />
            <span>{t("tv.scan")}</span>
          </div>
        )}
      </aside>
    </main>
  );
}
