import { beforeEach, describe, expect, it, vi } from "vitest";
import { circleCallStats, circleRequest, resetAuthScheme, resetCircleCallStats, unwrapRecord } from "../src/circle.js";

const cfg = { token: "abc123" };

describe("circleRequest auth", () => {
  beforeEach(() => resetAuthScheme());

  it("sends Bearer and returns parsed JSON", async () => {
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify({ ok: 1 }), { status: 200 }));
    const out = await circleRequest<{ ok: number }>(cfg, "GET", "/spaces", undefined, fetchImpl as unknown as typeof fetch);
    expect(out).toEqual({ ok: 1 });
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://app.circle.so/api/admin/v2/spaces");
    expect((init.headers as Record<string, string>).authorization).toBe("Bearer abc123");
  });

  it("falls back to the Token scheme on a 401 and remembers it", async () => {
    const fetchImpl = vi.fn(async (_url: string, init: RequestInit) => {
      const auth = (init.headers as Record<string, string>).authorization;
      return auth.startsWith("Token ")
        ? new Response(JSON.stringify({ records: [] }), { status: 200 })
        : new Response(JSON.stringify({ success: false, message: "The API token is invalid." }), { status: 401 });
    });
    await circleRequest(cfg, "GET", "/spaces", undefined, fetchImpl as unknown as typeof fetch);
    await circleRequest(cfg, "GET", "/space_groups", undefined, fetchImpl as unknown as typeof fetch);
    const auths = fetchImpl.mock.calls.map((c) => ((c as unknown as [string, RequestInit])[1].headers as Record<string, string>).authorization);
    expect(auths).toEqual(["Bearer abc123", "Token abc123", "Token abc123"]);
  });

  it("throws with Circle's message when both schemes are rejected", async () => {
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify({ success: false, message: "The API token is invalid." }), { status: 401 }));
    await expect(circleRequest(cfg, "GET", "/spaces", undefined, fetchImpl as unknown as typeof fetch)).rejects.toThrow(/401.*invalid/);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });
});

describe("unwrapRecord", () => {
  it("returns a record that comes back at the top level", () => {
    expect(unwrapRecord({ id: 7, name: "Kids", slug: "kids" }, "space_group")).toEqual({ id: 7, name: "Kids", slug: "kids" });
  });

  it("unwraps the { success, message, space } shape that POST /spaces returns", () => {
    const res = { success: true, message: "Space created.", space: { id: 2873048, name: "AI Foundations", slug: "ai-foundations" } };
    expect(unwrapRecord(res, "space").id).toBe(2873048);
  });

  it("throws with the raw body when neither shape carries an id", () => {
    expect(() => unwrapRecord({ success: true, message: "Space created." }, "space")).toThrow(/no "space" record.*Space created/);
    expect(() => unwrapRecord(null, "space")).toThrow(/no "space" record/);
  });
});

describe("circleCallStats", () => {
  beforeEach(() => {
    resetAuthScheme();
    resetCircleCallStats(0);
  });

  it("counts every request by method and path, without the query string", async () => {
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify({ records: [] }), { status: 200 }));
    await circleRequest(cfg, "GET", "/posts?space_id=7&per_page=20", undefined, fetchImpl as unknown as typeof fetch);
    await circleRequest(cfg, "GET", "/posts?space_id=7&per_page=20", undefined, fetchImpl as unknown as typeof fetch);
    await circleRequest(cfg, "POST", "/comments", { post_id: 1, body: "hi" }, fetchImpl as unknown as typeof fetch);
    const stats = circleCallStats(86_400_000);
    expect(stats.total).toBe(3);
    expect(stats.byPath).toEqual({ "GET /posts": 2, "POST /comments": 1 });
    expect(stats.since).toBe("1970-01-01T00:00:00.000Z");
    // Three calls in a day project to three a day and ninety a month.
    expect(stats.perDay).toBe(3);
    expect(stats.perMonth).toBe(90);
  });

  it("counts the Token retry as a second call, as Circle bills it", async () => {
    const fetchImpl = vi.fn(async (_url: string, init: RequestInit) => {
      const auth = (init.headers as Record<string, string>).authorization;
      return auth.startsWith("Token ") ? new Response("{}", { status: 200 }) : new Response("{}", { status: 401 });
    });
    await circleRequest(cfg, "GET", "/spaces", undefined, fetchImpl as unknown as typeof fetch);
    expect(circleCallStats().total).toBe(2);
  });

  it("spreads a boot burst over at least an hour before projecting a rate", async () => {
    const fetchImpl = vi.fn(async () => new Response("{}", { status: 200 }));
    for (let i = 0; i < 3; i++) await circleRequest(cfg, "GET", "/spaces", undefined, fetchImpl as unknown as typeof fetch);
    // Three calls one second after boot: 72 a day (3 an hour), not 259,200.
    expect(circleCallStats(1_000).perDay).toBe(72);
  });
});
