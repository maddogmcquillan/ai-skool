import { serve } from "@hono/node-server";
import { CoachLoop } from "./bot/coachLoop.js";
import { KnowledgeBase } from "./bot/knowledge.js";
import { ChargeLoop, parsePaywallKeys } from "./chargeLoop.js";
import { FoundingCounter } from "./founding.js";
import { configFromEnv, createApp } from "./server.js";

const cfg = configFromEnv();
if (!cfg.hookSecret) {
  console.error("HOOK_SECRET is required. Copy .env.example to .env and set it.");
  process.exit(1);
}

let kb = await KnowledgeBase.fromDir(cfg.knowledgeDir);

// Coach polls the Ask Coach space itself whenever a Circle token is present (no Zapier needed).
// Set COACH_POLL=0 to turn the poller off and use the /hooks/circle/question webhook instead.
const env = process.env;
const coach =
  cfg.circle && env.COACH_POLL !== "0"
    ? new CoachLoop(
        {
          circle: cfg.circle,
          spaceSlug: env.COACH_SPACE_SLUG || "ask-coach",
          botAuthorEmail: cfg.answer.botAuthorEmail,
          ignoreAuthorEmails: [...(env.COACH_IGNORE_EMAILS ?? "").split(","), env.TEAM_AUTHOR_EMAIL ?? ""],
          intervalMs: Math.max(15, Number(env.COACH_POLL_SECONDS ?? 60)) * 1000,
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
        intervalMs: Math.max(15, Number(env.META_POLL_SECONDS ?? 60)) * 1000,
        lookbackMs: Number(env.META_LOOKBACK_HOURS ?? 24) * 3_600_000,
        paywallKeys: parsePaywallKeys(env.META_PAYWALL_KEYS),
        dryRun: env.DRY_RUN === "1",
      })
    : undefined;

// The "spots taken" bar on the landing pages: distinct paying families, capped at FOUNDING_CAP.
const founding = cfg.circle
  ? new FoundingCounter({ circle: cfg.circle, cap: Number(env.FOUNDING_CAP ?? 200), ttlMs: 5 * 60_000, paywallName: env.FOUNDING_PAYWALL_NAME ?? "Founding Member" })
  : undefined;

const app = await createApp(cfg, {
  kb,
  onKnowledgeReload: (next) => {
    kb = next;
  },
  coachStatus: () => coach?.status(),
  metaStatus: () => meta?.status(),
  foundingSpots: founding ? () => founding.spots() : undefined,
});

const port = Number(env.PORT ?? 8787);
serve({ fetch: app.fetch, port }, () => {
  console.log(`learn-ai service listening on :${port} (dryRun=${cfg.dryRun}, coach=${coach ? "polling" : "off"}, meta=${meta ? "polling" : "off"})`);
  coach?.start();
  meta?.start();
});
