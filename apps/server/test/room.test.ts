import { botAction, type Clue, type ServerMessage } from "@shiny/core";
import { describe, expect, it } from "vitest";
import { BOT_DELAY_MS, newRoomState, type Outbound, Room } from "../src/room";

let counter = 0;
const rand = { id: () => `id${++counter}`, seed: () => 12345 };

function makeRoom() {
  counter = 0;
  return new Room(newRoomState("ABCD", 1000), rand);
}

function join(room: Room, name: string, role: "player" | "display" = "player") {
  const r = room.connect({ name, role, now: 1000 });
  if (!r.ok) throw new Error(r.reason);
  return r.member;
}

const msgsTo = (out: Outbound[], to: string) => out.filter((o) => o.to === to).map((o) => o.msg);
const errors = (out: Outbound[]) => out.map((o) => o.msg).filter((m) => m.t === "error");

describe("lobby", () => {
  it("first player becomes host, displays never do", () => {
    const room = makeRoom();
    const tv = join(room, "TV", "display");
    const a = join(room, "Ana");
    expect(room.state.hostId).toBe(a.id);
    expect(tv.role).toBe("display");
    const view = room.view();
    expect(view.members.map((m) => m.name)).toEqual(["TV", "Ana"]);
  });

  it("welcome carries the token used to reconnect", () => {
    const room = makeRoom();
    const r = room.connect({ name: "Ana", role: "player", now: 1 });
    if (!r.ok) throw new Error();
    const welcome = msgsTo(r.outbound, r.member.id)[0] as ServerMessage & { t: "welcome" };
    expect(welcome.t).toBe("welcome");
    expect(welcome.you.token).toBe(r.member.token);
    const again = room.connect({ token: r.member.token, role: "player", now: 2 });
    expect(again.ok && again.member.id).toBe(r.member.id);
    expect(room.state.members.length).toBe(1);
  });

  it("host adds and removes bots, others cannot", () => {
    const room = makeRoom();
    const a = join(room, "Ana");
    const b = join(room, "Bia");
    expect(errors(room.handle(b.id, { t: "addBot" }, 1).outbound).length).toBe(1);
    room.handle(a.id, { t: "addBot" }, 1);
    room.handle(a.id, { t: "addBot" }, 1);
    expect(
      room
        .view()
        .members.filter((m) => m.bot)
        .map((m) => m.name),
    ).toEqual(["Bot 1", "Bot 2"]);
    const bot = room.state.members.find((m) => m.bot) as { id: string };
    room.handle(a.id, { t: "removeMember", id: bot.id }, 1);
    expect(room.view().members.filter((m) => m.bot).length).toBe(1);
  });

  it("caps at 5 players and needs at least 2 to start", () => {
    const room = makeRoom();
    const a = join(room, "Ana");
    expect(errors(room.handle(a.id, { t: "start" }, 1).outbound)[0]).toMatchObject({
      message: expect.stringContaining("need 2"),
    });
    for (let i = 0; i < 4; i++) room.handle(a.id, { t: "addBot" }, 1);
    expect(errors(room.handle(a.id, { t: "addBot" }, 1).outbound).length).toBe(1);
    expect(room.connect({ name: "Late", role: "player", now: 1 }).ok).toBe(false);
    expect(room.connect({ name: "TV", role: "display", now: 1 }).ok).toBe(true);
  });

  it("settings are host-only and validated", () => {
    const room = makeRoom();
    const a = join(room, "Ana");
    room.handle(a.id, { t: "settings", hard: true, assist: "full" }, 1);
    expect(room.view().settings).toEqual({ hard: true, assist: "full" });
    room.handle(a.id, { t: "settings", assist: "nope" as "off" }, 1);
    expect(room.view().settings.assist).toBe("full");
  });

  it("leaving the lobby drops the member and hands the host over", () => {
    const room = makeRoom();
    const a = join(room, "Ana");
    const b = join(room, "Bia");
    room.disconnect(a.id, 2);
    expect(room.state.members.map((m) => m.id)).toEqual([b.id]);
    expect(room.state.hostId).toBe(b.id);
  });
});

describe("game", () => {
  function startedRoom(humans: number, bots: number, hard = false) {
    const room = makeRoom();
    const members = Array.from({ length: humans }, (_, i) => join(room, `H${i}`));
    const host = members[0] as { id: string };
    for (let i = 0; i < bots; i++) room.handle(host.id, { t: "addBot" }, 1);
    if (hard) room.handle(host.id, { t: "settings", hard: true }, 1);
    const start = room.handle(host.id, { t: "start" }, 2);
    return { room, members, host, start };
  }

  it("start deals private clues to humans only and hides the solution", () => {
    const { room, members, start } = startedRoom(2, 1);
    expect(room.state.phase).toBe("playing");
    for (const m of members) {
      const clues = msgsTo(start.outbound, m.id).filter((x) => x.t === "clues");
      expect(clues.length).toBe(1);
    }
    const roomMsgs = start.outbound.filter((o) => o.to === "all");
    expect(roomMsgs.length).toBe(1);
    const view = room.view();
    expect(view.game?.solution).toBeNull();
    expect(view.game?.allClues).toBeNull();
    expect(view.game?.seats.length).toBe(3);
    expect(JSON.stringify(view)).not.toContain("token");
  });

  it("rejects actions for another seat, out of turn, or from a display", () => {
    const { room, members } = startedRoom(2, 0);
    const a = members[0] as { id: string };
    const seatA = room.view().members.find((m) => m.id === a.id)?.seat as number;
    const wrong = room.handle(
      a.id,
      { t: "action", action: { type: "placeCube", seat: 1 - seatA, cell: 0 } },
      3,
    );
    expect(errors(wrong.outbound).length).toBe(1);
    const tv = join(room, "TV", "display");
    const fromTv = room.handle(
      tv.id,
      { t: "action", action: { type: "placeCube", seat: 0, cell: 0 } },
      3,
    );
    expect(errors(fromTv.outbound)[0]).toMatchObject({ message: "you are not seated" });
  });

  it("schedules bots and plays a full game to the solution", () => {
    const { room, members, start } = startedRoom(1, 2);
    const me = members[0] as { id: string };
    const myClues = (
      msgsTo(start.outbound, me.id).find((m) => m.t === "clues") as { clues: Clue[] }
    ).clues;
    let due = start.botDueIn;
    let now = 10;
    let steps = 0;
    while (room.state.phase === "playing") {
      if (due !== null) {
        expect(due).toBe(BOT_DELAY_MS);
        now += 1;
        const r = room.botTurn(now);
        expect(errors(r.outbound).length).toBe(0);
        due = r.botDueIn;
      } else {
        const g = room.state.game;
        const seat = room.view().members.find((m) => m.id === me.id)?.seat as number;
        const action = botAction(
          g as NonNullable<typeof g>,
          seat,
          { map: room.state.puzzle?.map as never, hard: false, cluesPerSeat: 1, myClues },
          { next: () => 0.5, pick: (arr: readonly unknown[]) => arr[0] } as never,
        );
        now += 1;
        const r = room.handle(me.id, { t: "action", action }, now);
        expect(errors(r.outbound).length).toBe(0);
        due = r.botDueIn;
      }
      if (++steps > 300) throw new Error("did not finish");
    }
    const view = room.view();
    expect(view.phase).toBe("finished");
    expect(view.game?.solution).toBe(room.state.puzzle?.solution);
    expect(view.game?.allClues?.length).toBe(3);
    expect(due).toBeNull();
  });

  it("rematch returns to the lobby keeping bots and connected humans", () => {
    const { room, host } = startedRoom(2, 1);
    expect(errors(room.handle(host.id, { t: "rematch" }, 5).outbound).length).toBe(1);
    room.state.phase = "finished";
    room.handle(host.id, { t: "rematch" }, 6);
    expect(room.state.phase).toBe("lobby");
    expect(room.state.game).toBeNull();
    expect(room.state.members.length).toBe(3);
  });

  it("late joiners during a game can only be displays", () => {
    const { room } = startedRoom(2, 0);
    expect(room.connect({ name: "Late", role: "player", now: 9 }).ok).toBe(false);
    expect(room.connect({ name: "TV", role: "display", now: 9 }).ok).toBe(true);
  });
});
