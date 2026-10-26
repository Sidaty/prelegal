import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GREETING, sendChat } from "./chat";
import { EMPTY_DRAFT } from "./documents";

beforeEach(() => vi.stubGlobal("document", { cookie: "" }));
afterEach(() => vi.unstubAllGlobals());

describe("sendChat", () => {
  it("posts the conversation and fields, and returns the AI's reply", async () => {
    const updated = { ...EMPTY_DRAFT, type: "mutual-nda" };
    const fetchMock = vi.fn().mockResolvedValue(Response.json({ reply: "Noted.", document: updated }));
    vi.stubGlobal("fetch", fetchMock);
    const messages = [GREETING, { role: "user" as const, text: "I need an NDA" }];

    const result = await sendChat(messages, EMPTY_DRAFT);

    expect(result).toEqual({ reply: "Noted.", document: updated });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/chat");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body)).toEqual({ messages, document: EMPTY_DRAFT });
  });

  it("rejects when the server fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 503 })));

    await expect(sendChat([GREETING], EMPTY_DRAFT)).rejects.toThrow("status 503");
  });
});
