/**
 * Provision the Circle community from circle/structure.yaml using the Admin API v2.
 *
 * Requires the Circle Business plan or above (the Professional plan has no Admin API).
 *
 *   CIRCLE_ADMIN_TOKEN=... npm run provision           # create anything missing, apply settings
 *   npm run provision -- --update-posts                # also rewrite existing pinned posts from the yaml
 *   npm run provision -- --update-lessons              # also rewrite existing lesson bodies (video embeds, notes)
 *   npm run provision:dry                              # print the plan, no token needed
 *
 * Idempotent: space groups and spaces match by slug; sections, lessons, tags and pinned posts
 * by name; profile fields by key. Settings are re-applied every run. Re-running is safe.
 */
import { readFile } from "node:fs/promises";
import { parse } from "yaml";
import { circleRequest, type CircleClientConfig } from "../src/circle.js";
import { markdownToTiptap } from "../src/lib/tiptap.js";
import { lessonDoc, normalizeLesson, youtubeUrl, type LessonContent } from "../src/lib/lessonBody.js";

interface SectionSpec { name: string; lessons?: Array<string | LessonContent> }
interface PinnedPostSpec { title: string; body: string }
interface SpaceSpec {
  name: string;
  slug: string;
  type: "basic" | "course" | "event" | "chat" | "image" | "members";
  description?: string;
  members_can_post?: boolean;
  sections?: SectionSpec[];
  pinned_posts?: PinnedPostSpec[];
}
interface GroupSpec { name: string; slug: string; spaces: SpaceSpec[] }
interface TagSpec { name: string; color?: string; emoji?: string; is_public?: boolean }
interface ProfileFieldSpec {
  key: string;
  label: string;
  field_type: "text" | "select" | "checkbox" | "textarea" | "link" | "number";
  required?: boolean;
  description?: string;
  choices?: string[];
  show_on_signup?: boolean;
  show_on_profile?: boolean;
}
interface Structure {
  community: { name: string };
  settings?: {
    messaging?: Record<string, boolean>;
    hide_emails_on_member_profiles?: boolean;
    allow_profile_search_indexing?: boolean;
    default_spaces?: string[];
    new_member_landing_space?: string;
  };
  member_tags?: TagSpec[];
  profile_fields?: ProfileFieldSpec[];
  bot_member?: { name: string; headline?: string; tag?: string; spaces?: string[] };
  retired_spaces?: string[];
  retired_space_groups?: string[];
  space_groups: GroupSpec[];
}
interface Embed { sgid: string; url: string }

interface Paged<T> { records: T[]; has_next_page: boolean }
interface SpaceGroup { id: number; name: string; slug: string }
interface Space { id: number; name: string; slug: string; space_group_id: number; space_type?: string }
interface Section { id: number; name: string; space_id: number }
interface Lesson { id: number; name: string; section_id: number }
interface MemberTag { id: number; name: string }
interface ProfileField { id: number; key: string; label: string }
interface Member { id: number; email: string; name?: string }
interface Post { id: number; name: string; space_id: number }

const dryRun = process.argv.includes("--dry-run");
/** With --update-posts, existing pinned posts get their body rewritten from the yaml. */
const updatePosts = process.argv.includes("--update-posts");
/** With --update-lessons, existing lessons get their body rewritten from the yaml. */
const updateLessons = process.argv.includes("--update-lessons");
const token = process.env.CIRCLE_ADMIN_TOKEN;
if (!dryRun && !token) {
  console.error("CIRCLE_ADMIN_TOKEN is required (or pass --dry-run).");
  process.exit(1);
}
const cfg: CircleClientConfig = { token: token ?? "dry", baseUrl: process.env.CIRCLE_API_BASE };
const summary = { created: 0, kept: 0, applied: 0, warned: 0 };

async function listAll<T>(path: string, query: Record<string, string | number> = {}): Promise<T[]> {
  if (dryRun) return [];
  const out: T[] = [];
  for (let page = 1; page < 50; page++) {
    const qs = new URLSearchParams({ ...Object.fromEntries(Object.entries(query).map(([k, v]) => [k, String(v)])), page: String(page), per_page: "100" });
    const res = await circleRequest<Paged<T> | T[]>(cfg, "GET", `${path}?${qs}`);
    const records = Array.isArray(res) ? res : res.records ?? [];
    out.push(...records);
    if (Array.isArray(res) || !res.has_next_page) break;
  }
  return out;
}

function log(action: "keep" | "create" | "apply" | "warn" | "skip", kind: string, name: string) {
  if (action === "create") summary.created++;
  if (action === "keep") summary.kept++;
  if (action === "apply") summary.applied++;
  if (action === "warn") summary.warned++;
  console.log(`${dryRun ? "[dry-run] " : ""}${action.padEnd(6)} ${kind.padEnd(13)} ${name}`);
}

/** Run a settings step; a failure is logged as a warning rather than aborting the whole run. */
async function step<T>(kind: string, name: string, fn: () => Promise<T>): Promise<T | undefined> {
  if (dryRun) {
    log("apply", kind, name);
    return undefined;
  }
  try {
    const result = await fn();
    log("apply", kind, name);
    return result;
  } catch (err) {
    log("warn", kind, `${name}: ${(err as Error).message.slice(0, 300)}`);
    return undefined;
  }
}

const embedCache = new Map<string, Embed | null>();

/** Ask Circle to create an embed for the lesson's video; null when it declines. */
async function lessonBody(lesson: LessonContent) {
  if (!lesson.youtube) return lessonDoc(lesson);
  const url = youtubeUrl(lesson.youtube);
  if (!embedCache.has(url)) {
    try {
      const embed = await circleRequest<Embed>(cfg, "POST", "/embeds", { url });
      embedCache.set(url, embed?.sgid ? { sgid: embed.sgid, url: embed.url ?? url } : null);
    } catch (err) {
      log("warn", "embed", `${url}: ${(err as Error).message.slice(0, 160)}`);
      embedCache.set(url, null);
    }
  }
  return lessonDoc(lesson, { embed: embedCache.get(url) ?? undefined });
}

/** Delete placeholder spaces and groups listed under retired_* in the yaml. */
async function retire(spec: Structure, spaces: Space[], groups: SpaceGroup[]) {
  for (const slug of spec.retired_spaces ?? []) {
    const space = spaces.find((s) => s.slug === slug);
    if (!space) continue;
    log("apply", "retire space", `${space.name} (${slug})`);
    if (!dryRun) await circleRequest(cfg, "DELETE", `/spaces/${space.id}`);
  }
  for (const slug of spec.retired_space_groups ?? []) {
    const group = groups.find((g) => g.slug === slug);
    if (!group) continue;
    log("apply", "retire group", `${group.name} (${slug})`);
    if (!dryRun) await circleRequest(cfg, "DELETE", `/space_groups/${group.id}`);
  }
}

async function main() {
  const spec = parse(await readFile("circle/structure.yaml", "utf8")) as Structure;
  console.log(`Provisioning "${spec.community.name}" ${dryRun ? "(dry run)" : ""}\n`);

  // ---------- 1. Structure ----------
  console.log("## Structure");
  const groups = await listAll<SpaceGroup>("/space_groups");
  const spaces = await listAll<Space>("/spaces");
  await retire(spec, spaces, groups);
  const spaceBySlug = new Map<string, Space>(spaces.map((s) => [s.slug, s]));

  for (const g of spec.space_groups) {
    let group = groups.find((x) => x.slug === g.slug);
    if (group) log("keep", "space group", g.name);
    else {
      log("create", "space group", g.name);
      if (!dryRun) group = await circleRequest<SpaceGroup>(cfg, "POST", "/space_groups", { name: g.name, slug: g.slug, hide_non_member_spaces_from_sidebar: true });
    }

    for (const s of g.spaces) {
      let space = spaceBySlug.get(s.slug);
      if (space) log("keep", "space", `  ${s.name}`);
      else {
        log("create", "space", `  ${s.name} (${s.type})`);
        if (!dryRun && group) {
          space = await circleRequest<Space>(cfg, "POST", "/spaces", {
            space_group_id: group.id,
            name: s.name,
            slug: s.slug,
            space_type: s.type,
            is_private: false,
            is_post_disabled: s.members_can_post === false,
            default_comment_sort: "oldest",
            ...(s.description ? { locked_page_description: s.description } : {}),
          });
          if (space) spaceBySlug.set(s.slug, space);
        }
      }

      if (s.type === "course" && s.sections?.length) {
        const existingSections = space ? await listAll<Section>("/course_sections", { space_id: space.id }) : [];
        for (const sec of s.sections) {
          let section = existingSections.find((x) => x.name === sec.name);
          if (section) log("keep", "section", `    ${sec.name}`);
          else {
            log("create", "section", `    ${sec.name}`);
            if (!dryRun && space) section = await circleRequest<Section>(cfg, "POST", "/course_sections", { name: sec.name, space_id: space.id });
          }
          const existingLessons = section ? await listAll<Lesson>("/course_lessons", { section_id: section.id }) : [];
          for (const spec of sec.lessons ?? []) {
            const lesson = normalizeLesson(spec);
            const found = existingLessons.find((x) => x.name === lesson.name);
            const label = `      ${lesson.name}${lesson.youtube ? " (video)" : " (draft)"}`;
            if (found && !updateLessons) {
              log("keep", "lesson", label);
              continue;
            }
            log(found ? "apply" : "create", "lesson", found ? `${label} body refreshed` : label);
            if (dryRun || !section) continue;
            const body = await lessonBody(lesson);
            const payload = {
              name: lesson.name,
              status: lesson.youtube ? "published" : "draft",
              is_comments_enabled: true,
              rich_text_body: { body },
            };
            try {
              if (found) await circleRequest<Lesson>(cfg, "PATCH", `/course_lessons/${found.id}`, payload);
              else await circleRequest<Lesson>(cfg, "POST", "/course_lessons", { section_id: section.id, ...payload });
            } catch (err) {
              // Circle may reject the embed node shape; retry with a plain link instead.
              log("warn", "lesson", `${lesson.name}: ${(err as Error).message.slice(0, 160)}; retrying with a link`);
              const fallback = { ...payload, rich_text_body: { body: lessonDoc(lesson) } };
              if (found) await circleRequest<Lesson>(cfg, "PATCH", `/course_lessons/${found.id}`, fallback);
              else await circleRequest<Lesson>(cfg, "POST", "/course_lessons", { section_id: section.id, ...fallback });
            }
          }
        }
      }
    }
  }

  // ---------- 2. Pinned posts ----------
  console.log("\n## Pinned posts");
  for (const g of spec.space_groups) {
    for (const s of g.spaces) {
      if (!s.pinned_posts?.length) continue;
      const space = spaceBySlug.get(s.slug);
      const existing = space ? await listAll<Post>("/posts", { space_id: space.id }) : [];
      for (const post of s.pinned_posts) {
        const found = existing.find((p) => p.name === post.title);
        if (found && updatePosts) {
          await step("post", `${s.name}: ${post.title} (body refreshed)`, () =>
            circleRequest(cfg, "PUT", `/posts/${found.id}`, { name: post.title, tiptap_body: { body: markdownToTiptap(post.body) }, is_pinned: true }),
          );
        } else if (found) log("keep", "post", `${s.name}: ${post.title}`);
        else {
          log("create", "post", `${s.name}: ${post.title}`);
          if (!dryRun && space) {
            await circleRequest<Post>(cfg, "POST", "/posts", {
              space_id: space.id,
              name: post.title,
              status: "published",
              tiptap_body: { body: markdownToTiptap(post.body) },
              is_pinned: true,
              is_comments_enabled: true,
              skip_notifications: true,
            });
          }
        }
      }
    }
  }

  // ---------- 3. Member tags ----------
  console.log("\n## Member tags");
  const tags = await listAll<MemberTag>("/member_tags");
  const tagByName = new Map<string, MemberTag>(tags.map((t) => [t.name, t]));
  for (const t of spec.member_tags ?? []) {
    if (tagByName.has(t.name)) log("keep", "tag", t.name);
    else {
      log("create", "tag", t.name);
      if (!dryRun) {
        const created = await circleRequest<MemberTag>(cfg, "POST", "/member_tags", {
          name: t.name,
          color: t.color,
          emoji: t.emoji,
          is_public: t.is_public ?? true,
          display_format: "label",
          is_background_enabled: true,
        });
        tagByName.set(t.name, created);
      }
    }
  }

  // ---------- 4. Profile fields ----------
  console.log("\n## Profile fields");
  const fields = await listAll<ProfileField>("/profile_fields");
  for (const f of spec.profile_fields ?? []) {
    if (fields.find((x) => x.key === f.key)) {
      log("keep", "profile field", f.label);
      continue;
    }
    log("create", "profile field", `${f.label} (${f.field_type}${f.required ? ", required" : ""})`);
    if (dryRun) continue;
    const showOnSignup = f.show_on_signup ?? true;
    const showOnProfile = f.show_on_profile ?? false;
    await circleRequest(cfg, "POST", "/profile_fields", {
      profile_field: {
        key: f.key,
        label: f.label,
        field_type: f.field_type,
        description: f.description,
        required: f.required ?? false,
        allow_null: !(f.required ?? false),
        pages_attributes: [
          { name: "signup", visible: showOnSignup },
          { name: "edit_profile", visible: true },
          { name: "profile_view", visible: showOnProfile },
          { name: "community_view", visible: false },
        ],
        ...(f.choices ? { choices_attributes: f.choices.map((value, i) => ({ value, sort_key: i })) } : {}),
      },
    });
  }

  // ---------- 5. Community settings ----------
  console.log("\n## Settings");
  const settings = spec.settings ?? {};
  if (settings.messaging) {
    await step("messaging", JSON.stringify(settings.messaging), () => circleRequest(cfg, "PUT", "/chat_preferences", settings.messaging));
  }
  const defaultSpaceIds = (settings.default_spaces ?? []).map((slug) => spaceBySlug.get(slug)?.id).filter((id): id is number => typeof id === "number");
  const landing = settings.new_member_landing_space ? spaceBySlug.get(settings.new_member_landing_space) : undefined;
  await step("community", `hide emails=${settings.hide_emails_on_member_profiles ?? "unchanged"}, search indexing=${settings.allow_profile_search_indexing ?? "unchanged"}, default spaces=${settings.default_spaces?.join(", ") ?? "unchanged"}`, () =>
    circleRequest(cfg, "PUT", "/community", {
      community: {
        ...(landing ? { default_new_member_space_id: landing.id, default_existing_member_space_id: landing.id } : {}),
      },
      community_setting: {
        ...(settings.hide_emails_on_member_profiles !== undefined ? { hide_emails_on_member_profiles: settings.hide_emails_on_member_profiles } : {}),
        ...(settings.allow_profile_search_indexing !== undefined ? { allow_profile_search_indexing: settings.allow_profile_search_indexing } : {}),
        ...(defaultSpaceIds.length ? { default_space_ids: defaultSpaceIds } : {}),
      },
    }),
  );

  // ---------- 6. Bot member ----------
  console.log("\n## Bot member");
  const bot = spec.bot_member;
  const botEmail = process.env.BOT_AUTHOR_EMAIL;
  if (!bot) log("skip", "bot member", "none in structure.yaml");
  else if (!botEmail) log("skip", "bot member", `${bot.name}: set BOT_AUTHOR_EMAIL to create it`);
  else {
    const members = await listAll<Member>("/community_members");
    if (members.find((m) => m.email.toLowerCase() === botEmail.toLowerCase())) log("keep", "bot member", `${bot.name} <${botEmail}>`);
    else {
      log("create", "bot member", `${bot.name} <${botEmail}>`);
      if (!dryRun) {
        const tag = bot.tag ? tagByName.get(bot.tag) : undefined;
        const botSpaces = (bot.spaces ?? []).map((slug) => spaceBySlug.get(slug)?.id).filter((id): id is number => typeof id === "number");
        await circleRequest(cfg, "POST", "/community_members", {
          email: botEmail,
          name: bot.name,
          headline: bot.headline,
          skip_invitation: true,
          member_tag_ids: tag ? [tag.id] : [],
          space_ids: botSpaces,
          preferences: { messaging_enabled_by_admin: false },
        });
      }
    }
  }

  console.log(`\nDone. created=${summary.created} kept=${summary.kept} settings applied=${summary.applied} warnings=${summary.warned}`);
  if (summary.warned) process.exitCode = 2;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
