import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { api, ApiError } from "./api";

const assign = vi.fn();

beforeEach(() => {
  vi.stubGlobal("document", { cookie: "JSESSIONID=x; XSRF-TOKEN=abc%3D123" });
  vi.stubGlobal("window", { location: { assign } });
});

afterEach(() => {
  vi.unstubAllGlobals();
  assign.mockReset();
});

describe("api", () => {
  it("sends JSON with the CSRF token from the cookie, and parses the JSON reply", async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json({ id: 1 }));
    vi.stubGlobal("fetch", fetchMock);

    expect(await api("/api/documents", "POST", { title: "NDA" })).toEqual({ id: 1 });
    const [path, init] = fetchMock.mock.calls[0];
    expect(path).toBe("/api/documents");
    expect(init).toMatchObject({ method: "POST", body: '{"title":"NDA"}' });
    expect(init.headers).toMatchObject({ "Content-Type": "application/json", "X-XSRF-TOKEN": "abc=123" });
  });

  it("resolves empty replies, such as signing out, to undefined", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 200 })));

    expect(await api("/api/auth/logout", "POST")).toBeUndefined();
  });

  it("rejects failed requests with their status", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 409 })));

    await expect(api("/api/auth/register", "POST", {})).rejects.toEqual(new ApiError(409, "/api/auth/register"));
  });

  it("sends signed-out users to sign in, except from the sign in calls themselves", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 401 })));

    await expect(api("/api/documents")).rejects.toBeInstanceOf(ApiError);
    expect(assign).toHaveBeenCalledWith("/");
    assign.mockReset();
    await expect(api("/api/auth/login", "POST", {})).rejects.toBeInstanceOf(ApiError);
    expect(assign).not.toHaveBeenCalled();
  });
});
