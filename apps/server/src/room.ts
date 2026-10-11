/**
 * Pure room logic: no I/O, no Durable Object APIs. The DO adapter feeds it messages and
 * delivers the outbound messages it returns. This keeps every rule unit-testable in plain
 * vitest without the workers runtime.
 */
import {
  type Action,
  type AssistLevel,
  botAction,
  type ClientMessage,
  type Clue,
  clueCountFor,
  type GameEvent,
  type GameState,
  type GameView,
  generate,
  MAX_NAME,
  MAX_PLAYERS,
  type MemberView,
  MIN_PLAYERS,
  newGame,
  type Oracle,
  oracleFromClues,
  type Puzzle,
  pickSeed,
  Rng,
  type Role,
  type RoomPhase,
  type RoomSettings,
  type RoomView,
  reduce,
  type ServerMessage,
  seatClues,
} from "@shiny/core";

export interface Member {
  id: string;
  token: string;
  name: string;
  role: Role;
  bot: boolean;
  connected: boolean;
  joinedAt: number;
}

export interface RoomState {
  code: string;
  phase: RoomPhase;
  hostId: string | null;
  settings: RoomSettings;
  members: Member[];
  puzzle: Puzzle | null;
  /** memberId per seat index. */
  seatOwners: string[];
  seatCluesList: Clue[][];
  game: GameState | null;
  createdAt: number;
  lastActivity: number;
}

export type Outbound = { to: "all" | string; msg: ServerMessage };

export interface StepResult {
  outbound: Outbound[];
  /** Milliseconds until a bot must move, or null. */
  botDueIn: number | null;
}

export const BOT_DELAY_MS = 1200;

export function newRoomState(code: string, now: number): RoomState {
  return {
    code,
    phase: "lobby",
    hostId: null,
    settings: { hard: false, assist: "normal" },
    members: [],
    puzzle: null,
    seatOwners: [],
    seatCluesList: [],
    game: null,
    createdAt: now,
    lastActivity: now,
  };
}

const ASSIST: AssistLevel[] = ["off", "normal", "full"];

function cleanName(raw: unknown, fallback: string): string {
  if (typeof raw !== "string") return fallback;
  const name = raw.replace(/\s+/g, " ").trim().slice(0, MAX_NAME);
  return name.length > 0 ? name : fallback;
}

export class Room {
  constructor(
    public state: RoomState,
    private readonly rand: { id: () => string; seed: () => number },
  ) {}

  private randomId(): string {
    return this.rand.id();
  }

  // ── Views ───────────────────────────────────────────────────────────────

  private seatOf(memberId: string): number | null {
    const i = this.state.seatOwners.indexOf(memberId);
    return i === -1 ? null : i;
  }

  private memberView(m: Member): MemberView {
    return {
      id: m.id,
      name: m.name,
      role: m.role,
      bot: m.bot,
      connected: m.connected,
      seat: this.seatOf(m.id),
    };
  }

  private gameView(): GameView | null {
    const { puzzle, game, seatOwners } = this.state;
    if (!puzzle || !game) return null;
    const finished = game.phase === "finished";
    return {
      map: puzzle.map,
      seats: seatOwners.map((memberId, seat) => {
        const m = this.state.members.find((x) => x.id === memberId);
        return { seat, memberId, name: m?.name ?? "?", bot: m?.bot ?? false };
      }),
      phase: game.phase,
      turn: game.turn,
      pendingCube: game.pendingCube,
      markers: game.markers,
      winner: game.winner,
      solution: finished ? puzzle.solution : null,
      allClues: finished ? this.state.seatCluesList : null,
    };
  }

  view(): RoomView {
    const s = this.state;
    return {
      code: s.code,
      phase: s.phase,
      hostId: s.hostId,
      settings: s.settings,
      members: s.members.map((m) => this.memberView(m)),
      game: this.gameView(),
    };
  }

  private broadcast(events?: GameEvent[]): Outbound[] {
    const msg: ServerMessage = events
      ? { t: "room", room: this.view(), events }
      : { t: "room", room: this.view() };
    return [{ to: "all", msg }];
  }

  private error(to: string, message: string): StepResult {
    return { outbound: [{ to, msg: { t: "error", message } }], botDueIn: null };
  }

  private cluesFor(memberId: string): Outbound[] {
    const seat = this.seatOf(memberId);
    if (seat === null || !this.state.game) return [];
    return [{ to: memberId, msg: { t: "clues", clues: this.state.seatCluesList[seat] ?? [] } }];
  }

  // ── Connections ─────────────────────────────────────────────────────────

  /**
   * A socket arrived. Reconnect by token when it matches a member, else create a member.
   * Returns the member and what to send.
   */
  connect(opts: {
    token?: string | undefined;
    name?: string | undefined;
    role: Role;
    now: number;
  }): { ok: true; member: Member; outbound: Outbound[] } | { ok: false; reason: string } {
    const s = this.state;
    s.lastActivity = opts.now;
    let member = opts.token ? s.members.find((m) => m.token === opts.token && !m.bot) : undefined;

    if (!member) {
      if (opts.role === "player") {
        if (s.phase !== "lobby")
          return { ok: false, reason: "game already started; join as display" };
        if (this.playerCount() >= MAX_PLAYERS) return { ok: false, reason: "room is full" };
      }
      const n = s.members.filter((m) => m.role === "player").length + 1;
      member = {
        id: this.randomId(),
        token: this.randomId() + this.randomId(),
        name: cleanName(opts.name, opts.role === "display" ? "TV" : `Jogador ${n}`),
        role: opts.role,
        bot: false,
        connected: true,
        joinedAt: opts.now,
      };
      s.members.push(member);
      if (member.role === "player" && s.hostId === null) s.hostId = member.id;
    } else {
      member.connected = true;
      if (opts.name !== undefined && s.phase === "lobby")
        member.name = cleanName(opts.name, member.name);
    }

    const outbound: Outbound[] = [
      {
        to: member.id,
        msg: {
          t: "welcome",
          you: { id: member.id, token: member.token, role: member.role },
          room: this.view(),
        },
      },
      ...this.cluesFor(member.id),
      ...this.broadcast(),
    ];
    return { ok: true, member, outbound };
  }

  disconnect(memberId: string, now: number): Outbound[] {
    const s = this.state;
    const m = s.members.find((x) => x.id === memberId);
    if (!m) return [];
    m.connected = false;
    s.lastActivity = now;
    // Lobby: drop disconnected humans; hand the host role over if needed.
    if (s.phase === "lobby") {
      s.members = s.members.filter((x) => x.id !== memberId);
      this.ensureHost();
    }
    return this.broadcast();
  }

  private ensureHost(): void {
    const s = this.state;
    if (s.hostId && s.members.some((m) => m.id === s.hostId)) return;
    const next = s.members.find((m) => m.role === "player" && !m.bot);
    s.hostId = next ? next.id : null;
  }

  private playerCount(): number {
    return this.state.members.filter((m) => m.role === "player").length;
  }

  // ── Messages ────────────────────────────────────────────────────────────

  handle(memberId: string, msg: ClientMessage, now: number): StepResult {
    const s = this.state;
    const me = s.members.find((m) => m.id === memberId);
    if (!me) return this.error(memberId, "unknown member");
    s.lastActivity = now;
    const isHost = s.hostId === memberId;

    switch (msg.t) {
      case "ping":
        return { outbound: [{ to: memberId, msg: { t: "pong" } }], botDueIn: null };

      case "setName": {
        if (s.phase !== "lobby") return this.error(memberId, "cannot rename during a game");
        me.name = cleanName(msg.name, me.name);
        return { outbound: this.broadcast(), botDueIn: null };
      }

      case "addBot": {
        if (!isHost) return this.error(memberId, "only the host can add bots");
        if (s.phase !== "lobby") return this.error(memberId, "game already started");
        if (this.playerCount() >= MAX_PLAYERS) return this.error(memberId, "room is full");
        const n = s.members.filter((m) => m.bot).length + 1;
        s.members.push({
          id: this.randomId(),
          token: "",
          name: `Bot ${n}`,
          role: "player",
          bot: true,
          connected: true,
          joinedAt: now,
        });
        return { outbound: this.broadcast(), botDueIn: null };
      }

      case "removeMember": {
        if (!isHost) return this.error(memberId, "only the host can remove members");
        if (s.phase !== "lobby") return this.error(memberId, "game already started");
        if (msg.id === memberId) return this.error(memberId, "host cannot remove themselves");
        s.members = s.members.filter((m) => m.id !== msg.id);
        return { outbound: this.broadcast(), botDueIn: null };
      }

      case "settings": {
        if (!isHost) return this.error(memberId, "only the host can change settings");
        if (s.phase !== "lobby") return this.error(memberId, "game already started");
        if (typeof msg.hard === "boolean") s.settings.hard = msg.hard;
        if (msg.assist && ASSIST.includes(msg.assist)) s.settings.assist = msg.assist;
        return { outbound: this.broadcast(), botDueIn: null };
      }

      case "start": {
        if (!isHost) return this.error(memberId, "only the host can start");
        if (s.phase !== "lobby") return this.error(memberId, "game already started");
        const n = this.playerCount();
        if (n < MIN_PLAYERS || n > MAX_PLAYERS)
          return this.error(memberId, `need ${MIN_PLAYERS}–${MAX_PLAYERS} players (have ${n})`);
        return this.startGame(now);
      }

      case "rematch": {
        if (!isHost) return this.error(memberId, "only the host can start a rematch");
        if (s.phase !== "finished") return this.error(memberId, "game is not finished");
        s.phase = "lobby";
        s.game = null;
        s.puzzle = null;
        s.seatOwners = [];
        s.seatCluesList = [];
        // Drop humans who left during the game so they don't hold a seat.
        s.members = s.members.filter((m) => m.bot || m.connected);
        this.ensureHost();
        return { outbound: this.broadcast(), botDueIn: null };
      }

      case "action": {
        if (s.phase !== "playing" || !s.game) return this.error(memberId, "no game in progress");
        const seat = this.seatOf(memberId);
        if (seat === null) return this.error(memberId, "you are not seated");
        const action = msg.action;
        if (!action || typeof action !== "object" || action.seat !== seat)
          return this.error(memberId, "action must be for your own seat");
        return this.applyAction(action, memberId, now);
      }
    }
    return this.error(memberId, "unknown message");
  }

  // ── Game flow ───────────────────────────────────────────────────────────

  private startGame(now: number): StepResult {
    const s = this.state;
    s.lastActivity = now;
    const players = s.members
      .filter((m) => m.role === "player")
      .sort((a, b) => a.joinedAt - b.joinedAt);
    const rng = new Rng(this.rand.seed());
    const clueCount = clueCountFor(players.length);
    const seed = pickSeed(rng, clueCount, s.settings.hard);
    const puzzle = generate(seed, clueCount, s.settings.hard);
    if (!puzzle) return this.error(s.hostId ?? "", "internal: bank seed failed");

    const seatOrder = rng.shuffle([...players]);
    s.puzzle = puzzle;
    s.seatOwners = seatOrder.map((m) => m.id);
    s.seatCluesList = seatClues(puzzle, players.length);
    s.game = newGame(players.length);
    s.phase = "playing";

    const outbound: Outbound[] = [...this.broadcast()];
    for (const m of seatOrder) if (!m.bot) outbound.push(...this.cluesFor(m.id));
    return { outbound, botDueIn: this.botDue() };
  }

  private oracle(): Oracle {
    const { puzzle, seatCluesList } = this.state;
    if (!puzzle) throw new Error("no puzzle");
    return oracleFromClues(seatCluesList, puzzle.map);
  }

  private applyAction(action: Action, memberId: string | null, now: number): StepResult {
    const s = this.state;
    if (!s.game) return this.error(memberId ?? "", "no game");
    const r = reduce(s.game, action, this.oracle());
    if (!r.ok) return this.error(memberId ?? "", r.error);
    s.game = r.state;
    s.lastActivity = now;
    if (s.game.phase === "finished") s.phase = "finished";
    return { outbound: this.broadcast(r.events), botDueIn: this.botDue() };
  }

  /** Seat index that must act next, or null. */
  private actor(): number | null {
    const g = this.state.game;
    if (!g || g.phase === "finished") return null;
    return g.pendingCube ?? g.turn;
  }

  private botDue(): number | null {
    const seat = this.actor();
    if (seat === null) return null;
    const owner = this.state.members.find((m) => m.id === this.state.seatOwners[seat]);
    return owner?.bot ? BOT_DELAY_MS : null;
  }

  /** Called by the adapter when the bot timer fires. */
  botTurn(now: number): StepResult {
    const s = this.state;
    const seat = this.actor();
    if (seat === null || !s.puzzle || !s.game) return { outbound: [], botDueIn: null };
    const owner = s.members.find((m) => m.id === s.seatOwners[seat]);
    if (!owner?.bot) return { outbound: [], botDueIn: null };
    const rng = new Rng((now ^ seat) >>> 0);
    const action = botAction(
      s.game,
      seat,
      {
        map: s.puzzle.map,
        hard: s.puzzle.hard,
        cluesPerSeat: s.seatOwners.length === 2 ? 2 : 1,
        myClues: s.seatCluesList[seat] ?? [],
      },
      rng,
    );
    return this.applyAction(action, null, now);
  }
}
