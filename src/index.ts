import { serve } from "@hono/node-server";
import { configFromEnv, createApp } from "./server.js";

const cfg = configFromEnv();
if (!cfg.hookSecret) {
  console.error("HOOK_SECRET is required. Copy .env.example to .env and set it.");
  process.exit(1);
}
const app = await createApp(cfg);
const port = Number(process.env.PORT ?? 8787);
serve({ fetch: app.fetch, port }, () => {
  console.log(`ai-skool service listening on :${port} (dryRun=${cfg.dryRun})`);
});
