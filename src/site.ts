import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import type { Context, Hono } from "hono";

/**
 * The parent-facing site: the landing page and its legal pages from `site/`, plus the brand
 * images from `brand/assets/` under /assets. Files are read once and kept in memory.
 */
const PAGES: Record<string, string> = {
  "/": "index.html",
  "/parents": "parents.html",
  "/terms": "terms.html",
  "/privacy": "privacy.html",
};
const TYPES: Record<string, string> = { ".png": "image/png", ".jpg": "image/jpeg", ".svg": "image/svg+xml", ".ico": "image/x-icon", ".html": "text/html; charset=utf-8" };

export function mountSite(app: Hono, opts: { siteDir?: string; assetsDir?: string } = {}): void {
  const siteDir = opts.siteDir ?? "./site";
  const assetsDir = opts.assetsDir ?? "./brand/assets";
  const cache = new Map<string, Uint8Array<ArrayBuffer>>();
  const load = async (path: string) => {
    let buf = cache.get(path);
    if (!buf) {
      const raw = await readFile(path);
      buf = new Uint8Array(new ArrayBuffer(raw.byteLength));
      buf.set(raw);
      cache.set(path, buf);
    }
    return buf;
  };

  const servePage = async (c: Context, file: string) => {
    try {
      const body = await load(join(siteDir, file));
      return c.body(body, 200, { "content-type": TYPES[".html"], "cache-control": "public, max-age=300" });
    } catch {
      return c.text("not found", 404);
    }
  };
  for (const [route, file] of Object.entries(PAGES)) app.get(route, (c) => servePage(c, file));

  // Any other lowercase slug maps to site/<slug>.html, so a new landing page is one file and a push.
  const reserved = new Set(["healthz", "hooks", "admin", "assets", "api"]);
  app.get("/:slug{[a-z0-9-]+}", (c) => {
    const slug = c.req.param("slug");
    return reserved.has(slug) ? c.text("not found", 404) : servePage(c, `${slug}.html`);
  });

  app.get("/assets/:file", async (c) => {
    const name = normalize(c.req.param("file")).replace(/^(\.\.[/\\])+/, "");
    if (name.includes("/") || name.includes("\\") || !TYPES[extname(name)]) return c.text("not found", 404);
    try {
      const body = await load(join(assetsDir, name));
      return c.body(body, 200, { "content-type": TYPES[extname(name)], "cache-control": "public, max-age=86400" });
    } catch {
      return c.text("not found", 404);
    }
  });
}
