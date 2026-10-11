import { computed, signal } from "@preact/signals";
import type { Clue, GameEvent, RoomView, ServerMessage } from "@shiny/core";

export type ConnStatus = "idle" | "connecting" | "open" | "reconnecting" | "closed";

export const room = signal<RoomView | null>(null);
export const you = signal<{ id: string; token: string; role: "player" | "display" } | null>(null);
export const clues = signal<Clue[]>([]);
export const status = signal<ConnStatus>("idle");
export const lastEvents = signal<GameEvent[]>([]);
export const toast = signal<string | null>(null);
export const joinError = signal<string | null>(null);

export const mySeat = computed<number | null>(() => {
  const r = room.value;
  const me = you.value;
  if (!r || !me) return null;
  return r.members.find((m) => m.id === me.id)?.seat ?? null;
});

export const isHost = computed(
  () => !!room.value && !!you.value && room.value.hostId === you.value.id,
);

let toastTimer: ReturnType<typeof setTimeout> | undefined;
export function showToast(message: string): void {
  toast.value = message;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.value = null;
  }, 3200);
}

export function applyServerMessage(msg: ServerMessage): void {
  switch (msg.t) {
    case "welcome":
      you.value = msg.you;
      room.value = msg.room;
      break;
    case "room":
      if (msg.room.phase === "lobby") clues.value = [];
      room.value = msg.room;
      lastEvents.value = msg.events ?? [];
      break;
    case "clues":
      clues.value = msg.clues;
      break;
    case "error":
      showToast(msg.message);
      break;
    case "pong":
      break;
  }
}

export function resetStore(): void {
  room.value = null;
  you.value = null;
  clues.value = [];
  lastEvents.value = [];
  status.value = "idle";
}
