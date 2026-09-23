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
export interface LessonMedia {
  /** Circle embed of the YouTube video (from POST /embeds). */
  embed?: { sgid: string; url: string };
  /** A file uploaded to Circle (from POST /direct_uploads). Takes precedence over the embed. */
  upload?: { sgid: string; signedId: string; filename: string };
}

export function lessonDoc(lesson: LessonContent, media: LessonMedia = {}): TiptapDoc {
  const content: TiptapNode[] = [];
  if (lesson.description) content.push(paragraph(text(lesson.description)));
  if (media.upload) {
    content.push({ type: "file", attrs: { sgid: media.upload.sgid, signed_id: media.upload.signedId, filename: media.upload.filename } });
  } else if (lesson.youtube) {
    const url = youtubeUrl(lesson.youtube);
    if (media.embed) content.push({ type: "embed", attrs: { sgid: media.embed.sgid, url: media.embed.url } });
    else content.push(paragraph(text("Watch the lesson on YouTube", [{ type: "link", attrs: { href: url, target: "_blank" } } as unknown as { type: string }])));
  }
  if (lesson.note) content.push(paragraph(text("Heads up: ", [{ type: "bold" }]), text(lesson.note)));
  if (lesson.creator) content.push(paragraph(text(`Video by ${lesson.creator}, shared with credit. `, [{ type: "italic" }]), text("Our notes and the project are our own.", [{ type: "italic" }])));
  return { type: "doc", content };
}
