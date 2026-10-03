# Put Coach live on Railway

Live since 2026-09-28 at `https://ai-skool-production.up.railway.app` (health: `/healthz`).

Coach is the poller inside the service in `src/`. Once deployed it watches the Ask Coach space
through Circle's API and replies within about five minutes (within a minute once the webhook in
the last section is set up), to new questions and to every follow-up comment, keeping the thread
going until a team member steps in. No Zapier is involved. Railway's Hobby plan (a few dollars a
month) is plenty; Circle's API usage is the bill to watch, see the last section.

## 1. A Circle token that posts as Coach (10 minutes)

Comments created through the API are authored by whoever created the token, so the service needs
a token created by the Coach account, not by the owner.

1. Sign in to www.joinlearnai.com as the owner. Community name → Members → find **Coach** →
   open the member → change the role to **Admin**. Save.
2. Open a private window, go to www.joinlearnai.com, click Sign in → Forgot password, enter
   Coach's email (the `BOT_AUTHOR_EMAIL` value) and set a password from the email you receive.
3. Still signed in as Coach: community name → Settings → Developers → Tokens → Create token.
   Type **Admin API v2**, name `coach-service`. Copy the token; it goes into Railway in step 3
   below as `CIRCLE_ADMIN_TOKEN`. Do not paste it anywhere else.

Fallback: skip this and use the owner's token. Coach's replies then appear under the owner's
name.

## 2. An Anthropic API key (5 minutes)

1. console.anthropic.com → sign in → Billing → add a payment method and a small credit balance
   (twenty dollars covers a lot of answers).
2. API keys → Create key → name `learn-ai-coach` → copy it. It goes into Railway as
   `ANTHROPIC_API_KEY`.

## 3. Deploy on Railway (15 minutes)

1. railway.com → Login → continue with GitHub.
2. New project → Deploy from GitHub repo. If the repo is not listed, click the link to configure
   the GitHub app and grant access to `maddogmcquillan/ai-skool`. Select the repo. Railway finds
   the `Dockerfile` and starts a build; let it run.
3. Click the service card → **Variables** → add these, one per row (Raw editor takes them all at
   once):

   | Variable | Value |
   |---|---|
   | `HOOK_SECRET` | any long random string, 40+ characters, from a password generator |
   | `ANTHROPIC_API_KEY` | from step 2 |
   | `CIRCLE_ADMIN_TOKEN` | the Coach token from step 1 |
   | `BOT_AUTHOR_EMAIL` | Coach's email |
   | `TEAM_AUTHOR_EMAIL` | the Learn AI Team account's email |
   | `COACH_IGNORE_EMAILS` | the owner's email |
   | `PORT` | `8787` |

   Railway redeploys after the variables are saved.
4. **Settings** → Networking → Generate domain → port `8787`. Copy the URL Railway gives you,
   something like `learn-ai-production.up.railway.app`.
5. **Deployments** → open the latest → Logs. Two lines mean success:
   `learn-ai service listening on :8787 (dryRun=false, coach=polling every 300s, meta=off)` and
   `[coach] watching "Ask Coach" (space NNN)`.

## 4. Check it

1. Open `https://<your railway domain>/healthz`. Expect `"ok":true`, `"dryRun":false` and a
   `coach` object with `ticks` counting up. `dryRun:true` means the Anthropic key is missing or
   wrong; `coach:null` means the Circle token is missing.
2. In a private window, as the test member, post a question in Ask Coach, for example
   "How do I make my chatbot remember my name?". Within five minutes (the poll interval) Coach
   replies.
3. Reply to Coach's comment with a follow-up such as "What is a variable?". Coach answers again
   inside the same thread, building on its first answer.
4. Reply to that thread as yourself, the owner. Post another follow-up as the test member.
   Coach stays quiet, because a human has the thread now.
5. Post "Can I get a refund?" as the test member. Coach answers with the hand-off reply and the
   `escalated` counter on `/healthz` goes up. That thread is yours to answer.

## Day to day

- Coach's knowledge is the `knowledge/` folder. Edit it, push, and Railway redeploys.
- Railway → Deployments → Logs shows every reply and every skip with the reason.
- To pause Coach, set `COACH_POLL` to `0` in Variables. To stop it entirely, remove the service.
- Meta purchase tracking is the same service: add `META_PIXEL_ID` and `META_CAPI_ACCESS_TOKEN` to
  Variables when the Meta step is done, and `/healthz` gains a `meta` block. No Zapier. The
  founding paywall's names are built in; `META_PAYWALL_KEYS` is only for a second paywall.

## Circle API usage and cost

Circle's Business plan includes 5,000 Admin API calls a month and bills $0.005 for every call
above that (Settings → Developers shows the running count; the cycle resets on the plan's billing
day). Every poll the service makes is one call, so the intervals decide the bill:

| Setting | Calls a month | Overage at $0.005 |
|---|---|---|
| Coach every 60 s, Meta every 60 s (the defaults until 2026-10-03) | ~86,000 | ~$400 |
| Coach every 300 s, Meta every 3600 s, founding count cached 60 min (defaults now) | ~10,000 | ~$25 |
| Coach every 1800 s, Meta every 3600 s, with the nudge webhook below | ~2,500 | $0 |

Comments are fetched only for threads whose comment count changed, and the founding count only
when a landing page asks for it after its cache expires, so those add little. `GET /healthz`
shows `circle.total` (calls since the last deploy), `circle.perMonth` (that rate over 30 days)
and `circle.byPath`. The variables are `COACH_POLL_SECONDS`, `META_POLL_SECONDS` and
`FOUNDING_TTL_MINUTES`; the pollers never go below 15 seconds whatever the value.

### Wake the pollers from Circle instead of polling fast

A Circle workflow can call a webhook when something happens in the community. Pointed at the
service's nudge route it runs the poller at once, so the interval becomes a safety net:

1. Circle admin → Workflows → new automation. Trigger: a new post published in the **Ask Coach**
   space. Action: send to a webhook, URL
   `https://<railway domain>/hooks/circle/nudge/coach?secret=<HOOK_SECRET>`. Use the Railway
   domain, not joinlearnai.com, so Cloudflare cannot challenge the call. If the action can set
   headers, send `X-Hook-Secret` instead and drop `?secret=`. Repeat with the trigger for a new
   comment, if Circle offers one.
2. A second workflow for purchases: trigger on a successful paywall payment, URL
   `.../hooks/circle/nudge/meta?secret=<HOOK_SECRET>`.
3. Test: post a question as the test member. Coach answers within a minute instead of five, and
   Railway → Deployments → Logs shows the tick.
4. Then set `COACH_POLL_SECONDS=1800` in Railway Variables. If Circle has no comment trigger,
   keep Coach at 300 so follow-ups are still answered within five minutes.

Brief 11 in `docs/COWORK-BRIEFS.md` is this list written for Claude in Chrome.
