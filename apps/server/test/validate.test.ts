import { describe, expect, it } from "vitest";
import { parseClientMessage } from "../src/validate";

describe("parseClientMessage", () => {
  it("accepts well-formed messages", () => {
    expect(parseClientMessage('{"t":"ping"}')).toEqual({ t: "ping" });
    expect(parseClientMessage('{"t":"setName","name":"Ana"}')).toEqual({
      t: "setName",
      name: "Ana",
    });
    expect(parseClientMessage('{"t":"settings","hard":true,"assist":"off","junk":1}')).toEqual({
      t: "settings",
      hard: true,
      assist: "off",
    });
    expect(
      parseClientMessage(
        '{"t":"action","action":{"type":"ask","seat":0,"target":2,"cell":17,"x":1}}',
      ),
    ).toEqual({ t: "action", action: { type: "ask", seat: 0, target: 2, cell: 17 } });
  });

  it("rejects garbage", () => {
    expect(parseClientMessage("nope")).toBeNull();
    expect(parseClientMessage('{"t":"hack"}')).toBeNull();
    expect(
      parseClientMessage('{"t":"action","action":{"type":"search","seat":0,"cell":999}}'),
    ).toBeNull();
    expect(
      parseClientMessage('{"t":"action","action":{"type":"ask","seat":0,"cell":1}}'),
    ).toBeNull();
    expect(parseClientMessage('{"t":"setName","name":5}')).toBeNull();
  });
});
