import { beforeEach, describe, expect, it, vi } from "vitest";
import { circleRequest, resetAuthScheme, unwrapRecord } from "../src/circle.js";

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
