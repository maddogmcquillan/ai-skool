import { describe, expect, it } from "vitest";
import { lessonDoc, normalizeLesson, youtubeUrl } from "../src/lib/lessonBody.js";

describe("lesson body", () => {
  it("normalizes string lessons and youtube ids", () => {
    expect(normalizeLesson("Intro")).toEqual({ name: "Intro" });
    expect(youtubeUrl("uMzUB89uSxU")).toBe("https://www.youtube.com/watch?v=uMzUB89uSxU");
    expect(youtubeUrl("https://youtu.be/abc")).toBe("https://youtu.be/abc");
  });

  it("uses an embed node when an embed was created", () => {
    const doc = lessonDoc({ name: "x", description: "What it covers.", youtube: "abc", creator: "Someone" }, { embed: { sgid: "SG", url: "https://www.youtube.com/watch?v=abc" } });
    expect(doc.content.map((n) => n.type)).toEqual(["paragraph", "embed", "paragraph"]);
    expect(doc.content[1].attrs).toEqual({ sgid: "SG", url: "https://www.youtube.com/watch?v=abc" });
    expect(doc.content[2].content?.[0].text).toContain("Video by Someone");
  });

  it("prefers a native upload over the YouTube embed", () => {
    const doc = lessonDoc({ name: "x", youtube: "abc", creator: "Someone" }, { embed: { sgid: "SG", url: "u" }, upload: { sgid: "UP", signedId: "sid", filename: "01.mp4" } });
    expect(doc.content[0]).toEqual({ type: "file", attrs: { sgid: "UP", signed_id: "sid", filename: "01.mp4" } });
    expect(doc.content.some((n) => n.type === "embed")).toBe(false);
  });

  it("falls back to a link paragraph and includes the note", () => {
    const doc = lessonDoc({ name: "x", youtube: "abc", note: "Paid tool." });
    expect(doc.content.map((n) => n.type)).toEqual(["paragraph", "paragraph"]);
    const link = doc.content[0].content?.[0];
    expect(link?.marks?.[0]).toMatchObject({ type: "link" });
    expect(doc.content[1].content?.map((t) => t.text).join("")).toBe("Heads up: Paid tool.");
  });
});
