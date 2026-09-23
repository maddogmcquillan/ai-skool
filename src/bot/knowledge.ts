import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import MiniSearch from "minisearch";

export interface Chunk {
  id: string;
  file: string;
  title: string;
  heading: string;
  text: string;
  /** Files named 00-*.md are "pinned" and always given to the model. */
  pinned: boolean;
}

const MAX_CHUNK_CHARS = 1400;

function fileTitle(markdown: string, fallback: string): string {
  const m = markdown.match(/^#\s+(.+)$/m);
  return (m?.[1] ?? fallback).trim();
}

/** Split one markdown file into heading-scoped chunks of roughly MAX_CHUNK_CHARS. */
export function chunkMarkdown(file: string, markdown: string): Chunk[] {
  const title = fileTitle(markdown, path.basename(file, ".md"));
  const pinned = /^00-/.test(path.basename(file));
  const sections = markdown.split(/^(?=##\s)/m);
  const chunks: Chunk[] = [];
  let n = 0;
  for (const section of sections) {
    const headingMatch = section.match(/^##\s+(.+)$/m);
    const heading = (headingMatch?.[1] ?? title).trim();
    const body = section.replace(/^#{1,2}\s+.+$/m, "").trim();
    if (!body) continue;
    const paragraphs = body.split(/\n\s*\n/);
    let buf = "";
    const flush = () => {
      if (buf.trim()) {
        chunks.push({ id: `${file}#${n++}`, file, title, heading, text: buf.trim(), pinned });
      }
      buf = "";
    };
    for (const p of paragraphs) {
      if ((buf + "\n\n" + p).length > MAX_CHUNK_CHARS && buf) flush();
      buf = buf ? `${buf}\n\n${p}` : p;
    }
    flush();
  }
  return chunks;
}

async function walk(dir: string): Promise<string[]> {
  const out: string[] = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(full)));
    else if (entry.isFile() && entry.name.toLowerCase().endsWith(".md") && entry.name.toLowerCase() !== "readme.md") out.push(full);
  }
  return out.sort();
}

export async function loadChunks(dir: string): Promise<Chunk[]> {
  const files = await walk(dir);
  const chunks: Chunk[] = [];
  for (const f of files) {
    const rel = path.relative(dir, f);
    chunks.push(...chunkMarkdown(rel, await readFile(f, "utf8")));
  }
  return chunks;
}

export class KnowledgeBase {
  private index: MiniSearch<Chunk>;
  readonly chunks: Chunk[];

  constructor(chunks: Chunk[]) {
    this.chunks = chunks;
    this.index = new MiniSearch<Chunk>({
      fields: ["title", "heading", "text"],
      storeFields: ["id", "file", "title", "heading", "text", "pinned"],
      searchOptions: { boost: { title: 2, heading: 1.5 }, prefix: true, fuzzy: 0.2 },
    });
    this.index.addAll(chunks);
  }

  static async fromDir(dir: string): Promise<KnowledgeBase> {
    return new KnowledgeBase(await loadChunks(dir));
  }

  pinned(): Chunk[] {
    return this.chunks.filter((c) => c.pinned);
  }

  search(query: string, k = 6): Chunk[] {
    const q = query.trim();
    if (!q) return [];
    return this.index
      .search(q)
      .slice(0, k)
      .map((hit) => hit as unknown as Chunk)
      .filter((c) => !c.pinned);
  }
}
