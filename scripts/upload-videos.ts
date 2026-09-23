/**
 * Upload course videos into Circle lessons via the Admin API v2.
 *
 *   npm run upload-videos -- --dry-run      # show the mapping, download nothing
 *   npm run upload-videos -- --test-one     # process only the first manifest entry
 *   npm run upload-videos                   # process every entry
 *
 * Reads circle/videos.yaml:
 *   drive_folder_url: https://drive.google.com/drive/folders/...   (public "anyone with the link")
 *   videos:
 *     - file: "01 - What is AI.mp4"        # file name inside the Drive folder (loose match)
 *       course: ai-foundations             # course space slug from circle/structure.yaml
 *       section: "Module 1: What is AI?"   # section name
 *       lesson: What AI is and is not      # lesson name (must already exist; run provision first)
 *
 * Flow per video: download with gdown into .videos/ -> Circle direct upload (presigned PUT)
 * -> PATCH the lesson body with the uploaded file. The lesson's top "featured media" player
 * cannot be set through the API; the file lands in the lesson body instead. Verify the first
 * lesson in Circle's editor before running the rest.
 */
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, openAsBlob, readdirSync, statSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { parse } from "yaml";
import { circleRequest, type CircleClientConfig } from "../src/circle.js";
import { blobKey, contentTypeFor, md5Base64, normalizeFileName } from "../src/lib/upload.js";
import { lessonDoc, normalizeLesson, type LessonContent } from "../src/lib/lessonBody.js";

interface VideoSpec { file: string; course: string; section: string; lesson: string }
interface Manifest { drive_folder_url?: string; videos: VideoSpec[] }
interface Paged<T> { records: T[]; has_next_page: boolean }
interface Space { id: number; slug: string; name: string }
interface Section { id: number; name: string }
interface Lesson { id: number; name: string }
interface DirectUpload { signed_id: string; attachable_sgid: string; direct_upload: { url: string; headers: Record<string, string> } }

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const testOne = args.includes("--test-one");
const STAGING = path.resolve(".videos");
const token = process.env.CIRCLE_ADMIN_TOKEN;
if (!dryRun && !token) {
  console.error("CIRCLE_ADMIN_TOKEN is required (or pass --dry-run).");
  process.exit(1);
}
const cfg: CircleClientConfig = { token: token ?? "dry", baseUrl: process.env.CIRCLE_API_BASE };

async function listAll<T>(p: string, query: Record<string, string | number> = {}): Promise<T[]> {
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

function stagedFiles(): string[] {
  if (!existsSync(STAGING)) return [];
  const out: string[] = [];
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else out.push(full);
    }
  };
  walk(STAGING);
  return out;
}

function findLocal(fileName: string): string | undefined {
  const want = normalizeFileName(fileName);
  return stagedFiles().find((f) => normalizeFileName(f) === want || path.basename(f) === fileName);
}

function downloadFolder(url: string) {
  mkdirSync(STAGING, { recursive: true });
  console.log(`Downloading Drive folder into ${STAGING} (gdown)...`);
  // gdown 4 and 5 need --remaining-ok to download a folder with more than 50 files; gdown 6
  // dropped the flag and rejects it, so only pass it when this gdown's help text lists it.
  const help = spawnSync("gdown", ["--help"], { encoding: "utf8" });
  const flags = ["--folder", "--continue", ...(help.stdout?.includes("--remaining-ok") ? ["--remaining-ok"] : [])];
  const run = spawnSync("gdown", [...flags, "-O", STAGING, url], { stdio: "inherit" });
  if (run.status !== 0) throw new Error("gdown failed. Is the folder shared as 'Anyone with the link'? Is gdown installed (pip install gdown)?");
}

interface StructureSection { name: string; lessons?: Array<string | LessonContent> }
interface StructureSpace { slug: string; sections?: StructureSection[] }
interface StructureFile { space_groups: Array<{ spaces: StructureSpace[] }> }

/** Find the lesson's text (description, creator, note) in circle/structure.yaml. */
async function lessonSpec(v: VideoSpec): Promise<LessonContent> {
  const structure = parse(await readFile("circle/structure.yaml", "utf8")) as StructureFile;
  for (const g of structure.space_groups) {
    for (const sp of g.spaces) {
      if (sp.slug !== v.course) continue;
      for (const sec of sp.sections ?? []) {
        if (sec.name !== v.section) continue;
        for (const l of sec.lessons ?? []) {
          const lesson = normalizeLesson(l);
          if (lesson.name === v.lesson) return lesson;
        }
      }
    }
  }
  return { name: v.lesson };
}

/** Full lesson body from the yaml, with the uploaded file in place of the YouTube embed. */
function lessonBody(upload: DirectUpload, fileName: string, lesson: LessonContent) {
  return {
    body: lessonDoc(lesson, { upload: { sgid: upload.attachable_sgid, signedId: upload.signed_id, filename: fileName } }),
    attachments: [upload.attachable_sgid],
    inline_attachments: [upload.signed_id],
  };
}

async function uploadFile(filePath: string): Promise<DirectUpload> {
  const byte_size = statSync(filePath).size;
  const checksum = await md5Base64(filePath);
  const filename = path.basename(filePath);
  const content_type = contentTypeFor(filePath);
  const raw = await circleRequest<DirectUpload | Record<string, DirectUpload>>(cfg, "POST", "/direct_uploads", { blob: { key: blobKey(), filename, content_type, byte_size, checksum } });
  // Some Circle create endpoints wrap the record; accept { direct_upload: {...} } at the top level or nested one level down.
  const du = ((raw as DirectUpload).direct_upload ? raw : Object.values(raw as Record<string, DirectUpload>).find((v) => v && typeof v === "object" && "direct_upload" in v)) as DirectUpload | undefined;
  if (!du?.direct_upload?.url || !du.signed_id) throw new Error(`Unexpected direct upload response: ${JSON.stringify(raw).slice(0, 300)}`);
  const headers: Record<string, string> = { ...du.direct_upload.headers };
  if (!Object.keys(headers).some((h) => h.toLowerCase() === "content-type")) headers["Content-Type"] = content_type;
  const res = await fetch(du.direct_upload.url, { method: "PUT", headers, body: await openAsBlob(filePath) });
  if (!res.ok) throw new Error(`Storage PUT failed (${res.status}): ${(await res.text()).slice(0, 300)}`);
  return du;
}

async function main() {
  const manifest = parse(await readFile("circle/videos.yaml", "utf8")) as Manifest;
  const entries = testOne ? manifest.videos.slice(0, 1) : manifest.videos;
  console.log(`${entries.length} video(s) to process${dryRun ? " (dry run)" : ""}\n`);

  if (dryRun) {
    for (const v of entries) console.log(`${v.file}  ->  ${v.course} / ${v.section} / ${v.lesson}`);
    return;
  }

  if (manifest.drive_folder_url && entries.some((v) => !findLocal(v.file))) downloadFolder(manifest.drive_folder_url);

  const spaces = await listAll<Space>("/spaces");
  let ok = 0;
  for (const v of entries) {
    const local = findLocal(v.file);
    if (!local) { console.log(`skip   ${v.file}: not found in ${STAGING}`); continue; }
    const space = spaces.find((s) => s.slug === v.course);
    if (!space) { console.log(`skip   ${v.file}: no course space with slug '${v.course}'`); continue; }
    const section = (await listAll<Section>("/course_sections", { space_id: space.id })).find((s) => s.name === v.section);
    if (!section) { console.log(`skip   ${v.file}: no section '${v.section}' in ${space.name}`); continue; }
    const lesson = (await listAll<Lesson>("/course_lessons", { section_id: section.id })).find((l) => l.name === v.lesson);
    if (!lesson) { console.log(`skip   ${v.file}: no lesson '${v.lesson}' in ${v.section} (run provision first)`); continue; }

    console.log(`upload ${path.basename(local)} (${(statSync(local).size / 1e6).toFixed(1)} MB) -> ${space.name} / ${v.section} / ${v.lesson}`);
    const du = await uploadFile(local);
    await circleRequest(cfg, "PATCH", `/course_lessons/${lesson.id}`, { rich_text_body: lessonBody(du, path.basename(local), await lessonSpec(v)) });
    console.log(`done   lesson #${lesson.id} updated`);
    ok++;
  }
  console.log(`\nFinished: ${ok}/${entries.length} uploaded.`);
  if (testOne) console.log("Open that lesson in Circle's editor and confirm the video plays before running the rest.");
}

main().catch((err) => { console.error(err); process.exit(1); });
