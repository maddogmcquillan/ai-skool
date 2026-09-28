import { describe, expect, it } from "vitest";
import { chunkMarkdown, KnowledgeBase } from "../src/bot/knowledge.js";
import { createApp, type ServerConfig } from "../src/server.js";

const kb = new KnowledgeBase(chunkMarkdown("00-faq.md", "# FAQ\n\n## Rules\nBe kind.\n"));
const cfg: ServerConfig = {
  hookSecret: "s3cret",
  dryRun: true,
  capi: { pixelId: "", accessToken: "", apiVersion: "v25.0", defaultSourceUrl: "", currency: "USD" },
  answer: { model: "claude-opus-5", effort: "medium" },
  knowledgeDir: "./knowledge",
};

describe("the site", () => {
  it("serves the landing page with the live checkout link and the pixel", async () => {
    const app = await createApp(cfg, { kb });
    const res = await app.request("/");
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/html");
    const html = await res.text();
    expect(html).toContain("https://www.joinlearnai.com/checkout/founding-member");
    expect(html).toContain('"2050628052248432"');
    expect(html).toContain("$49");
  });

  it("serves the parent, terms and privacy pages and the brand images", async () => {
    const app = await createApp(cfg, { kb });
    for (const path of ["/parents", "/terms", "/privacy"]) {
      const res = await app.request(path);
      expect(res.status, path).toBe(200);
      expect(await res.text()).toContain("hello@joinlearnai.com");
    }
    const img = await app.request("/assets/og-image.png");
    expect(img.status).toBe(200);
    expect(img.headers.get("content-type")).toBe("image/png");
  });

  it("refuses paths outside the assets folder and unknown files", async () => {
    const app = await createApp(cfg, { kb });
    expect((await app.request("/assets/..%2F..%2Fpackage.json")).status).toBe(404);
    expect((await app.request("/assets/nope.png")).status).toBe(404);
    expect((await app.request("/assets/notes.txt")).status).toBe(404);
  });
});
