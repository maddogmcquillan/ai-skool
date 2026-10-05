import { describe, expect, it, vi } from "vitest";
import { chunkMarkdown, KnowledgeBase } from "../src/bot/knowledge.js";
import { createApp, type ServerConfig } from "../src/server.js";

const lesson = `# Build Your First Chatbot\n\n## Give your bot a memory\nTo make the bot remember a name, store it in a variable after the first message and reuse it in later replies.\n`;
const kb = new KnowledgeBase([...chunkMarkdown("00-faq.md", "# FAQ\n\n## Rules\nBe kind.\n"), ...chunkMarkdown("chatbot/02-memory.md", lesson)]);

function cfg(overrides: Partial<ServerConfig> = {}): ServerConfig {
  return {
    hookSecret: "s3cret",
    dryRun: true,
    capi: { pixelId: "123", accessToken: "tok", apiVersion: "v25.0", defaultSourceUrl: "https://learn.example.com/checkout/x", currency: "USD" },
    answer: { model: "claude-opus-5", effort: "medium", botAuthorEmail: "coach@example.com" },
    knowledgeDir: "./knowledge",
    ...overrides,
  };
}

const headers = { "content-type": "application/json", "x-hook-secret": "s3cret" };

describe("webhook auth", () => {
  it("rejects calls without the shared secret", async () => {
    const app = await createApp(cfg(), { kb });
    const res = await app.request("/hooks/circle/charge", { method: "POST", headers: { "content-type": "application/json" }, body: "{}" });
    expect(res.status).toBe(401);
  });

  it("serves healthz without auth", async () => {
    const app = await createApp(cfg(), { kb });
    const res = await app.request("/healthz");
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ ok: true, dryRun: true, circle: null });
  });

  it("reports Circle API usage on healthz when a token is configured", async () => {
    const stats = { total: 12, since: "2026-10-03T00:00:00.000Z", perDay: 288, perMonth: 8640, byPath: { "GET /posts": 12 } };
    const app = await createApp(cfg(), { kb, circleStats: () => stats });
    expect(await (await app.request("/healthz")).json()).toMatchObject({ circle: stats });
  });
});

describe("POST /hooks/circle/nudge", () => {
  it("wakes both pollers with the header secret and reports which ones ran", async () => {
    const nudge = vi.fn((_what: string) => true);
    const app = await createApp(cfg(), { kb, nudge });
    const res = await app.request("/hooks/circle/nudge", { method: "POST", headers, body: '{"event":"post.created"}' });
    expect(res.status).toBe(202);
    expect(await res.json()).toEqual({ ok: true, nudged: ["coach", "meta"] });
    expect(nudge.mock.calls.map((c) => c[0])).toEqual(["coach", "meta"]);
  });

  it("takes the secret as a query parameter and a target in the path, for webhooks without headers", async () => {
    const nudge = vi.fn((what: string) => what === "coach");
    const app = await createApp(cfg(), { kb, nudge });
    const res = await app.request("/hooks/circle/nudge/coach?secret=s3cret", { method: "POST" });
    expect(res.status).toBe(202);
    expect(await res.json()).toEqual({ ok: true, nudged: ["coach"] });
    const meta = await app.request("/hooks/circle/nudge/meta?secret=s3cret", { method: "POST" });
    expect(await meta.json()).toEqual({ ok: true, nudged: [] }); // the Meta poller is off
  });

  it("rejects a wrong or missing secret, and never takes the query secret on data hooks", async () => {
    const nudge = vi.fn(() => true);
    const app = await createApp(cfg(), { kb, nudge });
    expect((await app.request("/hooks/circle/nudge", { method: "POST" })).status).toBe(401);
    expect((await app.request("/hooks/circle/nudge?secret=nope", { method: "POST" })).status).toBe(401);
    expect((await app.request("/hooks/circle/charge?secret=s3cret", { method: "POST", body: "{}" })).status).toBe(401);
    expect(nudge).not.toHaveBeenCalled();
  });

  it("404s an unknown target and answers without any poller wired", async () => {
    const app = await createApp(cfg(), { kb });
    expect((await app.request("/hooks/circle/nudge/zapier", { method: "POST", headers })).status).toBe(404);
    const res = await app.request("/hooks/circle/nudge", { method: "POST", headers });
    expect(res.status).toBe(202);
    expect(await res.json()).toEqual({ ok: true, nudged: [] });
  });
});

describe("POST /hooks/circle/charge", () => {
  it("validates required fields", async () => {
    const app = await createApp(cfg(), { kb });
    const res = await app.request("/hooks/circle/charge", { method: "POST", headers, body: JSON.stringify({ email: "a@b.co" }) });
    expect(res.status).toBe(400);
  });

  it("returns the built event in dry run without calling Meta", async () => {
    const fetchImpl = vi.fn();
    const app = await createApp(cfg(), { kb, fetchImpl: fetchImpl as unknown as typeof fetch });
    const res = await app.request("/hooks/circle/charge", { method: "POST", headers, body: JSON.stringify({ email: "a@b.co", amount: 50, paywall_key: "founding-member" }) });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.dryRun).toBe(true);
    expect(json.event.event_name).toBe("Purchase");
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("forwards to Meta when not in dry run", async () => {
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify({ events_received: 1 }), { status: 200 }));
    const app = await createApp(cfg({ dryRun: false }), { kb, fetchImpl: fetchImpl as unknown as typeof fetch });
    const res = await app.request("/hooks/circle/charge", { method: "POST", headers, body: JSON.stringify({ email: "a@b.co", amount: 50, paywall_key: "founding-member" }) });
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ ok: true, event_name: "Purchase", meta: { events_received: 1 } });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });
});

describe("POST /hooks/circle/question", () => {
  it("answers from the knowledge base in dry run and reports sources", async () => {
    const app = await createApp(cfg(), { kb });
    const res = await app.request("/hooks/circle/question", {
      method: "POST",
      headers,
      body: JSON.stringify({ post_id: 42, title: "Memory?", body_html: "<p>How do I make my <b>bot</b> remember my name?</p>", author_name: "Ava K", author_email: "ava@example.com", space_name: "Get Unstuck" }),
    });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.escalate).toBe(false);
    expect(json.sources).toEqual(["Build Your First Chatbot › Give your bot a memory"]);
    expect(json.answer).toContain("dry run");
  });

  it("escalates billing questions without touching the model", async () => {
    const app = await createApp(cfg(), { kb });
    const res = await app.request("/hooks/circle/question", { method: "POST", headers, body: JSON.stringify({ post_id: 1, body: "Can I get a refund?", author_name: "Sam" }) });
    const json = await res.json();
    expect(json.escalate).toBe(true);
    expect(json.escalation_reason).toBe("billing");
    expect(json.answer).toContain("Sam");
  });

  it("ignores the bot's own comments and admin posts", async () => {
    const app = await createApp(cfg(), { kb });
    const own = await app.request("/hooks/circle/question", { method: "POST", headers, body: JSON.stringify({ post_id: 1, body: "hi", author_email: "coach@example.com" }) });
    expect(await own.json()).toMatchObject({ skipped: true });
    const admin = await app.request("/hooks/circle/question", { method: "POST", headers, body: JSON.stringify({ post_id: 1, body: "hi", author_is_admin: true }) });
    expect(await admin.json()).toMatchObject({ skipped: true });
  });
});
