import type { TiptapDoc, TiptapNode } from "./tiptap.js";

/** A lesson entry in circle/structure.yaml. Plain strings are titles only. */
export interface LessonContent {
  name: string;
  description?: string;
  /** YouTube video id or full URL. */
  youtube?: string;
  creator?: string;
  /** Extra caution line, e.g. a paid-tool warning. */
  note?: string;
}

export function normalizeLesson(spec: string | LessonContent): LessonContent {
  return typeof spec === "string" ? { name: spec } : spec;
}

export function youtubeUrl(idOrUrl: string): string {
  const s = idOrUrl.trim();
  if (/^https?:\/\//i.test(s)) return s;
  return `https://www.youtube.com/watch?v=${s}`;
}

function text(t: string, marks?: TiptapNode["marks"]): TiptapNode {
  return marks ? { type: "text", text: t, marks } : { type: "text", text: t };
}

function paragraph(...content: TiptapNode[]): TiptapNode {
  return { type: "paragraph", content };
}

/**
 * Build the lesson body: description, the video (an embed node when Circle gave us one,
 * otherwise a plain link), an optional caution note, and the creator credit.
 */
export function lessonDoc(lesson: LessonContent, embed?: { sgid: string; url: string }): TiptapDoc {
  const content: TiptapNode[] = [];
  if (lesson.description) content.push(paragraph(text(lesson.description)));
  if (lesson.youtube) {
    const url = youtubeUrl(lesson.youtube);
    if (embed) content.push({ type: "embed", attrs: { sgid: embed.sgid, url: embed.url } });
    else content.push(paragraph(text("Watch the lesson on YouTube", [{ type: "link", attrs: { href: url, target: "_blank" } } as unknown as { type: string }])));
  }
  if (lesson.note) content.push(paragraph(text("Heads up: ", [{ type: "bold" }]), text(lesson.note)));
  if (lesson.creator) content.push(paragraph(text(`Video by ${lesson.creator}, shared with credit. `, [{ type: "italic" }]), text("Our notes and the project are our own.", [{ type: "italic" }])));
  return { type: "doc", content };
}
