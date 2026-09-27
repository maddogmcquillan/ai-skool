import { stripHtml, truncate } from "../lib/text.js";
import { answerQuestion } from "./answer.js";
import type { KnowledgeBase } from "./knowledge.js";
import { escalationReply, evaluateQuestion } from "./policy.js";

/** One question from the community, whichever route it arrived by (webhook or poller). */
export interface QuestionInput {
  title?: string;
  /** Plain text or HTML; `bodyHtml` wins when both are set. */
  body?: string;
  bodyHtml?: string;
  authorName?: string;
  spaceName?: string;
  /** For follow-up comments: the original post, so the bot has the thread context. */
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

/**
 * Turn a question into Coach's reply: the escalation rules first (billing, account, safety,
 * personal info, legal go to a human), then retrieval over the knowledge folder and Claude.
 */
export async function composeReply(input: QuestionInput, kb: KnowledgeBase, opts: ReplyOptions): Promise<ReplyResult> {
  const question = truncate(stripHtml(input.bodyHtml || input.body || ""), 6000);
  const firstName = input.authorName?.trim().split(/\s+/)[0];
  const decision = evaluateQuestion(`${input.title ?? ""}\n${question}`);
  if (decision.escalate) {
    return { answer: escalationReply(firstName, decision.reason ?? "other"), escalate: true, reason: decision.reason, sources: [] };
  }

  const parent = input.parentPostBody ? stripHtml(input.parentPostBody) : "";
  const query = [input.title, question, parent].filter(Boolean).join("\n");
  const context = kb.search(query, 6);
  const result = await answerQuestion(
    {
      question: parent ? `${question}\n\n(Context, the original post:)\n${truncate(parent, 2000)}` : question,
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
