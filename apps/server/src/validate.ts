import type { Action, ClientMessage } from "@shiny/core";
import { CELLS } from "@shiny/core";

const isInt = (v: unknown): v is number => typeof v === "number" && Number.isInteger(v);
const isCell = (v: unknown): v is number => isInt(v) && v >= 0 && v < CELLS;
const isSeat = (v: unknown): v is number => isInt(v) && v >= 0 && v < 5;

function parseAction(a: unknown): Action | null {
  if (!a || typeof a !== "object") return null;
  const o = a as Record<string, unknown>;
  if (!isSeat(o.seat)) return null;
  if (o.type === "answer")
    return typeof o.yes === "boolean" ? { type: "answer", seat: o.seat, yes: o.yes } : null;
  if (!isCell(o.cell)) return null;
  switch (o.type) {
    case "placeCube":
      return { type: "placeCube", seat: o.seat, cell: o.cell };
    case "search":
      return { type: "search", seat: o.seat, cell: o.cell };
    case "ask":
      return isSeat(o.target)
        ? { type: "ask", seat: o.seat, target: o.target, cell: o.cell }
        : null;
    default:
      return null;
  }
}

/** Parse untrusted JSON text into a well-formed client message, or null. */
export function parseClientMessage(raw: string): ClientMessage | null {
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!data || typeof data !== "object") return null;
  const o = data as Record<string, unknown>;
  switch (o.t) {
    case "ping":
    case "addBot":
    case "start":
    case "rematch":
      return { t: o.t };
    case "setName":
      return typeof o.name === "string" ? { t: "setName", name: o.name } : null;
    case "removeMember":
      return typeof o.id === "string" ? { t: "removeMember", id: o.id } : null;
    case "settings": {
      const out: ClientMessage = { t: "settings" };
      if (typeof o.hard === "boolean") out.hard = o.hard;
      if (typeof o.setupCubes === "boolean") out.setupCubes = o.setupCubes;
      if (typeof o.penaltyCube === "boolean") out.penaltyCube = o.penaltyCube;
      if (typeof o.manualAnswers === "boolean") out.manualAnswers = o.manualAnswers;
      if (o.assist === "off" || o.assist === "normal" || o.assist === "full") out.assist = o.assist;
      return out;
    }
    case "action": {
      const action = parseAction(o.action);
      return action ? { t: "action", action } : null;
    }
    default:
      return null;
  }
}
