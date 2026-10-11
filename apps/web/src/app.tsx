import { useEffect } from "preact/hooks";
import { t } from "./i18n";
import { connect, disconnect, nameKey } from "./net";
import { Game } from "./pages/Game";
import { Home } from "./pages/Home";
import { Lobby } from "./pages/Lobby";
import { TvGame } from "./pages/Tv";
import { navigate, route } from "./router";
import { joinError, room, status, toast } from "./store";

function savedName(): string | undefined {
  try {
    return localStorage.getItem(nameKey) || undefined;
  } catch {
    return undefined;
  }
}

function RoomPage(p: { code: string; tv: boolean }) {
  useEffect(() => {
    connect(p.code, p.tv ? "display" : "player", p.tv ? undefined : savedName());
    return () => disconnect();
  }, [p.code, p.tv]);

  const r = room.value;
  const err = joinError.value;
  if (err) {
    return (
      <main class="center">
        <h2>{t("conn.oops")}</h2>
        <p>{err}</p>
        <button type="button" class="btn" onClick={() => navigate("/")}>
          {t("conn.back")}
        </button>
      </main>
    );
  }
  if (!r) {
    return (
      <main class="center">
        <p class="pulse">
          {status.value === "reconnecting" ? t("conn.reconnecting") : t("conn.connecting")}
        </p>
      </main>
    );
  }
  if (!r.game || r.phase === "lobby") return <Lobby room={r} tv={p.tv} />;
  return p.tv ? <TvGame room={r} game={r.game} /> : <Game room={r} game={r.game} />;
}

export function App() {
  const rt = route.value;
  return (
    <div class={`app ${rt.page === "tv" ? "is-tv" : ""}`}>
      {rt.page === "home" && <Home />}
      {rt.page === "player" && <RoomPage code={rt.code} tv={false} />}
      {rt.page === "tv" && <RoomPage code={rt.code} tv />}
      {status.value === "reconnecting" && room.value && (
        <div class="banner">{t("conn.reconnecting")}</div>
      )}
      {toast.value && <div class="toast">{toast.value}</div>}
    </div>
  );
}
