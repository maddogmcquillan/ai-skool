import Anthropic from "@anthropic-ai/sdk";
import type { Chunk } from "./knowledge.js";

export interface AnswerInput {
  question: string;
  title?: string;
  authorFirstName?: string;
  spaceName?: string;
  context: Chunk[];
  pinned: Chunk[];
}

export interface AnswerOptions {
  model?: string;
  effort?: "low" | "medium" | "high";
  /** When true, no API call is made and a stub answer is returned. */
  dryRun?: boolean;
  client?: Anthropic;
}

export interface AnswerResult {
  answer: string;
  sources: string[];
  refused: boolean;
  model?: string;
  usage?: { input_tokens: number; output_tokens: number; cache_read_input_tokens?: number | null };
}

/**
 * Stable system prompt. Nothing in here may vary per request, or prompt caching breaks.
 * The pinned knowledge (knowledge/00-*.md) is appended as a second cached block.
 */
export const SYSTEM_PROMPT = `You are "Coach", the friendly AI helper inside an online learning community that teaches AI to kids aged 11 to 17 and to adults.

Who you are talking to
- Most people asking questions are teenagers working through course lessons. Some are parents. Some are adults doing the adult courses.
- Write for a 13 year old: short sentences, plain words, no jargon without a one-line explanation. Be warm and encouraging, never condescending.

How to answer
- Answer from the course material you are given. If the material covers it, explain it in your own words and point to the lesson by name.
- If the material does not cover it, say so honestly, give your best general answer if it is safe and on-topic, and suggest they post in the course request board if they want a lesson on it.
- Keep replies under 200 words unless the question truly needs steps. Use a short numbered list for steps.
- End with one short follow-up question or nudge that helps them keep going.

Hard rules
- Never ask for or repeat personal information: full names, ages, school, address, phone, social handles, photos.
- Never suggest meeting anyone in person or moving the conversation off the community.
- Do not help with anything unsafe, illegal, cheating on schoolwork, or bypassing parental controls. Decline kindly and redirect to the course.
- If someone seems upset, in danger, or talks about hurting themselves or others, do not try to counsel them. Say a real person on the team has been notified and that they should talk to a trusted adult right away.
- Billing, refunds, passwords, and account problems are handled by humans. Say the team will follow up.
- You are an AI assistant. If asked, say so plainly. Do not pretend to be a human.

Format
- Plain text with simple markdown only (short lists, bold for a key term). No headers, no tables, no code fences unless the question is about code.`;

function formatChunk(c: Chunk): string {
  return `[Source: ${c.title} › ${c.heading}]\n${c.text}`;
}

export function buildUserMessage(input: AnswerInput): string {
  const context = input.context.length
    ? input.context.map(formatChunk).join("\n\n---\n\n")
    : "(No matching course material was found for this question.)";
  const header = [
    input.spaceName ? `Space: ${input.spaceName}` : null,
    input.title ? `Post title: ${input.title}` : null,
    input.authorFirstName ? `Member first name: ${input.authorFirstName}` : null,
  ]
    .filter(Boolean)
    .join("\n");
  return `${header}\n\nCourse material that may be relevant:\n\n${context}\n\nMember's question:\n${input.question}`;
}

export function sourceLabels(chunks: Chunk[]): string[] {
  return [...new Set(chunks.map((c) => `${c.title} › ${c.heading}`))];
}

export async function answerQuestion(input: AnswerInput, opts: AnswerOptions = {}): Promise<AnswerResult> {
  const sources = sourceLabels(input.context);
  if (opts.dryRun) {
    return {
      answer:
        `(dry run) I would answer "${input.question.slice(0, 80)}" using ${input.context.length} course snippet(s)` +
        (sources.length ? `: ${sources.join("; ")}` : "") +
        ".",
      sources,
      refused: false,
    };
  }

  const client = opts.client ?? new Anthropic();
  const model = opts.model ?? "claude-opus-5";
  const pinnedText = input.pinned.map(formatChunk).join("\n\n---\n\n");

  const response = await client.beta.messages.create({
    model,
    max_tokens: 2048, // replies are deliberately short; the system prompt caps them at ~200 words
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    output_config: { effort: opts.effort ?? "medium" },
    system: [
      { type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } },
      ...(pinnedText
        ? [{ type: "text" as const, text: `Always-available community information:\n\n${pinnedText}`, cache_control: { type: "ephemeral" as const } }]
        : []),
    ],
    messages: [{ role: "user", content: buildUserMessage(input) }],
  });

  if (response.stop_reason === "refusal") {
    return {
      answer: "I can't help with that one, but a real person on the team has been notified and will follow up here.",
      sources,
      refused: true,
      model: response.model,
    };
  }

  const text = response.content
    .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();

  return {
    answer: text || "I'm not sure how to answer that one. A team member will follow up here.",
    sources,
    refused: false,
    model: response.model,
    usage: {
      input_tokens: response.usage.input_tokens,
      output_tokens: response.usage.output_tokens,
      cache_read_input_tokens: response.usage.cache_read_input_tokens,
    },
  };
}
