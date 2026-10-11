import type { GameView, RoomView } from "@shiny/core";
import { cellLabel, HexMap } from "../components/HexMap";
import { Qr } from "../components/Qr";
import { Seats } from "../components/Seats";
import { describeEvents } from "../events";
import { playerUrl } from "../router";
import { lastEvents } from "../store";
import { clueText, seatColor } from "../strings";

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
          <span class="label">Sala</span>
          <span class="code">{room.code}</span>
        </header>
        <Seats game={game} big />
        {narration && <p class="narration big">{narration}</p>}
        {game.phase === "finished" ? (
          <section class="reveal">
            <h2>💎 {game.winner !== null ? `${game.seats[game.winner]?.name} achou!` : "Fim"}</h2>
            <p>Hex {game.solution !== null ? cellLabel(game.solution) : "?"}</p>
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
            <span>entrar como tela</span>
          </div>
        )}
      </aside>
    </main>
  );
}
