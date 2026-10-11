import { useSignal } from "@preact/signals";
import { type Cell, cluePasses, type GameView, type RoomView } from "@shiny/core";
import { useEffect, useMemo } from "preact/hooks";
import { runAssist } from "../assist";
import { cellLabel, HexMap } from "../components/HexMap";
import { Seats } from "../components/Seats";
import { describeEvents } from "../events";
import { send } from "../net";
import { clearNotes, cycleNote, loadNotes, notes, notesMode } from "../notes";
import { clues, isHost, lastEvents, mySeat, you } from "../store";
import { clueText, seatColor } from "../strings";

export function Game(p: { room: RoomView; game: GameView }) {
  const { room, game } = p;
  const seat = mySeat.value;
  const selected = useSignal<Cell | null>(null);
  const myClues = clues.value;

  useEffect(() => {
    if (you.value) loadNotes(room.code, you.value.id);
  }, [room.code]);

  const actor = game.phase === "finished" ? null : (game.pendingCube ?? game.turn);
  const mode: "cube" | "act" | "wait" | "over" =
    game.phase === "finished"
      ? "over"
      : game.pendingCube === seat
        ? "cube"
        : actor === seat
          ? "act"
          : "wait";

  const assist = useMemo(() => {
    if (
      seat === null ||
      myClues.length === 0 ||
      room.settings.assist === "off" ||
      game.phase === "finished"
    )
      return null;
    return runAssist(game, seat, myClues, room.settings.hard);
  }, [game.markers.length, seat, myClues, room.settings.assist, room.settings.hard, game.phase]);

  // Cube mode: you may only cube a hex your own clue rejects, so dim the ones it accepts.
  // Otherwise, with full assist, dim hexes the public board already rules out.
  const dimmed = useMemo(() => {
    const d = new Set<Cell>();
    if (mode === "cube" && myClues.length > 0) {
      for (let c = 0; c < game.map.terrain.length; c++) {
        if (myClues.every((k) => cluePasses(k, game.map, c))) d.add(c);
      }
      return d;
    }
    if (!assist || room.settings.assist !== "full") return undefined;
    const ok = new Set(assist.possible);
    for (let c = 0; c < game.map.terrain.length; c++) if (!ok.has(c)) d.add(c);
    return d;
  }, [mode, myClues, assist, room.settings.assist, game.map]);
  const glow =
    mode !== "cube" && assist && room.settings.assist === "full"
      ? new Set(assist.certain)
      : undefined;

  const onCell = (c: Cell) => {
    if (notesMode.value) return cycleNote(c);
    if (mode === "cube") {
      if (seat !== null) send({ t: "action", action: { type: "placeCube", seat, cell: c } });
      return;
    }
    if (mode === "act") selected.value = selected.value === c ? null : c;
  };

  const ask = (target: number) => {
    if (seat === null || selected.value === null) return;
    send({ t: "action", action: { type: "ask", seat, target, cell: selected.value } });
    selected.value = null;
  };
  const search = () => {
    if (seat === null || selected.value === null) return;
    send({ t: "action", action: { type: "search", seat, cell: selected.value } });
    selected.value = null;
  };

  const narration = describeEvents(lastEvents.value, game);
  const opponents = game.seats.filter((s) => s.seat !== seat);

  return (
    <main class="game">
      <header class="topbar">
        <span class="code">{room.code}</span>
        <span class={`status ${mode}`}>
          {mode === "cube" && "Coloque um cubo onde sua pista diz NÃO"}
          {mode === "act" && (game.phase === "setup" ? "Preparação" : "Sua vez! Toque num hex")}
          {mode === "wait" && actor !== null && `Vez de ${game.seats[actor]?.name ?? "?"}`}
          {mode === "over" && "Fim de jogo"}
        </span>
      </header>

      <HexMap
        map={game.map}
        markers={game.markers}
        selected={selected.value}
        dimmed={dimmed}
        glow={glow}
        notes={room.settings.assist === "off" ? undefined : notes.value}
        solution={game.solution}
        onCell={game.phase === "finished" ? undefined : onCell}
        intro
      />

      {narration && <p class="narration">{narration}</p>}

      {mode === "act" && selected.value !== null && (
        <section class="sheet">
          <h3>Hex {cellLabel(selected.value)}</h3>
          <div class="row wrap">
            {opponents.map((o) => (
              <button
                type="button"
                key={o.seat}
                class="btn"
                style={`border-color:${seatColor(o.seat)}`}
                onClick={() => ask(o.seat)}
              >
                Perguntar a {o.name}
              </button>
            ))}
            <button type="button" class="btn primary" onClick={search}>
              🔎 Procurar aqui
            </button>
          </div>
        </section>
      )}

      <section class="clues">
        <h3>{myClues.length > 1 ? "Suas pistas" : "Sua pista"}</h3>
        {myClues.length === 0 ? (
          <p class="small">Sem pista (você está só assistindo).</p>
        ) : (
          myClues.map((c, i) => (
            <p key={i} class="clue">
              {clueText(c)}
            </p>
          ))
        )}
      </section>

      <Seats game={game} mySeat={seat} />

      {room.settings.assist !== "off" && game.phase !== "finished" && (
        <section class="tools">
          <div class="row">
            <button
              type="button"
              class={`btn ${notesMode.value ? "primary" : ""}`}
              onClick={() => (notesMode.value = !notesMode.value)}
            >
              ✏️ {notesMode.value ? "Anotando (toque nos hexes)" : "Anotar"}
            </button>
            <button type="button" class="btn ghost" onClick={clearNotes}>
              limpar
            </button>
          </div>
          {assist && (
            <ul class="hyps">
              {assist.opponents.map((o) => (
                <li key={o}>
                  <span class="dot" style={`background:${seatColor(o)}`} />
                  {game.seats[o]?.name}: {assist.oppHyps.get(o)?.length ?? 0} pistas possíveis
                </li>
              ))}
              <li>
                <span class="dot" style="background:#7be0ff" />
                {assist.possible.length} hex{assist.possible.length === 1 ? "" : "es"} ainda
                possíveis
              </li>
            </ul>
          )}
        </section>
      )}

      {game.phase === "finished" && (
        <section class="reveal">
          <h2>
            💎 {game.winner !== null ? `${game.seats[game.winner]?.name} achou o diamante!` : "Fim"}
          </h2>
          <p>Estava em {game.solution !== null ? cellLabel(game.solution) : "?"}.</p>
          <ul class="all-clues">
            {game.allClues?.map((cs, s) => (
              <li key={s}>
                <span class="dot" style={`background:${seatColor(s)}`} />
                <strong>{game.seats[s]?.name}:</strong> {cs.map(clueText).join(" · ")}
              </li>
            ))}
          </ul>
          {isHost.value && (
            <button type="button" class="btn primary big" onClick={() => send({ t: "rematch" })}>
              Jogar de novo
            </button>
          )}
        </section>
      )}
    </main>
  );
}
