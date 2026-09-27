import { Hono } from "hono";
import { buildMetaEvent, sendToMeta, type CapiConfig, type ChargeHook } from "./capi.js";
import type { CoachLoopStatus } from "./bot/coachLoop.js";
import { KnowledgeBase } from "./bot/knowledge.js";
import { isBotAuthor } from "./bot/policy.js";
import { composeReply } from "./bot/respond.js";
import { createCircleComment } from "./circle.js";

export interface ServerConfig {
  hookSecret: string;
  dryRun: boolean;
  capi: CapiConfig;
  answer: { model: string; effort: "low" | "medium" | "high"; botAuthorEmail?: string };
  circle?: { token: string; baseUrl?: string };
  knowledgeDir: string;
}

/** Payload the Zapier "New Post" / "New Comment Posted" Zap posts to /hooks/circle/question. */
export interface QuestionHook {
  kind?: "post" | "comment";
  post_id: number | string;
  comment_id?: number | string;
  title?: string;
  body: string;
  body_html?: string;
  author_name?: string;
  author_email?: string;
  author_is_admin?: boolean;
  space_name?: string;
  post_url?: string;
  /** For comments: the original post text, so the bot has the thread context. */
  parent_post_body?: string;
  /** Set true to have the server post the reply via the Admin API (needs CIRCLE_ADMIN_TOKEN). */
  post_directly?: boolean;
}

export function configFromEnv(env: NodeJS.ProcessEnv = process.env): ServerConfig {
  const dryRun = env.DRY_RUN === "1" || (!env.ANTHROPIC_API_KEY && !env.ANTHROPIC_AUTH_TOKEN);
  return {
    hookSecret: env.HOOK_SECRET ?? "",
    dryRun,
    capi: {
      pixelId: env.META_PIXEL_ID ?? "",
      accessToken: env.META_CAPI_ACCESS_TOKEN ?? "",
      apiVersion: env.META_API_VERSION ?? "v25.0",
      defaultSourceUrl: env.CAPI_DEFAULT_SOURCE_URL ?? "",
      currency: env.CAPI_CURRENCY ?? "USD",
      testEventCode: env.META_TEST_EVENT_CODE || undefined,
    },
    answer: {
      model: env.ANSWER_MODEL ?? "claude-opus-5",
      effort: (env.ANSWER_EFFORT as "low" | "medium" | "high") ?? "medium",
      botAuthorEmail: env.BOT_AUTHOR_EMAIL || undefined,
    },
    circle: env.CIRCLE_ADMIN_TOKEN ? { token: env.CIRCLE_ADMIN_TOKEN, baseUrl: env.CIRCLE_API_BASE } : undefined,
    knowledgeDir: env.KNOWLEDGE_DIR ?? "./knowledge",
  };
}

export interface AppDeps {
  fetchImpl?: typeof fetch;
  kb?: KnowledgeBase;
  /** Called after /admin/reload-knowledge, so the Coach loop can pick up the new knowledge. */
  onKnowledgeReload?: (kb: KnowledgeBase) => void;
  /** Reported on /healthz when the Coach poller is running. */
  coachStatus?: () => CoachLoopStatus | undefined;
}

export async function createApp(cfg: ServerConfig, deps: AppDeps = {}) {
  const fetchImpl = deps.fetchImpl ?? fetch;
  let kb = deps.kb ?? (await KnowledgeBase.fromDir(cfg.knowledgeDir));
  const app = new Hono();

  app.get("/healthz", (c) => c.json({ ok: true, dryRun: cfg.dryRun, knowledgeChunks: kb.chunks.length, coach: deps.coachStatus?.() ?? null }));

  app.use("/hooks/*", async (c, next) => {
    if (!cfg.hookSecret || c.req.header("x-hook-secret") !== cfg.hookSecret) {
      return c.json({ error: "unauthorized" }, 401);
    }
    await next();
  });
  app.use("/admin/*", async (c, next) => {
    if (!cfg.hookSecret || c.req.header("x-hook-secret") !== cfg.hookSecret) {
      return c.json({ error: "unauthorized" }, 401);
    }
    await next();
  });

  app.post("/admin/reload-knowledge", async (c) => {
    kb = await KnowledgeBase.fromDir(cfg.knowledgeDir);
    deps.onKnowledgeReload?.(kb);
    return c.json({ ok: true, knowledgeChunks: kb.chunks.length });
  });

  // Zapier: Circle "New Member Paid Charge" -> here -> Meta Conversions API
  app.post("/hooks/circle/charge", async (c) => {
    const hook = (await c.req.json().catch(() => null)) as ChargeHook | null;
    if (!hook || !hook.email || !hook.paywall_key) {
      return c.json({ error: "email and paywall_key are required" }, 400);
    }
    const event = buildMetaEvent(hook, cfg.capi);
    if (cfg.dryRun || !cfg.capi.pixelId || !cfg.capi.accessToken) {
      return c.json({ ok: true, dryRun: true, event });
    }
    const result = await sendToMeta([event], cfg.capi, fetchImpl);
    return c.json({ ok: result.ok, event_id: event.event_id, event_name: event.event_name, meta: result.body }, result.ok ? 200 : 502);
  });

  // Zapier: Circle "New Post" or "New Comment Posted" -> here -> answer (returned, or posted directly)
  app.post("/hooks/circle/question", async (c) => {
    const hook = (await c.req.json().catch(() => null)) as QuestionHook | null;
    if (!hook || !hook.post_id || (!hook.body && !hook.body_html)) {
      return c.json({ error: "post_id and body are required" }, 400);
    }
    if (isBotAuthor(hook.author_email, cfg.answer.botAuthorEmail) || hook.author_is_admin) {
      return c.json({ skipped: true, reason: "author is the bot or an admin" });
    }

    const reply = await composeReply(
      { title: hook.title, body: hook.body, bodyHtml: hook.body_html, authorName: hook.author_name, spaceName: hook.space_name, parentPostBody: hook.parent_post_body },
      kb,
      { model: cfg.answer.model, effort: cfg.answer.effort, dryRun: cfg.dryRun },
    );
    const answer = reply.answer;

    let posted: { id?: number } | null = null;
    if (hook.post_directly && cfg.circle && !cfg.dryRun) {
      posted = await createCircleComment(
        cfg.circle,
        {
          postId: Number(hook.post_id),
          body: answer,
          parentCommentId: hook.kind === "comment" && hook.comment_id ? Number(hook.comment_id) : undefined,
        },
        fetchImpl,
      );
    }

    return c.json({
      answer,
      escalate: reply.escalate,
      escalation_reason: reply.reason,
      sources: reply.sources,
      posted,
      dryRun: cfg.dryRun,
    });
  });

  return app;
}
