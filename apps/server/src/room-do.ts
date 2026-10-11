import { DurableObject } from "cloudflare:workers";
import type { Role } from "@shiny/core";
import { newRoomState, type Outbound, Room, type RoomState, type StepResult } from "./room";
import { parseClientMessage } from "./validate";

/** Idle rooms are deleted after this long without activity. */
const ROOM_TTL_MS = 6 * 60 * 60 * 1000;
const STATE_KEY = "room";

interface Attachment {
  memberId: string;
}

export interface Env {
  ROOMS: DurableObjectNamespace<RoomDO>;
}

/**
 * One Durable Object per room. Uses the WebSocket Hibernation API so idle rooms cost
 * nothing; the pure `Room` class holds every rule, this class only does transport,
 * persistence and timers.
 */
export class RoomDO extends DurableObject<Env> {
  private room: Room | null = null;

  private async load(): Promise<Room | null> {
    if (this.room) return this.room;
    const state = await this.ctx.storage.get<RoomState>(STATE_KEY);
    if (!state) return null;
    this.room = new Room(state, this.rand());
    return this.room;
  }

  private rand() {
    return {
      id: () => crypto.randomUUID().replace(/-/g, "").slice(0, 12),
      seed: () => crypto.getRandomValues(new Uint32Array(1))[0] as number,
    };
  }

  private async save(): Promise<void> {
    if (this.room) await this.ctx.storage.put(STATE_KEY, this.room.state);
  }

  override async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "POST" && url.pathname === "/create") {
      const existing = await this.load();
      if (existing) return new Response("exists", { status: 409 });
      const code = url.searchParams.get("code") ?? "";
      this.room = new Room(newRoomState(code, Date.now()), this.rand());
      await this.save();
      await this.armAlarm(null);
      return new Response("ok", { status: 201 });
    }

    if (url.pathname === "/ws") {
      const room = await this.load();
      if (!room) return new Response("room not found", { status: 404 });
      if (request.headers.get("Upgrade") !== "websocket") {
        return new Response("expected websocket", { status: 426 });
      }
      const role: Role = url.searchParams.get("role") === "display" ? "display" : "player";
      const token = url.searchParams.get("token") ?? undefined;
      const name = url.searchParams.get("name") ?? undefined;

      const result = room.connect({ token, name, role, now: Date.now() });
      if (!result.ok) return new Response(result.reason, { status: 403 });

      const pair = new WebSocketPair();
      const [client, server] = [pair[0], pair[1]];
      server.serializeAttachment({ memberId: result.member.id } satisfies Attachment);
      this.ctx.acceptWebSocket(server);
      this.deliver(result.outbound);
      await this.save();
      await this.armAlarm(null);
      return new Response(null, { status: 101, webSocket: client });
    }

    if (url.pathname === "/info") {
      const room = await this.load();
      if (!room) return new Response("room not found", { status: 404 });
      return Response.json({ code: room.state.code, phase: room.state.phase });
    }

    return new Response("not found", { status: 404 });
  }

  override async webSocketMessage(ws: WebSocket, data: string | ArrayBuffer): Promise<void> {
    const room = await this.load();
    if (!room) return ws.close(1011, "room gone");
    const { memberId } = ws.deserializeAttachment() as Attachment;
    const msg = typeof data === "string" ? parseClientMessage(data) : null;
    if (!msg) {
      ws.send(JSON.stringify({ t: "error", message: "malformed message" }));
      return;
    }
    const result = room.handle(memberId, msg, Date.now());
    await this.finish(result);
  }

  override async webSocketClose(ws: WebSocket): Promise<void> {
    const room = await this.load();
    if (!room) return;
    const { memberId } = ws.deserializeAttachment() as Attachment;
    // Only mark disconnected if no other socket of this member remains.
    const stillOpen = this.ctx
      .getWebSockets()
      .some((s) => s !== ws && (s.deserializeAttachment() as Attachment).memberId === memberId);
    if (stillOpen) return;
    const outbound = room.disconnect(memberId, Date.now());
    this.deliver(outbound);
    await this.save();
  }

  override async webSocketError(ws: WebSocket): Promise<void> {
    await this.webSocketClose(ws);
  }

  override async alarm(): Promise<void> {
    const room = await this.load();
    if (!room) return;
    const now = Date.now();
    const idle = now - room.state.lastActivity;
    const anyone = this.ctx.getWebSockets().length > 0;
    if (!anyone && idle >= ROOM_TTL_MS) {
      await this.ctx.storage.deleteAll();
      this.room = null;
      return;
    }
    const result = room.botTurn(now);
    await this.finish(result);
  }

  private async finish(result: StepResult): Promise<void> {
    this.deliver(result.outbound);
    await this.save();
    await this.armAlarm(result.botDueIn);
  }

  /**
   * One alarm serves both the bot timer and room expiry. The due time is derived from room
   * state (not from the last message) so a ping or a rejected action can never cancel a
   * pending bot turn, and an already-armed earlier alarm is never pushed back.
   */
  private async armAlarm(_hint: number | null): Promise<void> {
    const room = this.room;
    if (!room) return;
    const now = Date.now();
    const expiry = room.state.lastActivity + ROOM_TTL_MS;
    const due = room.botDueIn();
    let at = due === null ? expiry : Math.min(expiry, now + due);
    const existing = await this.ctx.storage.getAlarm();
    if (existing !== null && existing > now && existing < at) at = existing;
    await this.ctx.storage.setAlarm(at);
  }

  private deliver(outbound: Outbound[]): void {
    const sockets = this.ctx.getWebSockets();
    for (const { to, msg } of outbound) {
      const text = JSON.stringify(msg);
      for (const ws of sockets) {
        const { memberId } = ws.deserializeAttachment() as Attachment;
        if (to === "all" || to === memberId) {
          try {
            ws.send(text);
          } catch {
            // Socket already closing; the close handler will clean up.
          }
        }
      }
    }
  }
}
