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

  it("serves the AI For Kids ad landing page with the checkout link, the pixel and the hero image", async () => {
    const app = await createApp(cfg, { kb });
    const res = await app.request("/ai-for-kids");
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain("https://www.joinlearnai.com/checkout/founding-member");
    expect(html).toContain('"2050628052248432"');
    expect(html).toContain("Kids don't learn this in school");
    // No price above the fold: the first price mention must come after the hero.
    expect(html.indexOf("$49")).toBeGreaterThan(html.indexOf("</header>"));
    // A shared link ending in #enroll must load at the top: the hash is dropped before the body parses.
    expect(html.indexOf("history.replaceState")).toBeGreaterThan(-1);
    expect(html.indexOf("history.replaceState")).toBeLessThan(html.indexOf("<body>"));
    expect(html).toContain("Ages 11");
    expect(html).not.toMatch(/no refunds/i);
    const img = await app.request("/assets/class-game.jpg");
    expect(img.status).toBe(200);
    expect(img.headers.get("content-type")).toBe("image/jpeg");
  });

  it("serves the 8-in-10 ad landing page, congruent with the ad and honest about the offer", async () => {
    const app = await createApp(cfg, { kb });
    const res = await app.request("/the-gap");
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain("https://www.joinlearnai.com/checkout/founding-member");
    expect(html).toContain('"2050628052248432"');
    expect(html).toContain("lp-the-gap");
    // The hero repeats the ad's headline stat so the page matches what the visitor just read.
    expect(html).toContain("8 in 10 students");
    // No price above the fold.
    expect(html.indexOf("$49")).toBeGreaterThan(html.indexOf("</header>"));
    expect(html.indexOf("history.replaceState")).toBeLessThan(html.indexOf("<body>"));
    expect(html).toContain("11 to 17");
    expect(html).not.toMatch(/no refunds/i);
    expect(html).not.toMatch(/classes are filling up/i);
    const img = await app.request("/assets/lesson-05-the-perfect-chatgpt-prompt-formula.png");
    expect(img.status).toBe(200);
    expect(img.headers.get("content-type")).toBe("image/png");
    const face = await app.request("/assets/avatar-kevin.jpg");
    expect(face.status).toBe(200);
  });

  it("serves any extra page in site/ by its slug and 404s the rest", async () => {
    const app = await createApp(cfg, { kb });
    expect((await app.request("/parents")).status).toBe(200);
    expect((await app.request("/no-such-page")).status).toBe(404);
    expect((await app.request("/healthz")).status).toBe(200);
    expect((await app.request("/../package.json")).status).toBe(404);
  });

  it("refuses paths outside the assets folder and unknown files", async () => {
    const app = await createApp(cfg, { kb });
    expect((await app.request("/assets/..%2F..%2Fpackage.json")).status).toBe(404);
    expect((await app.request("/assets/nope.png")).status).toBe(404);
    expect((await app.request("/assets/notes.txt")).status).toBe(404);
  });
});
