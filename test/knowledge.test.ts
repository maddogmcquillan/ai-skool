import { describe, expect, it } from "vitest";
import { chunkMarkdown, KnowledgeBase } from "../src/bot/knowledge.js";

const faq = `# Community FAQ\n\n## Where to ask\nPost in Ask Coach.\n`;
const lesson = `# What AI is and is not

## Definition
Artificial intelligence is software that learns patterns from examples instead of following rules a person typed out.

## Everyday examples
Your phone's face unlock, video recommendations, and spam filters all use machine learning models.

## Project: Spot the AI
Walk around your house and list five things that might use AI. Explain your guess for each one.
`;

describe("chunkMarkdown", () => {
  it("splits by ## headings and flags pinned 00- files", () => {
    const chunks = chunkMarkdown("00-faq.md", faq);
    expect(chunks).toHaveLength(1);
    expect(chunks[0].pinned).toBe(true);
    expect(chunks[0].title).toBe("Community FAQ");
    expect(chunks[0].heading).toBe("Where to ask");

    const lessonChunks = chunkMarkdown("ai-foundations/01-what-ai-is.md", lesson);
    expect(lessonChunks.map((c) => c.heading)).toEqual(["Definition", "Everyday examples", "Project: Spot the AI"]);
    expect(lessonChunks.every((c) => !c.pinned)).toBe(true);
  });
});

describe("KnowledgeBase.search", () => {
  const kb = new KnowledgeBase([...chunkMarkdown("00-faq.md", faq), ...chunkMarkdown("ai-foundations/01-what-ai-is.md", lesson)]);

  it("returns the most relevant lesson chunk first and excludes pinned chunks", () => {
    const hits = kb.search("does my phone face unlock use AI?");
    expect(hits.length).toBeGreaterThan(0);
    expect(hits[0].heading).toBe("Everyday examples");
    expect(hits.every((h) => !h.pinned)).toBe(true);
  });

  it("exposes pinned chunks separately", () => {
    expect(kb.pinned().map((c) => c.file)).toEqual(["00-faq.md"]);
  });

  it("returns nothing for an empty query", () => {
    expect(kb.search("   ")).toEqual([]);
  });
});
