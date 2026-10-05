# AI Skool on Circle

Tooling and runbook for launching the AI Skool membership on [Circle](https://circle.so).

Circle was chosen over Skool because it gives value-bearing purchase tracking for Meta ads, a
first-sale affiliate bounty, a supported way to run an AI answer bot, and admin control over
member-to-member messaging for a community with minors. This repo holds everything that lives
outside Circle's click-through settings.

## What is in here

| Path | Purpose |
|---|---|
| `docs/NEEDED-FROM-YOU.md` | Decisions, accounts and secrets only you can supply |
| `docs/SETUP-RUNBOOK.md` | Step-by-step Circle, Meta, Zapier and affiliate configuration |
| `circle/structure.yaml` | Space groups, spaces and courses to create |
| `circle/meta-pixel-javascript-snippet.js` | Site-wide Meta pixel for Circle's code snippets field |
| `circle/paywall-thank-you-tracking.html` | Purchase event with value and a deduplication id, for the paywall Tracking tab |
| `circle/landing-page-snippets.md` | Pixel and affiliate tracking for the pre-sale landing page |
| `src/` | Node service: Meta Conversions API bridge and AI answer bot |
| `scripts/provision.ts` | Builds the community via Circle's Admin API: structure, courses, pinned posts, tags, consent fields, messaging lockdown, bot member |
| `knowledge/` | Markdown the answer bot reads: FAQ and lesson transcripts |

## The service

**Coach** runs inside the service with no Zapier in the loop: every minute it lists the newest
posts in the Get Unstuck space (slug ask-coach) through Circle's Admin API and, wherever the last word in a thread
belongs to a member, posts Coach's reply as a comment. That covers the first question on a post
and every follow-up under it; the model sees the whole thread and continues the conversation.
Coach stays quiet when a team member replied last, and after it has handed a thread to a human
(billing, account, safety and personal-info questions get the hand-off reply). Comments are only
fetched when a post's comment count changes, so a quiet community costs one request per poll
(every five minutes by default).
The comment is authored by whoever created the API token, so create the service's token while
signed in as the Coach account (see `docs/DEPLOY-RAILWAY.md`).

**Purchases to Meta** work the same way: with `META_PIXEL_ID` and `META_CAPI_ACCESS_TOKEN` set,
the service polls Circle's paid charges (hourly by default) and sends each new one to the Meta
Conversions API as a Purchase. Email and names are hashed, and the `event_id` is derived the same
way as in the paywall thank-you snippet, so Meta counts each sale once even though it hears about
it twice.

Two webhook routes remain for anyone who prefers Zapier (`COACH_POLL=0` / `META_POLL=0`):
`POST /hooks/circle/charge` and `POST /hooks/circle/question`, both behind the `X-Hook-Secret`
header. A third, `POST /hooks/circle/nudge` (or `/nudge/coach`, `/nudge/meta`), takes any payload
and simply runs the poller now: point a Circle workflow webhook at it and the pollers wake within
seconds, so their intervals can be long. That matters because Circle bills Admin API calls above
5,000 a month and every poll is one call. `GET /healthz` reports both pollers' counters and the
calls made since the last deploy (`circle.total`, projected `circle.perMonth`); the arithmetic is
in `docs/DEPLOY-RAILWAY.md`.

```bash
cp .env.example .env      # fill in
npm install
npm test                  # unit tests, no network
npm run dev               # http://localhost:8787/healthz
```

Without `ANTHROPIC_API_KEY` the service runs in dry-run mode: it validates payloads, retrieves
knowledge and builds Meta events, but calls neither Claude nor Meta. Useful while building Zaps.

## The website

`site/` holds the parent-facing landing page and its parents, terms and privacy pages; the
service serves them at `/`, `/parents`, `/terms` and `/privacy`, with brand images under
`/assets/`. Any other `site/<slug>.html` is served at `/<slug>`, one page per ad group
(`site/ai-for-kids.html` at `/ai-for-kids`). `docs/ADS.md` holds the Meta campaign structure, ad copy and creative briefs.

## Deploy

`docs/DEPLOY-RAILWAY.md` is the click-by-click guide. `Dockerfile` builds a production image;
set the variables from `.env.example` on the host and expose the port. Any Node 22 host works.
