/**
 * Apply visual branding from circle/brand.yaml through the Admin API v2:
 * community brand colors, space emoji + cover + thumbnail + display settings, course labels,
 * and cover images on the pinned posts.
 *
 *   npm run brand -- --dry-run
 *   npm run brand
 *   npm run brand -- --emoji   (also sets sidebar emoji; skipped by default so it does not
 *                               replace the custom icons uploaded by hand)
 *
 * Re-running re-uploads and re-applies everything else; that is intended (covers replace covers).
 * What the API cannot set is listed in docs/BRANDING.md (logo, community icon, custom space icons,
 * home page layout, theme).
 */
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { parse } from "yaml";
import { circleRequest, type CircleClientConfig } from "../src/circle.js";
import { directUpload } from "../src/lib/circleUpload.js";

interface SpaceBrand {
  emoji?: string;
  cover?: string;
  thumbnail?: string;
  cover_style?: "normal" | "wide";
  pinned_posts_label?: string;
  display_view?: string;
  hide_right_sidebar?: boolean;
  course?: { course_type?: string; custom_lesson_label?: string; custom_section_label?: string };
}
interface PostBrand { space: string; title: string; cover: string }
interface Brand {
  community?: { brand_color?: { light: string; dark: string }; brand_text_color?: { light: string; dark: string } };
  spaces?: Record<string, SpaceBrand>;
  posts?: PostBrand[];
}
interface Paged<T> { records: T[]; has_next_page: boolean }
interface Space { id: number; slug: string; name: string }
interface Post { id: number; name: string }

const dryRun = process.argv.includes("--dry-run");
// Custom space icons are uploaded by hand and an emoji PUT would replace them, so emoji are
// only applied when asked for.
const applyEmoji = process.argv.includes("--emoji");
const token = process.env.CIRCLE_ADMIN_TOKEN;
if (!dryRun && !token) {
  console.error("CIRCLE_ADMIN_TOKEN is required (or pass --dry-run).");
  process.exit(1);
}
const cfg: CircleClientConfig = { token: token ?? "dry", baseUrl: process.env.CIRCLE_API_BASE };
let warnings = 0;

async function listAll<T>(p: string, query: Record<string, string | number> = {}): Promise<T[]> {
  if (dryRun) return [];
  const out: T[] = [];
  for (let page = 1; page < 50; page++) {
    const qs = new URLSearchParams({ ...Object.fromEntries(Object.entries(query).map(([k, v]) => [k, String(v)])), page: String(page), per_page: "100" });
    const res = await circleRequest<Paged<T> | T[]>(cfg, "GET", `${p}?${qs}`);
    const records = Array.isArray(res) ? res : res.records ?? [];
    out.push(...records);
    if (Array.isArray(res) || !res.has_next_page) break;
  }
  return out;
}

function log(kind: string, msg: string) {
  console.log(`${dryRun ? "[dry-run] " : ""}${kind.padEnd(10)} ${msg}`);
}

async function upload(file: string): Promise<string | undefined> {
  if (!existsSync(file)) {
    warnings++;
    log("warn", `missing file ${file}`);
    return undefined;
  }
  if (dryRun) return "dry-signed-id";
  return (await directUpload(cfg, file)).signed_id;
}

async function apply(kind: string, label: string, fn: () => Promise<unknown>) {
  if (dryRun) return log(kind, label);
  try {
    await fn();
    log(kind, label);
  } catch (err) {
    warnings++;
    log("warn", `${label}: ${(err as Error).message.slice(0, 220)}`);
  }
}

async function main() {
  const brand = parse(await readFile("circle/brand.yaml", "utf8")) as Brand;
  console.log(`Applying Learn AI branding${dryRun ? " (dry run)" : ""}\n`);

  if (brand.community) {
    const prefs = { ...(brand.community.brand_color ? { brand_color: brand.community.brand_color } : {}), ...(brand.community.brand_text_color ? { brand_text_color: brand.community.brand_text_color } : {}) };
    await apply("community", `brand color ${brand.community.brand_color?.light ?? ""} / ${brand.community.brand_color?.dark ?? ""}`, () =>
      circleRequest(cfg, "PUT", "/community", { community: { prefs } }),
    );
  }

  const spaces = await listAll<Space>("/spaces");
  for (const [slug, b] of Object.entries(brand.spaces ?? {})) {
    const space = spaces.find((s) => s.slug === slug);
    if (!space && !dryRun) {
      warnings++;
      log("warn", `no space with slug '${slug}'`);
      continue;
    }
    const payload: Record<string, unknown> = {};
    if (b.emoji && applyEmoji) payload.emoji = b.emoji;
    if (b.cover) {
      const id = await upload(b.cover);
      if (id) Object.assign(payload, { cover_image: id, cover_image_visible: true, cover_image_display_style: b.cover_style ?? "wide" });
    }
    if (b.thumbnail) {
      const id = await upload(b.thumbnail);
      if (id) payload.thumbnail_image = id;
    }
    if (b.pinned_posts_label) payload.pinned_posts_label = b.pinned_posts_label;
    if (b.display_view) payload.display_view = b.display_view;
    if (b.hide_right_sidebar !== undefined) payload.hide_right_sidebar = b.hide_right_sidebar;
    if (b.course) payload.course_setting_attributes = { lesson_thumbnails_visible: true, ...b.course };
    await apply("space", `${slug}: ${Object.keys(payload).join(", ")}`, async () => {
      try {
        await circleRequest(cfg, "PUT", `/spaces/${space!.id}`, payload);
      } catch (err) {
        // course settings or thumbnail may not be accepted on update for every space type; retry without them.
        if (!("course_setting_attributes" in payload) && !("thumbnail_image" in payload)) throw err;
        const { course_setting_attributes: _c, thumbnail_image: _t, ...rest } = payload;
        await circleRequest(cfg, "PUT", `/spaces/${space!.id}`, rest);
        warnings++;
        log("warn", `${slug}: applied without course_setting/thumbnail (${(err as Error).message.slice(0, 120)})`);
      }
    });
  }

  for (const p of brand.posts ?? []) {
    const space = spaces.find((s) => s.slug === p.space);
    if (!space && !dryRun) {
      warnings++;
      log("warn", `no space with slug '${p.space}' for post '${p.title}'`);
      continue;
    }
    const posts = space ? await listAll<Post>("/posts", { space_id: space.id }) : [];
    const post = posts.find((x) => x.name === p.title);
    if (!post && !dryRun) {
      warnings++;
      log("warn", `no post titled '${p.title}' in ${p.space} (run provision first)`);
      continue;
    }
    const id = await upload(p.cover);
    if (!id) continue;
    await apply("post", `${p.space}: ${p.title} cover`, () => circleRequest(cfg, "PUT", `/posts/${post!.id}`, { cover_image: id }));
  }

  console.log(`\nDone. warnings=${warnings}`);
  if (warnings) process.exitCode = 2;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
