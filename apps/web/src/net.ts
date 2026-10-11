import type { ClientMessage, Role, ServerMessage } from "@shiny/core";
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
  if (!res.ok) throw new Error("não consegui criar a sala");
  const { code } = (await res.json()) as { code: string };
  return code;
}

export async function roomExists(code: string): Promise<boolean> {
  const res = await fetch(`/api/rooms/${encodeURIComponent(code)}`);
  return res.ok;
}

class Connection {
  private ws: WebSocket | null = null;
  private pingTimer: ReturnType<typeof setInterval> | undefined;
  private retry = 0;
  private closedByUs = false;

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
      applyServerMessage(msg);
    };
    ws.onclose = (e) => {
      clearInterval(this.pingTimer);
      if (this.closedByUs) return;
      // 1008/403-style rejections (room full, not found) are not worth retrying.
      if (this.retry === 0 && e.code !== 1006 && e.code !== 1001 && e.code !== 1000) {
        joinError.value = e.reason || "não deu pra entrar na sala";
        status.value = "closed";
        return;
      }
      if (this.retry >= 8) {
        status.value = "closed";
        joinError.value = "sem conexão com a sala";
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
