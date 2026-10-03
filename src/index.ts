import { serve } from "@hono/node-server";
import { CoachLoop } from "./bot/coachLoop.js";
import { KnowledgeBase } from "./bot/knowledge.js";
import { ChargeLoop, parsePaywallKeys } from "./chargeLoop.js";
import { circleCallStats } from "./circle.js";
import { FoundingCounter } from "./founding.js";
import { configFromEnv, createApp } from "./server.js";
import { StatsCounter } from "./stats.js";

const cfg = configFromEnv();
if (!cfg.hookSecret) {
  console.error("HOOK_SECRET is required. Copy .env.example to .env and set it.");
  process.exit(1);
}

let kb = await KnowledgeBase.fromDir(cfg.knowledgeDir);

// Coach polls the Ask Coach space itself whenever a Circle token is present (no Zapier needed).
// Set COACH_POLL=0 to turn the poller off and use the /hooks/circle/question webhook instead.
//
// Every poll is one Circle Admin API call, and Circle bills calls above the plan's 5,000 a month
// ($0.005 each on Business). At 60 seconds each poller alone made ~43,000 calls a month, so the
// defaults below are minutes and hours. A Circle workflow webhook on POST /hooks/circle/nudge
// wakes a poller the moment something happens; the interval is then only a safety net. The
// arithmetic is in docs/DEPLOY-RAILWAY.md under "Circle API usage".
const env = process.env;
/** Seconds from the environment, never below 15 and never NaN (a typo must not mean "every 1 ms"). */
const seconds = (raw: string | undefined, fallback: number) => Math.max(15, Number(raw) || fallback) * 1000;
const coachEveryMs = seconds(env.COACH_POLL_SECONDS, 300);
const metaEveryMs = seconds(env.META_POLL_SECONDS, 3600);
const coach =
  cfg.circle && env.COACH_POLL !== "0"
    ? new CoachLoop(
        {
          circle: cfg.circle,
          spaceSlug: env.COACH_SPACE_SLUG || "ask-coach",
          botAuthorEmail: cfg.answer.botAuthorEmail,
          ignoreAuthorEmails: [...(env.COACH_IGNORE_EMAILS ?? "").split(","), env.TEAM_AUTHOR_EMAIL ?? ""],
          intervalMs: coachEveryMs,
          lookbackDays: Number(env.COACH_LOOKBACK_DAYS ?? 14),
          reply: { model: cfg.answer.model, effort: cfg.answer.effort, dryRun: cfg.dryRun },
        },
        { kb: () => kb },
      )
    : undefined;

// Purchases go to Meta the same way, once the pixel id and Conversions API token are set.
// Set META_POLL=0 to turn it off and use the /hooks/circle/charge webhook from Zapier instead.
const meta =
  cfg.circle && cfg.capi.pixelId && cfg.capi.accessToken && env.META_POLL !== "0"
    ? new ChargeLoop({
        circle: cfg.circle,
        capi: cfg.capi,
        intervalMs: metaEveryMs,
        lookbackMs: Number(env.META_LOOKBACK_HOURS ?? 24) * 3_600_000,
        paywallKeys: parsePaywallKeys(env.META_PAYWALL_KEYS),
        dryRun: env.DRY_RUN === "1",
      })
    : undefined;

// The "spots taken" bar on the landing pages: distinct paying families, capped at FOUNDING_CAP.
// The count is cached for FOUNDING_TTL_MINUTES, so page views cost at most one call per page of
// charges in that window.
const founding = cfg.circle
  ? new FoundingCounter({
      circle: cfg.circle,
      cap: Number(env.FOUNDING_CAP ?? 200),
      ttlMs: Math.max(1, Number(env.FOUNDING_TTL_MINUTES) || 60) * 60_000,
      paywallName: env.FOUNDING_PAYWALL_NAME ?? "Founding Member",
    })
  : undefined;

const app = await createApp(cfg, {
  kb,
  onKnowledgeReload: (next) => {
    kb = next;
  },
  coachStatus: () => coach?.status(),
  metaStatus: () => meta?.status(),
  circleStats: cfg.circle ? () => circleCallStats() : undefined,
  nudge: (what) => {
    const loop = what === "coach" ? coach : meta;
    loop?.nudge();
    return Boolean(loop);
  },
  foundingSpots: founding ? () => founding.spots() : undefined,
  // Landing page funnel counters (GET /api/stats). In memory: they restart with each deploy.
  stats: new StatsCounter(),
});

const port = Number(env.PORT ?? 8787);
serve({ fetch: app.fetch, port }, () => {
  const coachMode = coach ? `polling every ${coachEveryMs / 1000}s` : "off";
  const metaMode = meta ? `polling every ${metaEveryMs / 1000}s` : "off";
  console.log(`learn-ai service listening on :${port} (dryRun=${cfg.dryRun}, coach=${coachMode}, meta=${metaMode})`);
  coach?.start();
  meta?.start();
});
