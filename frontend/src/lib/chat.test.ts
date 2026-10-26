import { afterEach, describe, expect, it, vi } from "vitest";
import { GREETING, sendChat } from "./chat";
import { DEFAULT_NDA } from "./nda";

afterEach(() => vi.unstubAllGlobals());

describe("sendChat", () => {
  it("posts the conversation and fields, and returns the AI's reply", async () => {
    const updated = { ...DEFAULT_NDA, governingLaw: "Delaware" };
    const fetchMock = vi.fn().mockResolvedValue(Response.json({ reply: "Noted.", nda: updated }));
    vi.stubGlobal("fetch", fetchMock);
    const messages = [GREETING, { role: "user" as const, text: "Delaware law" }];

    const result = await sendChat(messages, DEFAULT_NDA);

    expect(result).toEqual({ reply: "Noted.", nda: updated });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/chat");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body)).toEqual({ messages, nda: DEFAULT_NDA });
  });

  it("rejects when the server fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 503 })));

    await expect(sendChat([GREETING], DEFAULT_NDA)).rejects.toThrow("status 503");
  });
});
