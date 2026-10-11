import { MAX_PLAYERS, MIN_PLAYERS, type RoomView } from "@shiny/core";
import { Qr } from "../components/Qr";
import { send } from "../net";
import { playerUrl, tvUrl } from "../router";
import { isHost, you } from "../store";

export function Lobby(p: { room: RoomView; tv?: boolean }) {
  const r = p.room;
  const players = r.members.filter((m) => m.role === "player");
  const host = isHost.value && !p.tv;
  const canStart = players.length >= MIN_PLAYERS && players.length <= MAX_PLAYERS;

  return (
    <main class={`lobby ${p.tv ? "tv" : ""}`}>
      <header class="codebar">
        <span class="label">Sala</span>
        <span class="code">{r.code}</span>
      </header>

      <section class="share">
        <div class="qr-box">
          <Qr text={playerUrl(r.code)} />
          <span>Aponta a câmera pra entrar</span>
        </div>
        {!p.tv && (
          <div class="qr-box small">
            <Qr text={tvUrl(r.code)} />
            <span>TV / telão</span>
          </div>
        )}
      </section>

      <section class="members">
        <h2>
          Jogadores ({players.length}/{MAX_PLAYERS})
        </h2>
        <ul>
          {players.map((m) => (
            <li key={m.id} class={m.connected ? "" : "offline"}>
              <span>
                {m.name}
                {m.bot ? " 🤖" : ""}
                {m.id === r.hostId ? " 👑" : ""}
                {m.id === you.value?.id ? " (você)" : ""}
              </span>
              {host && m.id !== you.value?.id && (
                <button
                  type="button"
                  class="btn tiny"
                  onClick={() => send({ t: "removeMember", id: m.id })}
                >
                  tirar
                </button>
              )}
            </li>
          ))}
        </ul>
        {r.members.some((m) => m.role === "display") && (
          <p class="small">
            📺 {r.members.filter((m) => m.role === "display").length} tela(s) conectada(s)
          </p>
        )}
      </section>

      {host ? (
        <section class="controls">
          <div class="row">
            <button
              type="button"
              class="btn"
              disabled={players.length >= MAX_PLAYERS}
              onClick={() => send({ t: "addBot" })}
            >
              + Bot
            </button>
            <label class="toggle">
              <input
                type="checkbox"
                checked={r.settings.hard}
                onChange={(e) =>
                  send({ t: "settings", hard: (e.target as HTMLInputElement).checked })
                }
              />
              <span>Modo difícil</span>
            </label>
          </div>
          <label class="field">
            <span>Ajuda de dedução</span>
            <select
              value={r.settings.assist}
              onChange={(e) =>
                send({
                  t: "settings",
                  assist: (e.target as HTMLSelectElement).value as "off" | "normal" | "full",
                })
              }
            >
              <option value="off">Nenhuma (hardcore)</option>
              <option value="normal">Normal (anotações + contagem)</option>
              <option value="full">Completa (elimina hexes)</option>
            </select>
          </label>
          <button
            type="button"
            class="btn primary big"
            disabled={!canStart}
            onClick={() => send({ t: "start" })}
          >
            {canStart ? "Começar" : `Precisa de ${MIN_PLAYERS} a ${MAX_PLAYERS} jogadores`}
          </button>
        </section>
      ) : (
        <p class="waiting">
          {p.tv ? "Esperando o host começar…" : "Esperando o host começar… "}
          {r.settings.hard && <span class="chip">difícil</span>}
        </p>
      )}
    </main>
  );
}
