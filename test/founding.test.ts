import { describe, expect, it, vi } from "vitest";
import { chunkMarkdown, KnowledgeBase } from "../src/bot/knowledge.js";
import { resetAuthScheme } from "../src/circle.js";
import { FoundingCounter } from "../src/founding.js";
import { createApp, type ServerConfig } from "../src/server.js";

type Charge = { id: number; status?: string; paywall_name?: string | null; community_member_email?: string | null; community_member_id?: number | null };

function circleFake(pages: Charge[][]) {
  const calls: string[] = [];
  const fetchImpl = vi.fn(async (url: string) => {
    const u = new URL(url);
    calls.push(u.search);
    const page = Number(u.searchParams.get("page") ?? 1);
    const records = pages[page - 1] ?? [];
    return new Response(JSON.stringify({ records, has_next_page: page < pages.length }), { status: 200, headers: { "content-type": "application/json" } });
  });
  return { fetchImpl: fetchImpl as unknown as typeof fetch, calls };
}

describe("FoundingCounter", () => {
  it("counts distinct paying families across pages, ignores other paywalls, and caps at the offer", async () => {
    resetAuthScheme();
    const { fetchImpl, calls } = circleFake([
      [
        { id: 1, status: "paid", paywall_name: "Founding Member", community_member_email: "Ann@Example.com" },
        { id: 2, status: "paid", paywall_name: "Founding Member", community_member_email: "ann@example.com" }, // renewal, same family
        { id: 3, status: "paid", paywall_name: "Adult Course", community_member_email: "bob@example.com" },
        { id: 4, status: "refunded", paywall_name: "Founding Member", community_member_email: "cat@example.com" },
      ],
      [
        { id: 5, status: "paid", paywall_name: "Founding Member", community_member_id: 77, community_member_email: null },
        { id: 6, status: "paid", paywall_name: "Learn AI Founding Membership", community_member_email: "dee@example.com" }, // after the rename
      ],
    ]);
    let now = 1_000;
    const counter = new FoundingCounter(
      { circle: { token: "t", baseUrl: "https://api.test/v2" }, cap: 200, ttlMs: 60_000, paywallNames: ["Founding Member", "learn ai founding membership "] },
      fetchImpl,
      () => now,
    );
    expect(await counter.spots()).toMatchObject({ cap: 200, taken: 3 });
    expect(calls).toHaveLength(2);

    // Cached inside the TTL, refreshed after it.
    await counter.spots();
    expect(calls).toHaveLength(2);
    now += 61_000;
    await counter.spots();
    expect(calls).toHaveLength(4);
  });

  it("never reports more than the cap", async () => {
    resetAuthScheme();
    const many = Array.from({ length: 30 }, (_, i) => ({ id: i, status: "paid", community_member_email: `p${i}@x.com` }));
    const { fetchImpl } = circleFake([many]);
    const counter = new FoundingCounter({ circle: { token: "t", baseUrl: "https://api.test/v2" }, cap: 20, ttlMs: 1 }, fetchImpl);
    expect((await counter.spots()).taken).toBe(20);
  });

  it("keeps the last good answer when Circle fails", async () => {
    resetAuthScheme();
    let fail = false;
    const fetchImpl = vi.fn(async () => (fail ? new Response("down", { status: 503 }) : new Response(JSON.stringify({ records: [{ id: 1, status: "paid", community_member_email: "a@x.com" }], has_next_page: false }), { status: 200 })));
    let now = 0;
    const counter = new FoundingCounter({ circle: { token: "t", baseUrl: "https://api.test/v2" }, cap: 200, ttlMs: 10 }, fetchImpl as unknown as typeof fetch, () => now);
    expect((await counter.spots()).taken).toBe(1);
    fail = true;
    now = 100;
    expect((await counter.spots()).taken).toBe(1);
  });
});

describe("GET /api/founding-spots", () => {
  const kb = new KnowledgeBase(chunkMarkdown("00-faq.md", "# FAQ\n\nBe kind.\n"));
  const cfg: ServerConfig = {
    hookSecret: "s3cret",
    dryRun: true,
    capi: { pixelId: "", accessToken: "", apiVersion: "v25.0", defaultSourceUrl: "", currency: "USD" },
    answer: { model: "claude-opus-5", effort: "medium" },
    knowledgeDir: "./knowledge",
  };

  it("serves the count with a short cache and 404s when not configured", async () => {
    const app = await createApp(cfg, { kb, foundingSpots: async () => ({ cap: 200, taken: 37, updatedAt: "2026-09-29T00:00:00Z" }) });
    const res = await app.request("/api/founding-spots");
    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toContain("max-age=300");
    expect(await res.json()).toMatchObject({ cap: 200, taken: 37 });

    const off = await createApp(cfg, { kb });
    expect((await off.request("/api/founding-spots")).status).toBe(404);
    expect((await off.request("/api")).status).toBe(404);
  });
});
