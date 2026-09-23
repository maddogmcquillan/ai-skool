import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { blobKey, contentTypeFor, md5Base64, normalizeFileName } from "../src/lib/upload.js";

describe("upload helpers", () => {
  it("computes a base64 md5 checksum of a file", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "aiskool-"));
    const f = path.join(dir, "abc.txt");
    await writeFile(f, "abc");
    expect(await md5Base64(f)).toBe("kAFQmDzST7DWlj99KOF/cg=="); // md5("abc") in base64
  });

  it("generates 28-char base36 blob keys", () => {
    const k = blobKey();
    expect(k).toMatch(/^[a-z0-9]{28}$/);
    expect(blobKey()).not.toBe(k);
  });

  it("maps extensions to content types with a safe default", () => {
    expect(contentTypeFor("Lesson 1.MP4")).toBe("video/mp4");
    expect(contentTypeFor("clip.mov")).toBe("video/quicktime");
    expect(contentTypeFor("notes.xyz")).toBe("application/octet-stream");
  });

  it("normalizes file names for loose matching", () => {
    expect(normalizeFileName("01 - What_is AI.mp4")).toBe("01whatisai");
    expect(normalizeFileName("/tmp/x/01-what-is-ai.MOV")).toBe("01whatisai");
  });
});
