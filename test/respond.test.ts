import { describe, expect, it } from "vitest";
import { buildUserMessage } from "../src/bot/answer.js";
import { chunkMarkdown, KnowledgeBase } from "../src/bot/knowledge.js";
import { composeReply, renderThread } from "../src/bot/respond.js";

const kb = new KnowledgeBase([...chunkMarkdown("00-faq.md", "# FAQ\n\n## Rules\nBe kind.\n"), ...chunkMarkdown("classroom/11-make-a-chatbot.md", "# Make a Chatbot\n\n## Memory\nStore the name in a variable.\n")]);

describe("renderThread", () => {
  it("labels each message by role and first name and strips html", () => {
    const out = renderThread([
      { role: "member", name: "Sam Lee", text: "<p>It forgets my name.</p>" },
      { role: "coach", text: "Store it in a variable." },
      { role: "team", name: "Learn AI Team", text: "Checking." },
    ]);
    expect(out).toBe("[Member Sam] It forgets my name.\n[Coach] Store it in a variable.\n[Team] Checking.");
  });

  it("drops the oldest messages when the thread is very long", () => {
    const long = Array.from({ length: 30 }, (_, i) => ({ role: "member" as const, text: `message ${i} ${"x".repeat(400)}` }));
    const out = renderThread(long);
    expect(out.startsWith("[earlier messages omitted]")).toBe(true);
    expect(out).toContain("message 29");
    expect(out).not.toContain("message 0 ");
  });
});

describe("composeReply", () => {
  it("escalates on the latest message only, without a model call", async () => {
    const r = await composeReply({ title: "Chatbot", bodyHtml: "<p>can I cancel?</p>", authorName: "Sam", thread: [{ role: "member", text: "how do I add memory" }] }, kb, { model: "claude-opus-5", effort: "low", dryRun: false });
    expect(r.escalate).toBe(true);
    expect(r.reason).toBe("billing");
  });

  it("in dry run, folds the thread into the prompt and searches with the recent member messages", async () => {
    const r = await composeReply(
      { title: "Chatbot", bodyHtml: "<p>what is that?</p>", authorName: "Sam", thread: [{ role: "member", text: "how do I give my chatbot memory" }, { role: "coach", text: "Store the name in a variable." }] },
      kb,
      { model: "claude-opus-5", effort: "low", dryRun: true },
    );
    expect(r.escalate).toBe(false);
    expect(r.sources).toContain("Make a Chatbot › Memory");
  });
});

describe("buildUserMessage", () => {
  it("adds the conversation before the latest message", () => {
    const msg = buildUserMessage({ question: "what is that?", conversation: "[Member Sam] memory?\n[Coach] Use a variable.", title: "Chatbot", context: [], pinned: [] });
    expect(msg).toContain("Conversation so far, oldest first:\n[Member Sam] memory?\n[Coach] Use a variable.");
    expect(msg).toContain("Latest message from the member:\nwhat is that?");
  });
});
