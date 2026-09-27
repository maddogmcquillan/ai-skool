import { describe, expect, it, vi } from "vitest";
import { CoachLoop, type CoachLoopConfig } from "../src/bot/coachLoop.js";
import { chunkMarkdown, KnowledgeBase } from "../src/bot/knowledge.js";
import type { composeReply } from "../src/bot/respond.js";
import { resetAuthScheme } from "../src/circle.js";

const kb = new KnowledgeBase([...chunkMarkdown("00-faq.md", "# FAQ\n\n## Rules\nBe kind.\n"), ...chunkMarkdown("classroom/11-make-a-chatbot.md", "# Make a Chatbot\n\n## Memory\nStore the name in a variable.\n")]);
const COACH = "coach@example.com";
const TEAM = "team@example.com";
const NOW = new Date("2026-09-27T12:00:00Z");

function cfg(overrides: Partial<CoachLoopConfig> = {}): CoachLoopConfig {
  return {
    circle: { token: "tok", baseUrl: "https://api.test/v2" },
    spaceSlug: "ask-coach",
    botAuthorEmail: COACH,
    ignoreAuthorEmails: [TEAM],
    intervalMs: 60_000,
    lookbackDays: 14,
    reply: { model: "claude-opus-5", effort: "low", dryRun: false },
    ...overrides,
  };
}

/** A fake Circle: three posts in Ask Coach, one already answered by Coach, one by the team. */
function fakeCircle(posts: Array<Record<string, unknown>>, commentsByPost: Record<number, Array<Record<string, unknown>>>) {
  const posted: Array<Record<string, unknown>> = [];
  const fetchImpl = vi.fn(async (url: string, init?: RequestInit) => {
    const u = new URL(url);
    const json = (body: unknown) => new Response(JSON.stringify(body), { status: 200, headers: { "content-type": "application/json" } });
    if (u.pathname.endsWith("/spaces")) return json({ records: [{ id: 3, slug: "welcome", name: "Welcome" }, { id: 7, slug: "ask-coach", name: "Ask Coach" }], has_next_page: false });
    if (u.pathname.endsWith("/posts")) {
      expect(u.searchParams.get("space_id")).toBe("7");
      return json({ records: posts, has_next_page: false });
    }
    if (u.pathname.endsWith("/comments") && init?.method === "GET") return json({ records: commentsByPost[Number(u.searchParams.get("post_id"))] ?? [] });
    if (u.pathname.endsWith("/comments") && init?.method === "POST") {
      posted.push(JSON.parse(String(init.body)));
      return json({ id: 900 + posted.length });
    }
    return new Response("not found", { status: 404 });
  });
  return { fetchImpl: fetchImpl as unknown as typeof fetch, posted };
}

const posts = [
  { id: 101, name: "How do I give my chatbot memory?", body: { body: "<p>It forgets my name every time.</p>" }, user_email: "kid@example.com", user_name: "Sam Lee", space_name: "Ask Coach", published_at: "2026-09-27T10:00:00Z" },
  { id: 102, name: "Welcome to Ask Coach", body: { body: "<p>How to ask.</p>" }, user_email: TEAM, user_name: "Learn AI Team", space_name: "Ask Coach", published_at: "2026-09-20T10:00:00Z" },
  { id: 103, name: "Already answered", body: { body: "<p>Old question.</p>" }, user_email: "kid2@example.com", user_name: "Ava", space_name: "Ask Coach", published_at: "2026-09-26T10:00:00Z" },
  { id: 104, name: "Ancient thread", body: { body: "<p>From ages ago.</p>" }, user_email: "kid3@example.com", user_name: "Max", space_name: "Ask Coach", published_at: "2026-06-01T10:00:00Z" },
];
const comments = { 103: [{ id: 1, user: { email: COACH, name: "Coach" } }] };

describe("CoachLoop", () => {
  it("answers the new member post once and leaves the team, answered and old posts alone", async () => {
    resetAuthScheme();
    const { fetchImpl, posted } = fakeCircle(posts, comments);
    const compose = vi.fn<typeof composeReply>(async () => ({ answer: "Store the name in a variable.", escalate: false, sources: ["classroom/11-make-a-chatbot.md"] }));
    const loop = new CoachLoop(cfg(), { kb: () => kb, fetchImpl, now: () => NOW, log: () => {}, compose });

    const first = await loop.tick();
    expect(first).toEqual({ answered: 1, skipped: 3, failed: 0 });
    expect(posted).toEqual([{ post_id: 101, body: "Store the name in a variable.", parent_comment_id: undefined, skip_notifications: false }]);
    expect(compose).toHaveBeenCalledTimes(1);
    expect(compose.mock.calls[0][0]).toMatchObject({ title: "How do I give my chatbot memory?", authorName: "Sam Lee", spaceName: "Ask Coach" });

    const second = await loop.tick();
    expect(second).toEqual({ answered: 0, skipped: 0, failed: 0 });
    expect(posted).toHaveLength(1);
    expect(loop.status()).toMatchObject({ enabled: true, spaceId: 7, ticks: 2, answered: 1, skipped: 3, escalated: 0 });
  });

  it("escalates billing questions with the human hand-off reply and no model call", async () => {
    resetAuthScheme();
    const billing = [{ id: 201, name: "Refund?", body: { body: "<p>Can I get a refund for this month?</p>" }, user_email: "parent@example.com", user_name: "Jordan Ruiz", space_name: "Ask Coach", published_at: "2026-09-27T09:00:00Z" }];
    const { fetchImpl, posted } = fakeCircle(billing, {});
    const loop = new CoachLoop(cfg(), { kb: () => kb, fetchImpl, now: () => NOW, log: () => {} });

    await loop.tick();
    expect(posted).toHaveLength(1);
    expect(posted[0].body).toMatch(/^Hi Jordan! .*real person on our team/);
    expect(loop.status()).toMatchObject({ answered: 1, escalated: 1 });
  });

  it("does not post in dry run", async () => {
    resetAuthScheme();
    const { fetchImpl, posted } = fakeCircle(posts.slice(0, 1), {});
    const loop = new CoachLoop(cfg({ reply: { model: "claude-opus-5", effort: "low", dryRun: true } }), { kb: () => kb, fetchImpl, now: () => NOW, log: () => {} });
    const result = await loop.tick();
    expect(result).toEqual({ answered: 0, skipped: 1, failed: 0 });
    expect(posted).toHaveLength(0);
  });

  it("retries a failed post on the next tick and gives up after three failures", async () => {
    resetAuthScheme();
    const { fetchImpl, posted } = fakeCircle(posts.slice(0, 1), {});
    const compose = vi.fn<typeof composeReply>(async () => {
      throw new Error("model down");
    });
    const loop = new CoachLoop(cfg(), { kb: () => kb, fetchImpl, now: () => NOW, log: () => {}, compose });
    expect(await loop.tick()).toEqual({ answered: 0, skipped: 0, failed: 1 });
    expect(await loop.tick()).toEqual({ answered: 0, skipped: 0, failed: 1 });
    expect(await loop.tick()).toEqual({ answered: 0, skipped: 0, failed: 1 });
    expect(await loop.tick()).toEqual({ answered: 0, skipped: 0, failed: 0 });
    expect(posted).toHaveLength(0);
    expect(compose).toHaveBeenCalledTimes(3);
  });

  it("records a missing space as lastError instead of throwing", async () => {
    resetAuthScheme();
    const { fetchImpl } = fakeCircle([], {});
    const loop = new CoachLoop(cfg({ spaceSlug: "nope" }), { kb: () => kb, fetchImpl, now: () => NOW, log: () => {} });
    await loop.tick();
    expect(loop.status().lastError).toMatch(/no space with slug "nope"/);
  });
});
