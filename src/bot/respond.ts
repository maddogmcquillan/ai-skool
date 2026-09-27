import { stripHtml, truncate } from "../lib/text.js";
import { answerQuestion } from "./answer.js";
import type { KnowledgeBase } from "./knowledge.js";
import { escalationReply, evaluateQuestion } from "./policy.js";

/** One earlier message in a thread. */
export interface ThreadMessage {
  role: "member" | "coach" | "team";
  name?: string;
  /** Plain text or HTML; it is stripped before use. */
  text: string;
}

/** One question from the community, whichever route it arrived by (webhook or poller). */
export interface QuestionInput {
  title?: string;
  /** The latest message: plain text or HTML. `bodyHtml` wins when both are set. */
  body?: string;
  bodyHtml?: string;
  authorName?: string;
  spaceName?: string;
  /** The thread so far, oldest first, not including the latest message. */
  thread?: ThreadMessage[];
  /** Webhook shape: the original post when the latest message is a comment (folded into `thread`). */
  parentPostBody?: string;
}

export interface ReplyOptions {
  model: string;
  effort: "low" | "medium" | "high";
  /** No Claude call; a stub answer comes back. Set when there is no API key. */
  dryRun: boolean;
}

export interface ReplyResult {
  answer: string;
  /** True when a human must follow up: a policy rule matched or the model refused. */
  escalate: boolean;
  reason?: string;
  sources: string[];
}

const MAX_THREAD_CHARS = 6000;

/** Render the thread as one line per message, keeping the most recent messages when it is long. */
export function renderThread(thread: ThreadMessage[]): string {
  const lines = thread.map((m) => {
    const who = m.role === "coach" ? "Coach" : m.role === "team" ? "Team" : `Member${m.name ? ` ${m.name.trim().split(/\s+/)[0]}` : ""}`;
    return `[${who}] ${truncate(stripHtml(m.text), 1500)}`;
  });
  let out = lines.join("\n");
  while (out.length > MAX_THREAD_CHARS && lines.length > 1) {
    lines.shift();
    out = `[earlier messages omitted]\n${lines.join("\n")}`;
  }
  return out;
}

/**
 * Turn a question into Coach's reply: the escalation rules first (billing, account, safety,
 * personal info, legal go to a human), then retrieval over the knowledge folder and Claude.
 * When a thread is given, the model sees it and continues the conversation.
 */
export async function composeReply(input: QuestionInput, kb: KnowledgeBase, opts: ReplyOptions): Promise<ReplyResult> {
  const question = truncate(stripHtml(input.bodyHtml || input.body || ""), 6000);
  const firstName = input.authorName?.trim().split(/\s+/)[0];
  const decision = evaluateQuestion(`${input.title ?? ""}\n${question}`);
  if (decision.escalate) {
    return { answer: escalationReply(firstName, decision.reason ?? "other"), escalate: true, reason: decision.reason, sources: [] };
  }

  const thread: ThreadMessage[] = [
    ...(input.parentPostBody ? [{ role: "member" as const, text: input.parentPostBody }] : []),
    ...(input.thread ?? []),
  ];
  const conversation = thread.length ? renderThread(thread) : undefined;
  const recentMemberText = thread
    .filter((m) => m.role === "member")
    .slice(-2)
    .map((m) => stripHtml(m.text))
    .join("\n");
  const query = [input.title, question, recentMemberText].filter(Boolean).join("\n");
  const context = kb.search(query, 6);
  const result = await answerQuestion(
    {
      question,
      conversation,
      title: input.title,
      authorFirstName: firstName,
      spaceName: input.spaceName,
      context,
      pinned: kb.pinned(),
    },
    { model: opts.model, effort: opts.effort, dryRun: opts.dryRun },
  );
  return {
    answer: result.answer,
    escalate: result.refused,
    reason: result.refused ? "model-refusal" : undefined,
    sources: result.sources,
  };
}
