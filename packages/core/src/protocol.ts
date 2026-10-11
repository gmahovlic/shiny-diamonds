import type { Action, GameEvent, Marker, Phase, RuleError } from "./game";
import type { Cell } from "./hex";
import type { BeachMap, Clue } from "./types";

/** Wire protocol between clients and the room Durable Object. All JSON. */

export type Role = "player" | "display";
export type AssistLevel = "off" | "normal" | "full";
export type RoomPhase = "lobby" | "playing" | "finished";

export const MAX_PLAYERS = 5;
export const MIN_PLAYERS = 2;
export const MAX_NAME = 16;
export const CODE_LENGTH = 4;
/** Unambiguous uppercase letters for room codes (no I/O/Q). */
export const CODE_ALPHABET = "ABCDEFGHJKLMNPRSTUVWXYZ";

export interface RoomSettings {
  hard: boolean;
  assist: AssistLevel;
}

export interface MemberView {
  id: string;
  name: string;
  role: Role;
  bot: boolean;
  connected: boolean;
  /** Seat index once a game is running, else null. */
  seat: number | null;
}

export interface SeatView {
  seat: number;
  memberId: string;
  name: string;
  bot: boolean;
}

export interface GameView {
  map: BeachMap;
  seats: SeatView[];
  phase: Phase;
  turn: number;
  pendingCube: number | null;
  markers: Marker[];
  winner: number | null;
  /** Revealed only when the game is finished. */
  solution: Cell | null;
  /** Every seat's clues, revealed only when the game is finished. */
  allClues: Clue[][] | null;
}

export interface RoomView {
  code: string;
  phase: RoomPhase;
  hostId: string | null;
  settings: RoomSettings;
  members: MemberView[];
  game: GameView | null;
}

export type ClientMessage =
  | { t: "setName"; name: string }
  | { t: "addBot" }
  | { t: "removeMember"; id: string }
  | { t: "settings"; hard?: boolean; assist?: AssistLevel }
  | { t: "start" }
  | { t: "action"; action: Action }
  | { t: "rematch" }
  | { t: "ping" };

/** Why a room refused a message or a connection. */
export type ErrorCode =
  | RuleError
  | "unknown_member"
  | "rename_in_game"
  | "host_only"
  | "game_started"
  | "room_full"
  | "host_self_remove"
  | "need_players"
  | "not_finished"
  | "no_game"
  | "not_seated"
  | "own_seat_only"
  | "malformed"
  | "room_not_found"
  | "internal";

/** WebSocket close code used when a connection is refused with an ErrorCode as reason. */
export const WS_REFUSED = 4000;

export type ServerMessage =
  | { t: "welcome"; you: { id: string; token: string; role: Role }; room: RoomView }
  | { t: "room"; room: RoomView; events?: GameEvent[] }
  | { t: "clues"; clues: Clue[] }
  | { t: "error"; code: ErrorCode; params?: Record<string, string | number> }
  | { t: "pong" };
