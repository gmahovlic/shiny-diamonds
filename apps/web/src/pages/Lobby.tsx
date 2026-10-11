import { MAX_PLAYERS, MIN_PLAYERS, type RoomView } from "@shiny/core";
import { Qr } from "../components/Qr";
import { t } from "../i18n";
import { nameKey, send } from "../net";
import { navigate, playerUrl, tvUrl } from "../router";
import { isHost, showToast, you } from "../store";

async function shareLink(code: string): Promise<void> {
  const url = playerUrl(code);
  try {
    if (navigator.share) {
      await navigator.share({ title: "Shiny Diamonds", text: code, url });
      return;
    }
    await navigator.clipboard.writeText(url);
    showToast(t("lobby.copied"));
  } catch {
    // user cancelled the share sheet or clipboard blocked; nothing to do
  }
}

function rename(): void {
  const current = you.value ? "" : "";
  const name = prompt(t("lobby.renamePrompt"), current);
  if (name?.trim()) {
    send({ t: "setName", name: name.trim() });
    try {
      localStorage.setItem(nameKey, name.trim());
    } catch {
      // ignore
    }
  }
}

export function Lobby(p: { room: RoomView; tv?: boolean }) {
  const r = p.room;
  const players = r.members.filter((m) => m.role === "player");
  const host = isHost.value && !p.tv;
  const canStart = players.length >= MIN_PLAYERS && players.length <= MAX_PLAYERS;
  const screens = r.members.filter((m) => m.role === "display").length;

  return (
    <main class={`lobby ${p.tv ? "tv" : ""}`}>
      <header class="codebar">
        <span class="label">{t("lobby.room")}</span>
        <span class="code">{r.code}</span>
        {!p.tv && (
          <button
            type="button"
            class="btn tiny"
            style="margin-left:auto"
            onClick={() => shareLink(r.code)}
          >
            📤 {t("lobby.share")}
          </button>
        )}
      </header>

      <section class="share">
        <div class="qr-box">
          <Qr text={playerUrl(r.code)} />
          <span>{t("lobby.scan")}</span>
        </div>
        {!p.tv && (
          <div class="qr-box small">
            <Qr text={tvUrl(r.code)} />
            <span>{t("lobby.tv")}</span>
          </div>
        )}
      </section>

      <section class="members">
        <h2>
          {t("lobby.players")} ({players.length}/{MAX_PLAYERS})
        </h2>
        <ul>
          {players.map((m) => (
            <li key={m.id} class={m.connected ? "" : "offline"}>
              <span>
                {m.name}
                {m.bot ? " 🤖" : ""}
                {m.id === r.hostId ? " 👑" : ""}
                {m.id === you.value?.id ? ` ${t("lobby.you")}` : ""}
              </span>
              {!p.tv && m.id === you.value?.id && (
                <button type="button" class="btn tiny" onClick={rename}>
                  ✏️
                </button>
              )}
              {host && m.id !== you.value?.id && (
                <button
                  type="button"
                  class="btn tiny"
                  onClick={() => send({ t: "removeMember", id: m.id })}
                >
                  {t("lobby.remove")}
                </button>
              )}
            </li>
          ))}
        </ul>
        {screens > 0 && <p class="small">{t("lobby.screens", { n: screens })}</p>}
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
              {t("lobby.addBot")}
            </button>
            <label class="toggle">
              <input
                type="checkbox"
                checked={r.settings.hard}
                onChange={(e) =>
                  send({ t: "settings", hard: (e.target as HTMLInputElement).checked })
                }
              />
              <span>{t("lobby.hard")}</span>
            </label>
          </div>
          <label class="field">
            <span>{t("lobby.assist")}</span>
            <select
              value={r.settings.assist}
              onChange={(e) =>
                send({
                  t: "settings",
                  assist: (e.target as HTMLSelectElement).value as "off" | "normal" | "full",
                })
              }
            >
              <option value="off">{t("assist.off")}</option>
              <option value="normal">{t("assist.normal")}</option>
              <option value="full">{t("assist.full")}</option>
            </select>
          </label>
          <button
            type="button"
            class="btn primary big"
            disabled={!canStart}
            onClick={() => send({ t: "start" })}
          >
            {canStart ? t("lobby.start") : t("lobby.need", { min: MIN_PLAYERS, max: MAX_PLAYERS })}
          </button>
        </section>
      ) : (
        <p class="waiting">
          {t("lobby.waiting")} {r.settings.hard && <span class="chip">{t("lobby.hardChip")}</span>}
        </p>
      )}
      {!p.tv && (
        <p class="center-row">
          <button type="button" class="btn ghost" onClick={() => navigate("/")}>
            {t("lobby.leave")}
          </button>
        </p>
      )}
    </main>
  );
}
