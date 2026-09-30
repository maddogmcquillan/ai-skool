import { describe, expect, it } from "vitest";
import { chunkMarkdown, KnowledgeBase } from "../src/bot/knowledge.js";
import { createApp, type ServerConfig } from "../src/server.js";
import { StatsCounter } from "../src/stats.js";

describe("StatsCounter", () => {
  it("counts known events per page and per day, and rejects anything else", () => {
    let t = new Date("2026-09-30T23:00:00Z");
    const lines: string[] = [];
    const s = new StatsCounter(() => t, (l) => lines.push(l));
    expect(s.record("view", "ai-for-kids")).toBe(true);
    expect(s.record("cta_hero", "ai-for-kids")).toBe(true);
    t = new Date("2026-10-01T01:00:00Z");
    expect(s.record("view", "ai-for-kids")).toBe(true);
    expect(s.record("cta_offer_checkout", "ai-for-kids")).toBe(true);
    expect(s.record("purchase", "ai-for-kids")).toBe(false); // not a landing page event
    expect(s.record("view", "../etc/passwd")).toBe(false);
    expect(s.record("view", "")).toBe(false);
    expect(s.record(42, "ai-for-kids")).toBe(false);

    const snap = s.snapshot();
    expect(snap.totals["ai-for-kids"]).toEqual({ view: 2, cta_hero: 1, cta_offer_checkout: 1 });
    expect(snap.byDay["2026-09-30"]["ai-for-kids"]).toEqual({ view: 1, cta_hero: 1 });
    expect(snap.byDay["2026-10-01"]["ai-for-kids"]).toEqual({ view: 1, cta_offer_checkout: 1 });
    expect(lines).toHaveLength(4);
    expect(lines[0]).toBe("[track] 2026-09-30 ai-for-kids view");
  });

  it("caps the number of distinct pages so junk slugs cannot grow memory", () => {
    const s = new StatsCounter(() => new Date("2026-09-30T00:00:00Z"), () => {});
    for (let i = 0; i < 60; i++) s.record("view", `page-${i}`);
    expect(Object.keys(s.snapshot().totals)).toHaveLength(50);
    expect(s.record("view", "page-0")).toBe(true); // known page still counts
  });
});

describe("/api/track and /api/stats", () => {
  const kb = new KnowledgeBase(chunkMarkdown("00-faq.md", "# FAQ\n\nBe kind.\n"));
  const cfg: ServerConfig = {
    hookSecret: "s3cret",
    dryRun: true,
    capi: { pixelId: "", accessToken: "", apiVersion: "v25.0", defaultSourceUrl: "", currency: "USD" },
    answer: { model: "claude-opus-5", effort: "medium" },
    knowledgeDir: "./knowledge",
  };

  it("accepts beacons, reports aggregates without caching, and 404s when not configured", async () => {
    const stats = new StatsCounter(() => new Date("2026-09-30T12:00:00Z"), () => {});
    const app = await createApp(cfg, { kb, stats });
    const post = (body: string) => app.request("/api/track", { method: "POST", body, headers: { "content-type": "text/plain" } });
    expect((await post(JSON.stringify({ e: "view", p: "ai-for-kids" }))).status).toBe(204);
    expect((await post(JSON.stringify({ e: "scroll_75", p: "ai-for-kids" }))).status).toBe(204);
    expect((await post(JSON.stringify({ e: "nope", p: "ai-for-kids" }))).status).toBe(400);
    expect((await post("not json")).status).toBe(400);
    expect((await post("x".repeat(300))).status).toBe(413);

    const res = await app.request("/api/stats");
    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toBe("no-store");
    const snap = (await res.json()) as { totals: Record<string, Record<string, number>> };
    expect(snap.totals["ai-for-kids"]).toEqual({ view: 1, scroll_75: 1 });

    const off = await createApp(cfg, { kb });
    expect((await off.request("/api/stats")).status).toBe(404);
    expect((await off.request("/api/track", { method: "POST", body: "{}" })).status).toBe(404);
  });
});
