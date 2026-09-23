/**
 * Minimal Markdown -> TipTap (ProseMirror JSON) converter for Circle post bodies.
 * Supports: "# " and "## " headings, "- " bullet lists, "1. " ordered lists,
 * blank-line separated paragraphs, and **bold** inline.
 */
export interface TiptapNode {
  type: string;
  attrs?: Record<string, unknown>;
  content?: TiptapNode[];
  text?: string;
  marks?: Array<{ type: string }>;
}

export interface TiptapDoc {
  type: "doc";
  content: TiptapNode[];
}

function inline(text: string): TiptapNode[] {
  const out: TiptapNode[] = [];
  const parts = text.split(/(\*\*[^*]+\*\*)/g).filter(Boolean);
  for (const part of parts) {
    const m = part.match(/^\*\*([^*]+)\*\*$/);
    if (m) out.push({ type: "text", text: m[1], marks: [{ type: "bold" }] });
    else out.push({ type: "text", text: part });
  }
  return out.length ? out : [{ type: "text", text: "" }];
}

function paragraph(text: string): TiptapNode {
  return { type: "paragraph", content: inline(text) };
}

export function markdownToTiptap(markdown: string): TiptapDoc {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const content: TiptapNode[] = [];
  let para: string[] = [];
  let list: { type: "bulletList" | "orderedList"; items: string[] } | null = null;

  const flushPara = () => {
    if (para.length) content.push(paragraph(para.join(" ").trim()));
    para = [];
  };
  const flushList = () => {
    if (list) {
      content.push({
        type: list.type,
        content: list.items.map((item) => ({ type: "listItem", content: [paragraph(item)] })),
      });
    }
    list = null;
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    const heading = line.match(/^(#{1,3})\s+(.+)$/);
    const bullet = line.match(/^[-*]\s+(.+)$/);
    const ordered = line.match(/^\d+[.)]\s+(.+)$/);

    if (!line.trim()) {
      flushPara();
      flushList();
    } else if (heading) {
      flushPara();
      flushList();
      const level = Math.min(heading[1].length + 1, 3); // "#" -> h2, "##" -> h3
      content.push({ type: "heading", attrs: { level }, content: inline(heading[2].trim()) });
    } else if (bullet || ordered) {
      flushPara();
      const type = bullet ? "bulletList" : "orderedList";
      if (!list || list.type !== type) {
        flushList();
        list = { type, items: [] };
      }
      list.items.push((bullet ?? ordered)![1].trim());
    } else {
      flushList();
      para.push(line.trim());
    }
  }
  flushPara();
  flushList();
  return { type: "doc", content };
}
