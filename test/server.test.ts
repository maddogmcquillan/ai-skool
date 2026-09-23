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
    expect(await res.json()).toMatchObject({ ok: true, dryRun: true });
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
      body: JSON.stringify({ post_id: 42, title: "Memory?", body_html: "<p>How do I make my <b>bot</b> remember my name?</p>", author_name: "Ava K", author_email: "ava@example.com", space_name: "Ask Coach" }),
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
