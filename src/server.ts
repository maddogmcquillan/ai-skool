import { Hono } from "hono";
import { buildMetaEvent, sendToMeta, type CapiConfig, type ChargeHook } from "./capi.js";
import type { CoachLoopStatus } from "./bot/coachLoop.js";
import type { ChargeLoopStatus } from "./chargeLoop.js";
import type { FoundingSpots } from "./founding.js";
import type { StatsCounter } from "./stats.js";
import { KnowledgeBase } from "./bot/knowledge.js";
import { isBotAuthor } from "./bot/policy.js";
import { composeReply } from "./bot/respond.js";
import { createCircleComment, type CircleCallStats } from "./circle.js";
import { mountSite } from "./site.js";

/** Which poller a Circle workflow webhook wakes through POST /hooks/circle/nudge. */
export type NudgeTarget = "coach" | "meta";

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
  /** Reported on /healthz when the purchase-to-Meta poller is running. */
  metaStatus?: () => ChargeLoopStatus | undefined;
  /** Reported on /healthz when a Circle token is configured: Admin API calls made so far. */
  circleStats?: () => CircleCallStats;
  /** Wakes a poller for POST /hooks/circle/nudge; returns false when that poller is off. */
  nudge?: (what: NudgeTarget) => boolean;
  /** Serves /api/founding-spots for the landing pages' "spots taken" bar. Absent means 404. */
  foundingSpots?: () => Promise<FoundingSpots>;
  /** First-party funnel counters behind POST /api/track and GET /api/stats. Absent means 404. */
  stats?: StatsCounter;
  /** Where the landing page and brand images live; defaults suit the repo layout. */
  siteDir?: string;
  assetsDir?: string;
}

export async function createApp(cfg: ServerConfig, deps: AppDeps = {}) {
  const fetchImpl = deps.fetchImpl ?? fetch;
  let kb = deps.kb ?? (await KnowledgeBase.fromDir(cfg.knowledgeDir));
  const app = new Hono();

  app.get("/healthz", (c) =>
    c.json({
      ok: true,
      dryRun: cfg.dryRun,
      knowledgeChunks: kb.chunks.length,
      coach: deps.coachStatus?.() ?? null,
      meta: deps.metaStatus?.() ?? null,
      circle: deps.circleStats?.() ?? null,
    }),
  );

  // Hooks carry the shared secret in the X-Hook-Secret header. The nudge route, which carries no
  // data, also takes it as ?secret= because a Circle workflow webhook may not set custom headers.
  app.use("/hooks/*", async (c, next) => {
    const header = c.req.header("x-hook-secret");
    const query = c.req.path.startsWith("/hooks/circle/nudge") ? c.req.query("secret") : undefined;
    const provided = header ?? query;
    if (!cfg.hookSecret || !provided || provided !== cfg.hookSecret) {
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

  // Circle workflow "send to webhook" (any payload, ignored): run the poller now instead of at the
  // next interval. /nudge wakes both pollers, /nudge/coach or /nudge/meta one of them. A nudge
  // costs the same Circle calls as one poll, so with webhooks the poll intervals can be long.
  app.post("/hooks/circle/nudge/:what?", (c) => {
    const what = c.req.param("what");
    const targets: NudgeTarget[] = what === undefined ? ["coach", "meta"] : what === "coach" || what === "meta" ? [what] : [];
    if (!targets.length) return c.json({ error: "unknown target: use /nudge, /nudge/coach or /nudge/meta" }, 404);
    const nudged = targets.filter((t) => deps.nudge?.(t) ?? false);
    return c.json({ ok: true, nudged }, 202);
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

  // Public, read-only: how many founding spots are taken, for the landing pages' fill bar.
  app.get("/api/founding-spots", async (c) => {
    if (!deps.foundingSpots) return c.json({ error: "not configured" }, 404);
    try {
      const spots = await deps.foundingSpots();
      return c.json(spots, 200, { "cache-control": "public, max-age=300" });
    } catch (err) {
      return c.json({ error: (err as Error).message }, 502);
    }
  });

  // Landing page beacons: {e: event, p: page slug}. Aggregate counts only, nothing personal.
  app.post("/api/track", async (c) => {
    if (!deps.stats) return c.body(null, 404);
    const raw = await c.req.text().catch(() => "");
    if (raw.length > 200) return c.body(null, 413);
    let body: { e?: unknown; p?: unknown } = {};
    try {
      body = JSON.parse(raw) as { e?: unknown; p?: unknown };
    } catch {
      return c.body(null, 400);
    }
    return c.body(null, deps.stats.record(body.e, body.p) ? 204 : 400);
  });
  app.get("/api/stats", (c) => {
    if (!deps.stats) return c.json({ error: "not configured" }, 404);
    return c.json(deps.stats.snapshot(), 200, { "cache-control": "no-store" });
  });

  // Last, so the site's slug route can never shadow /healthz or the API routes above.
  mountSite(app, { siteDir: deps.siteDir, assetsDir: deps.assetsDir });

  return app;
}
