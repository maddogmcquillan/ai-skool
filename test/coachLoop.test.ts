import { describe, expect, it, vi } from "vitest";
import { CoachLoop, type CoachLoopConfig, type CommentRecord, type PostRecord } from "../src/bot/coachLoop.js";
import { chunkMarkdown, KnowledgeBase } from "../src/bot/knowledge.js";
import { escalationReply } from "../src/bot/policy.js";
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

const member = (id: number, name: string, email: string, title: string, html: string, published: string, comments = 0): PostRecord => ({
  id, name: title, body: { body: html }, user_email: email, user_name: name, space_name: "Ask Coach", published_at: published, comments_count: comments,
});
const comment = (id: number, email: string, name: string, html: string, created: string, parent: number | null = null): CommentRecord => ({
  id, parent_comment_id: parent, created_at: created, body: { body: html }, user: { email, name },
});

/** A fake Circle whose posts and comments the test can change between ticks. */
function fakeCircle(state: { posts: PostRecord[]; comments: Record<number, CommentRecord[]> }) {
  const posted: Array<Record<string, unknown>> = [];
  const calls = { comments: 0 };
  const fetchImpl = vi.fn(async (url: string, init?: RequestInit) => {
    const u = new URL(url);
    const json = (body: unknown) => new Response(JSON.stringify(body), { status: 200, headers: { "content-type": "application/json" } });
    if (u.pathname.endsWith("/spaces")) return json({ records: [{ id: 3, slug: "welcome", name: "Welcome" }, { id: 7, slug: "ask-coach", name: "Ask Coach" }], has_next_page: false });
    if (u.pathname.endsWith("/posts")) {
      expect(u.searchParams.get("space_id")).toBe("7");
      return json({ records: state.posts, has_next_page: false });
    }
    if (u.pathname.endsWith("/comments") && init?.method === "GET") {
      calls.comments++;
      return json({ records: state.comments[Number(u.searchParams.get("post_id"))] ?? [], has_next_page: false });
    }
    if (u.pathname.endsWith("/comments") && init?.method === "POST") {
      // Behave like Circle: the new comment shows up on the post and in its count.
      const body = JSON.parse(String(init.body)) as { post_id: number; body: string; parent_comment_id?: number };
      posted.push(body);
      const id = 900 + posted.length;
      (state.comments[body.post_id] ??= []).push(comment(id, COACH, "Coach", `<p>${body.body}</p>`, new Date(NOW.getTime() + posted.length * 1000).toISOString(), body.parent_comment_id ?? null));
      const post = state.posts.find((p) => p.id === body.post_id);
      if (post) post.comments_count = (post.comments_count ?? 0) + 1;
      return json({ id });
    }
    return new Response("not found", { status: 404 });
  });
  return { fetchImpl: fetchImpl as unknown as typeof fetch, posted, calls };
}

const answerStub = () => vi.fn<typeof composeReply>(async () => ({ answer: "Store the name in a variable.", escalate: false, sources: ["classroom/11-make-a-chatbot.md"] }));

describe("CoachLoop", () => {
  it("answers a new member post once and leaves team, old and already-answered posts alone", async () => {
    resetAuthScheme();
    const state = {
      posts: [
        member(101, "Sam Lee", "kid@example.com", "How do I give my chatbot memory?", "<p>It forgets my name every time.</p>", "2026-09-27T10:00:00Z"),
        member(102, "Learn AI Team", TEAM, "Welcome to Ask Coach", "<p>How to ask.</p>", "2026-09-20T10:00:00Z"),
        member(103, "Ava", "kid2@example.com", "Already answered", "<p>Old question.</p>", "2026-09-26T10:00:00Z", 1),
        member(104, "Max", "kid3@example.com", "Ancient thread", "<p>From ages ago.</p>", "2026-06-01T10:00:00Z", 2),
      ],
      comments: { 103: [comment(1, COACH, "Coach", "<p>Here is how.</p>", "2026-09-26T10:05:00Z")] },
    };
    const { fetchImpl, posted, calls } = fakeCircle(state);
    const compose = answerStub();
    const loop = new CoachLoop(cfg(), { kb: () => kb, fetchImpl, now: () => NOW, log: () => {}, compose });

    expect(await loop.tick()).toEqual({ answered: 1, skipped: 3, failed: 0 });
    expect(posted).toEqual([{ post_id: 101, body: "Store the name in a variable.", parent_comment_id: undefined, skip_notifications: false }]);
    expect(compose).toHaveBeenCalledTimes(1);
    expect(compose.mock.calls[0][0]).toMatchObject({ title: "How do I give my chatbot memory?", authorName: "Sam Lee", spaceName: "Ask Coach" });
    expect(compose.mock.calls[0][0].thread).toBeUndefined();
    expect(calls.comments).toBe(3); // the ancient post was baselined without a fetch

    // Nothing changed: no comment fetches, no replies.
    calls.comments = 0;
    expect(await loop.tick()).toEqual({ answered: 0, skipped: 0, failed: 0 });
    expect(calls.comments).toBe(0);
    expect(loop.status()).toMatchObject({ enabled: true, spaceId: 7, ticks: 2, answered: 1, escalated: 0 });
  });

  it("continues a thread when the member follows up, and replies inside that thread", async () => {
    resetAuthScheme();
    const state = {
      posts: [member(201, "Sam Lee", "kid@example.com", "Chatbot memory", "<p>It forgets my name.</p>", "2026-09-27T09:00:00Z", 2)],
      comments: {
        201: [
          comment(11, COACH, "Coach", "<p>Store the name in a variable.</p>", "2026-09-27T09:05:00Z"),
          comment(12, "kid@example.com", "Sam Lee", "<p>What is a variable?</p>", "2026-09-27T09:30:00Z", 11),
        ],
      },
    };
    const { fetchImpl, posted, calls } = fakeCircle(state);
    const compose = answerStub();
    const loop = new CoachLoop(cfg(), { kb: () => kb, fetchImpl, now: () => NOW, log: () => {}, compose });

    expect(await loop.tick()).toEqual({ answered: 1, skipped: 0, failed: 0 });
    expect(posted[0]).toMatchObject({ post_id: 201, parent_comment_id: 11 });
    const input = compose.mock.calls[0][0];
    expect(input).toMatchObject({ title: "Chatbot memory", bodyHtml: "<p>What is a variable?</p>", authorName: "Sam Lee" });
    expect(input.thread).toEqual([
      { role: "member", name: "Sam Lee", text: "<p>It forgets my name.</p>" },
      { role: "coach", name: "Coach", text: "<p>Store the name in a variable.</p>" },
    ]);

    // Circle now shows Coach's reply as the newest comment: no further reply, no fetch.
    calls.comments = 0;
    expect(await loop.tick()).toEqual({ answered: 0, skipped: 0, failed: 0 });
    expect(calls.comments).toBe(0);
    expect(posted).toHaveLength(1);

    // A second follow-up as a new top-level comment gets a nested reply under it.
    state.posts[0].comments_count = 4;
    state.comments[201].push(comment(14, "kid@example.com", "Sam Lee", "<p>Can it remember two names?</p>", "2026-09-27T13:00:00Z"));
    expect(await loop.tick()).toEqual({ answered: 1, skipped: 0, failed: 0 });
    expect(posted[1]).toMatchObject({ post_id: 201, parent_comment_id: 14 });
    expect(compose.mock.calls[1][0].thread).toHaveLength(4);
  });

  it("stays quiet once a team member or an escalation has the last word", async () => {
    resetAuthScheme();
    const state = {
      posts: [
        member(301, "Sam Lee", "kid@example.com", "Human took over", "<p>Q</p>", "2026-09-27T09:00:00Z", 2),
        member(302, "Ava", "kid2@example.com", "Escalated", "<p>Refund?</p>", "2026-09-27T09:00:00Z", 2),
      ],
      comments: {
        301: [comment(21, COACH, "Coach", "<p>A</p>", "2026-09-27T09:05:00Z"), comment(22, TEAM, "Learn AI Team", "<p>I'll take this one.</p>", "2026-09-27T09:10:00Z")],
        302: [comment(31, COACH, "Coach", `<p>${escalationReply("Ava", "billing")}</p>`, "2026-09-27T09:05:00Z"), comment(32, "kid2@example.com", "Ava", "<p>Hello??</p>", "2026-09-27T09:20:00Z")],
      },
    };
    const { fetchImpl, posted } = fakeCircle(state);
    const loop = new CoachLoop(cfg(), { kb: () => kb, fetchImpl, now: () => NOW, log: () => {} });
    expect(await loop.tick()).toEqual({ answered: 0, skipped: 2, failed: 0 });
    expect(posted).toHaveLength(0);
  });

  it("answers a fresh comment on an old post but never the old post itself", async () => {
    resetAuthScheme();
    const state = {
      posts: [member(401, "Learn AI Team", TEAM, "How to ask a question here", "<p>Rules.</p>", "2026-06-01T10:00:00Z", 0)],
      comments: {} as Record<number, CommentRecord[]>,
    };
    const { fetchImpl, posted, calls } = fakeCircle(state);
    const compose = answerStub();
    const loop = new CoachLoop(cfg(), { kb: () => kb, fetchImpl, now: () => NOW, log: () => {}, compose });
    expect(await loop.tick()).toEqual({ answered: 0, skipped: 1, failed: 0 });
    expect(calls.comments).toBe(0);

    state.posts[0].comments_count = 1;
    state.comments[401] = [comment(41, "kid@example.com", "Max", "<p>Where do I start?</p>", "2026-09-27T11:00:00Z")];
    expect(await loop.tick()).toEqual({ answered: 1, skipped: 0, failed: 0 });
    expect(posted[0]).toMatchObject({ post_id: 401, parent_comment_id: 41 });
    expect(compose.mock.calls[0][0].thread).toEqual([{ role: "team", name: "Learn AI Team", text: "<p>Rules.</p>" }]);
  });

  it("escalates billing questions with the hand-off reply and no model call", async () => {
    resetAuthScheme();
    const state = { posts: [member(501, "Jordan Ruiz", "parent@example.com", "Refund?", "<p>Can I get a refund for this month?</p>", "2026-09-27T09:00:00Z")], comments: {} };
    const { fetchImpl, posted } = fakeCircle(state);
    const loop = new CoachLoop(cfg(), { kb: () => kb, fetchImpl, now: () => NOW, log: () => {} });
    await loop.tick();
    expect(posted).toHaveLength(1);
    expect(posted[0].body).toMatch(/^Hi Jordan! .*real person on our team/);
    expect(loop.status()).toMatchObject({ answered: 1, escalated: 1 });
  });

  it("does not post in dry run", async () => {
    resetAuthScheme();
    const state = { posts: [member(601, "Sam Lee", "kid@example.com", "Q", "<p>Q</p>", "2026-09-27T10:00:00Z")], comments: {} };
    const { fetchImpl, posted } = fakeCircle(state);
    const loop = new CoachLoop(cfg({ reply: { model: "claude-opus-5", effort: "low", dryRun: true } }), { kb: () => kb, fetchImpl, now: () => NOW, log: () => {} });
    expect(await loop.tick()).toEqual({ answered: 0, skipped: 1, failed: 0 });
    expect(posted).toHaveLength(0);
  });

  it("retries a failed reply on later ticks and gives up after three failures", async () => {
    resetAuthScheme();
    const state = { posts: [member(701, "Sam Lee", "kid@example.com", "Q", "<p>Q</p>", "2026-09-27T10:00:00Z")], comments: {} };
    const { fetchImpl, posted } = fakeCircle(state);
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
    const { fetchImpl } = fakeCircle({ posts: [], comments: {} });
    const loop = new CoachLoop(cfg({ spaceSlug: "nope" }), { kb: () => kb, fetchImpl, now: () => NOW, log: () => {} });
    await loop.tick();
    expect(loop.status().lastError).toMatch(/no space with slug "nope"/);
  });
});
