import { useSignal } from "@preact/signals";
import { type Cell, cluePasses, type GameView, type RoomView } from "@shiny/core";
import { useEffect, useMemo } from "preact/hooks";
import { runAssist } from "../assist";
import { HexInfo } from "../components/HexInfo";
import { cellLabel, HexMap } from "../components/HexMap";
import { Rules } from "../components/Rules";
import { Seats } from "../components/Seats";
import { describeEvents } from "../events";
import { send } from "../net";
import { clearNotes, loadNotes, notes } from "../notes";
import { clues, isHost, lastEvents, mySeat, you } from "../store";
import { clueText, seatColor } from "../strings";

export function Game(p: { room: RoomView; game: GameView }) {
  const { room, game } = p;
  const seat = mySeat.value;
  const selected = useSignal<Cell | null>(null);
  const rulesOpen = useSignal(false);
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

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") selected.value = null;
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Close the popover when the turn state changes under us (e.g. after our action resolves).
  useEffect(() => {
    selected.value = null;
  }, [mode, game.markers.length]);

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

  const myAccepts = (c: Cell) =>
    myClues.length > 0 && myClues.every((k) => cluePasses(k, game.map, c));

  // Cube mode: you may only cube a hex your own clue rejects, so dim the ones it accepts.
  // Otherwise, with full assist, dim hexes the public board already rules out.
  const dimmed = useMemo(() => {
    const d = new Set<Cell>();
    if (mode === "cube" && myClues.length > 0) {
      for (let c = 0; c < game.map.terrain.length; c++) if (myAccepts(c)) d.add(c);
      return d;
    }
    if (!assist || room.settings.assist !== "full") return undefined;
    const ok = new Set(assist.possible);
    for (let c = 0; c < game.map.terrain.length; c++) if (!ok.has(c)) d.add(c);
    return d;
  }, [mode, myClues, assist, room.settings.assist, game.map]);
  // Highlight hexes every remaining hypothesis accepts, or the single hex left standing.
  const glow =
    mode !== "cube" && assist && room.settings.assist === "full"
      ? new Set(assist.possible.length === 1 ? assist.possible : assist.certain)
      : undefined;

  const onCell = (c: Cell) => {
    selected.value = selected.value === c ? null : c;
  };
  const act = (action: Parameters<typeof send>[0]) => {
    send(action);
    selected.value = null;
  };

  const narration = describeEvents(lastEvents.value, game);
  const opponents = game.seats
    .filter((s) => s.seat !== seat)
    .map((s) => ({ seat: s.seat, name: s.name }));
  const sel = selected.value;

  return (
    <main class="game">
      <header class="topbar">
        <span class="code">{room.code}</span>
        <span class={`status ${mode}`}>
          {mode === "cube" && "Coloque um cubo onde sua pista diz NÃO"}
          {mode === "act" &&
            (game.phase === "setup" ? "Preparação: toque num hex" : "Sua vez! Toque num hex")}
          {mode === "wait" && actor !== null && `Vez de ${game.seats[actor]?.name ?? "?"}`}
          {mode === "over" && "Fim de jogo"}
        </span>
        <button type="button" class="btn tiny" onClick={() => (rulesOpen.value = true)}>
          📖
        </button>
      </header>

      <div class="map-wrap">
        <HexMap
          map={game.map}
          markers={game.markers}
          selected={sel}
          dimmed={dimmed}
          glow={glow}
          notes={room.settings.assist === "off" ? undefined : notes.value}
          solution={game.solution}
          onCell={onCell}
          intro
        />
        {sel !== null && seat !== null && (
          <HexInfo
            game={game}
            cell={sel}
            note={notes.value[sel]}
            canNote={room.settings.assist !== "off" && game.phase !== "finished"}
            mode={mode}
            cubeLegal={!myAccepts(sel)}
            opponents={opponents}
            onAsk={(target) =>
              act({ t: "action", action: { type: "ask", seat, target, cell: sel } })
            }
            onSearch={() => act({ t: "action", action: { type: "search", seat, cell: sel } })}
            onCube={() => act({ t: "action", action: { type: "placeCube", seat, cell: sel } })}
            onClose={() => (selected.value = null)}
          />
        )}
      </div>

      {narration && <p class="narration">{narration}</p>}

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
          <p class="small">
            Toque num hex pra ver detalhes e marcar anotações.{" "}
            {Object.keys(notes.value).length > 0 && (
              <button type="button" class="btn tiny ghost" onClick={clearNotes}>
                limpar anotações
              </button>
            )}
          </p>
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

      {rulesOpen.value && (
        <Rules hard={room.settings.hard} onClose={() => (rulesOpen.value = false)} />
      )}
    </main>
  );
}
