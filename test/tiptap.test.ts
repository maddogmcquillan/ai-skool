import { describe, expect, it } from "vitest";
import { markdownToTiptap } from "../src/lib/tiptap.js";

describe("markdownToTiptap", () => {
  it("converts headings, paragraphs, lists and bold", () => {
    const doc = markdownToTiptap(`# Welcome\nYou're **in**. Here's how it works.\n\n## Rules\n- Be kind.\n- No personal info.\n\n1. First\n2. Second\n`);
    expect(doc.type).toBe("doc");
    expect(doc.content.map((n) => n.type)).toEqual(["heading", "paragraph", "heading", "bulletList", "orderedList"]);
    expect(doc.content[0].attrs).toEqual({ level: 2 });
    expect(doc.content[2].attrs).toEqual({ level: 3 });
    const para = doc.content[1];
    expect(para.content?.map((t) => t.text)).toEqual(["You're ", "in", ". Here's how it works."]);
    expect(para.content?.[1].marks).toEqual([{ type: "bold" }]);
    expect(doc.content[3].content).toHaveLength(2);
    expect(doc.content[3].content?.[0].content?.[0].content?.[0].text).toBe("Be kind.");
    expect(doc.content[4].content).toHaveLength(2);
  });

  it("joins wrapped lines into one paragraph and handles empty input", () => {
    expect(markdownToTiptap("line one\nline two").content[0].content?.[0].text).toBe("line one line two");
    expect(markdownToTiptap("").content).toEqual([]);
  });
});
