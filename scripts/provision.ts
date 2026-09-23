/**
 * Provision the Circle community from circle/structure.yaml using the Admin API v2.
 *
 * Requires the Circle Business plan or above (the Professional plan has no Admin API).
 *
 *   CIRCLE_ADMIN_TOKEN=... npm run provision           # create anything missing
 *   npm run provision:dry                              # print the plan, no token needed
 *
 * Idempotent: space groups and spaces are matched by slug, sections and lessons by name.
 */
import { readFile } from "node:fs/promises";
import { parse } from "yaml";
import { circleRequest, type CircleClientConfig } from "../src/circle.js";

interface LessonSpec { name: string }
interface SectionSpec { name: string; lessons?: string[] }
interface SpaceSpec {
  name: string;
  slug: string;
  type: "basic" | "course" | "event" | "chat" | "image" | "members";
  description?: string;
  members_can_post?: boolean;
  sections?: SectionSpec[];
}
interface GroupSpec { name: string; slug: string; spaces: SpaceSpec[] }
interface Structure { community: { name: string }; space_groups: GroupSpec[] }

interface Paged<T> { records: T[]; has_next_page: boolean }
interface SpaceGroup { id: number; name: string; slug: string }
interface Space { id: number; name: string; slug: string; space_group_id: number; space_type?: string }
interface Section { id: number; name: string; space_id: number }
interface Lesson { id: number; name: string; section_id: number }

const dryRun = process.argv.includes("--dry-run");
const token = process.env.CIRCLE_ADMIN_TOKEN;
if (!dryRun && !token) {
  console.error("CIRCLE_ADMIN_TOKEN is required (or pass --dry-run).");
  process.exit(1);
}
const cfg: CircleClientConfig = { token: token ?? "dry", baseUrl: process.env.CIRCLE_API_BASE };

async function listAll<T>(path: string, query: Record<string, string | number> = {}): Promise<T[]> {
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

function log(action: "keep" | "create", kind: string, name: string) {
  console.log(`${dryRun ? "[dry-run] " : ""}${action.padEnd(6)} ${kind.padEnd(12)} ${name}`);
}

async function main() {
  const spec = parse(await readFile("circle/structure.yaml", "utf8")) as Structure;
  console.log(`Provisioning "${spec.community.name}" ${dryRun ? "(dry run)" : ""}\n`);

  const groups = dryRun ? [] : await listAll<SpaceGroup>("/space_groups");
  const spaces = dryRun ? [] : await listAll<Space>("/spaces");

  for (const g of spec.space_groups) {
    let group = groups.find((x) => x.slug === g.slug);
    if (group) log("keep", "space group", g.name);
    else {
      log("create", "space group", g.name);
      if (!dryRun) group = await circleRequest<SpaceGroup>(cfg, "POST", "/space_groups", { name: g.name, slug: g.slug, hide_non_member_spaces_from_sidebar: true });
    }

    for (const s of g.spaces) {
      let space = spaces.find((x) => x.slug === s.slug);
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
        }
      }

      if (s.type !== "course" || !s.sections?.length) continue;
      const existingSections = dryRun || !space ? [] : await listAll<Section>("/course_sections", { space_id: space.id });
      for (const sec of s.sections) {
        let section = existingSections.find((x) => x.name === sec.name);
        if (section) log("keep", "section", `    ${sec.name}`);
        else {
          log("create", "section", `    ${sec.name}`);
          if (!dryRun && space) section = await circleRequest<Section>(cfg, "POST", "/course_sections", { name: sec.name, space_id: space.id });
        }
        const existingLessons = dryRun || !section ? [] : await listAll<Lesson>("/course_lessons", { section_id: section.id });
        for (const lessonName of sec.lessons ?? []) {
          if (existingLessons.find((x) => x.name === lessonName)) log("keep", "lesson", `      ${lessonName}`);
          else {
            log("create", "lesson", `      ${lessonName} (draft)`);
            if (!dryRun && section) {
              await circleRequest<Lesson>(cfg, "POST", "/course_lessons", {
                section_id: section.id,
                name: lessonName,
                status: "draft",
                body_html: `<p>Lesson video and notes coming soon.</p>`,
                is_comments_enabled: true,
              });
            }
          }
        }
      }
    }
  }
  console.log("\nDone.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
