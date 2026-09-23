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
| `scripts/provision.ts` | Creates the community structure via Circle's Admin API (Business plan) |
| `knowledge/` | Markdown the answer bot reads: FAQ and lesson transcripts |

## The service

Two webhook routes, called by Zapier:

- `POST /hooks/circle/charge`: Circle "New Member Paid Charge" in, Meta Conversions API
  Purchase event out. Email and names are hashed. The `event_id` is derived the same way as
  in the browser snippet, so Meta counts each sale once.
- `POST /hooks/circle/question`: a new post or comment in the Ask Coach space in, a Claude
  answer out, grounded in `knowledge/`. Billing, account, safety and personal-info questions
  are escalated to a human instead of answered. With a Circle Admin API token it can post the
  reply itself; otherwise Zapier's Create Comment step posts it.

Both routes require the `X-Hook-Secret` header.

```bash
cp .env.example .env      # fill in
npm install
npm test                  # unit tests, no network
npm run dev               # http://localhost:8787/healthz
```

Without `ANTHROPIC_API_KEY` the service runs in dry-run mode: it validates payloads, retrieves
knowledge and builds Meta events, but calls neither Claude nor Meta. Useful while building Zaps.

## Deploy

`Dockerfile` builds a production image. Set the variables from `.env.example` on the host and
expose port 8787. Any Node 22 host works.
