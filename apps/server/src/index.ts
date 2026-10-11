import { CODE_ALPHABET, CODE_LENGTH } from "@shiny/core";
import type { Env } from "./room-do";

export { RoomDO } from "./room-do";

function randomCode(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(CODE_LENGTH));
  let code = "";
  for (const b of bytes) code += CODE_ALPHABET[b % CODE_ALPHABET.length];
  return code;
}

const CODE_RE = new RegExp(`^[${CODE_ALPHABET}]{${CODE_LENGTH}}$`);

function json(data: unknown, status = 200): Response {
  return Response.json(data, { status, headers: { "cache-control": "no-store" } });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const parts = url.pathname.split("/").filter(Boolean);

    // POST /api/rooms → { code }
    if (request.method === "POST" && url.pathname === "/api/rooms") {
      for (let attempt = 0; attempt < 5; attempt++) {
        const code = randomCode();
        const stub = env.ROOMS.get(env.ROOMS.idFromName(code));
        const res = await stub.fetch(`https://room/create?code=${code}`, { method: "POST" });
        if (res.status === 201) return json({ code }, 201);
      }
      return json({ error: "could not allocate a room code" }, 503);
    }

    // /api/rooms/:code and /api/rooms/:code/ws
    if (parts[0] === "api" && parts[1] === "rooms" && parts[2]) {
      const code = parts[2].toUpperCase();
      if (!CODE_RE.test(code)) return json({ error: "invalid room code" }, 400);
      const stub = env.ROOMS.get(env.ROOMS.idFromName(code));
      if (parts[3] === "ws") {
        const target = new URL("https://room/ws");
        target.search = url.search;
        return stub.fetch(new Request(target, request));
      }
      if (parts.length === 3 && request.method === "GET") {
        const res = await stub.fetch("https://room/info");
        return res.status === 404 ? json({ error: "room not found" }, 404) : res;
      }
    }

    return json({ error: "not found" }, 404);
  },
} satisfies ExportedHandler<Env>;
