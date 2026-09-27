import { serve } from "@hono/node-server";
import { CoachLoop } from "./bot/coachLoop.js";
import { KnowledgeBase } from "./bot/knowledge.js";
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

const app = await createApp(cfg, {
  kb,
  onKnowledgeReload: (next) => {
    kb = next;
  },
  coachStatus: () => coach?.status(),
});

const port = Number(env.PORT ?? 8787);
serve({ fetch: app.fetch, port }, () => {
  console.log(`learn-ai service listening on :${port} (dryRun=${cfg.dryRun}, coach=${coach ? "polling" : "off"})`);
  coach?.start();
});
