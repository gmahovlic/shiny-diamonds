import {
  type ClientMessage,
  type ErrorCode,
  type Role,
  type ServerMessage,
  WS_REFUSED,
} from "@shiny/core";
import { errorText, t } from "./i18n";
import { applyServerMessage, joinError, resetStore, status } from "./store";

const PING_MS = 25_000;
const tokenKey = (code: string) => `sd:token:${code}`;
export const nameKey = "sd:name";

export function savedToken(code: string): string | null {
  try {
    return localStorage.getItem(tokenKey(code));
  } catch {
    return null;
  }
}

function saveToken(code: string, token: string): void {
  try {
    localStorage.setItem(tokenKey(code), token);
  } catch {
    // Private mode or blocked storage: reconnection just won't survive a reload.
  }
}

export async function createRoom(): Promise<string> {
  const res = await fetch("/api/rooms", { method: "POST" });
  if (!res.ok) throw new Error(t("home.createFail"));
  const { code } = (await res.json()) as { code: string };
  return code;
}

class Connection {
  private ws: WebSocket | null = null;
  private pingTimer: ReturnType<typeof setInterval> | undefined;
  private retry = 0;
  private closedByUs = false;
  private refused = false;

  constructor(
    private readonly code: string,
    private readonly role: Role,
    private readonly name: string | undefined,
  ) {}

  open(): void {
    this.closedByUs = false;
    status.value = this.retry === 0 ? "connecting" : "reconnecting";
    const proto = location.protocol === "https:" ? "wss" : "ws";
    const params = new URLSearchParams({ role: this.role });
    const token = savedToken(this.code);
    if (token) params.set("token", token);
    if (this.name) params.set("name", this.name);
    const ws = new WebSocket(`${proto}://${location.host}/api/rooms/${this.code}/ws?${params}`);
    this.ws = ws;

    ws.onopen = () => {
      this.retry = 0;
      status.value = "open";
      this.pingTimer = setInterval(() => this.send({ t: "ping" }), PING_MS);
    };
    ws.onmessage = (e) => {
      const msg = JSON.parse(String(e.data)) as ServerMessage;
      if (msg.t === "welcome") saveToken(this.code, msg.you.token);
      if (msg.t === "error" && !status.value.startsWith("open") && !this.refused) {
        // Refusal before welcome: the close that follows carries the same code.
        this.refused = true;
        joinError.value = errorText(msg.code, msg.params);
        return;
      }
      applyServerMessage(msg);
    };
    ws.onclose = (e) => {
      clearInterval(this.pingTimer);
      if (this.closedByUs) return;
      if (e.code === WS_REFUSED || this.refused) {
        joinError.value = joinError.value ?? errorText((e.reason || "room_not_found") as ErrorCode);
        status.value = "closed";
        return;
      }
      if (this.retry >= 8) {
        status.value = "closed";
        joinError.value = t("conn.lost");
        return;
      }
      const delay = Math.min(8000, 500 * 2 ** this.retry++);
      status.value = "reconnecting";
      setTimeout(() => this.open(), delay);
    };
    ws.onerror = () => {
      // onclose follows; nothing to do here.
    };
  }

  send(msg: ClientMessage): void {
    if (this.ws?.readyState === WebSocket.OPEN) this.ws.send(JSON.stringify(msg));
  }

  close(): void {
    this.closedByUs = true;
    clearInterval(this.pingTimer);
    this.ws?.close(1000);
    this.ws = null;
  }
}

let current: Connection | null = null;

export function connect(code: string, role: Role, name?: string): void {
  disconnect();
  joinError.value = null;
  current = new Connection(code, role, name);
  current.open();
}

export function disconnect(): void {
  current?.close();
  current = null;
  resetStore();
}

export function send(msg: ClientMessage): void {
  current?.send(msg);
}
