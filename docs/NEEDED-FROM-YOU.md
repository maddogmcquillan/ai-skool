# What I need from you

Everything in this repo is built and tested. These are the pieces only you can do, in the order
they unblock the next step. Items marked **(secret)** go into the deployed service's environment
variables or into Circle/Zapier directly. Never paste them into chat.

## A. Decisions (5 minutes, reply in chat)

1. **Community name and URL.** Working name is "AI Skool". Confirm or change. Pick the subdomain
   for Circle, for example `learn.yourdomain.com`, and tell me which root domain the landing page
   will live on.
2. **Affiliate bounty amount.** A fixed dollar amount paid once on the first successful payment.
   Suggested: $25 to $40 on a $50 first month. Tell me the number.
3. **Pre-sale mechanics.** Either (a) one paywall at $50/month labeled "Founding Member" that you
   later raise, or (b) a full-price paywall plus a coupon. (a) is simpler and keeps the affiliate
   math clean. Confirm (a) unless you have a reason not to.
4. **Free trial or no trial.** No trial is my recommendation for launch: cleaner Purchase events,
   affiliates get paid on day one, and fewer freebie sign-ups. Confirm.
5. **Bot name.** Default is "Coach". Change it if you like.

## B. Accounts you create (30 to 60 minutes)

1. **Circle account.** Sign up at circle.so, choose the **Professional** plan (14-day trial), name
   the community, and add me as an admin later if you want me to configure it directly. Do not
   pick Business unless you want the API-driven provisioning; the runbook covers both.
2. **Stripe.** Connect your Stripe account under Circle > Payments. You may already have one from
   the e-commerce business; a separate Stripe account for this brand is cleaner for bookkeeping.
3. **Zapier.** A paid plan (Starter or above) because the Zaps use Webhooks by Zapier and multi-step
   Zaps. In Circle, create a **Zapier** token under Developers > Tokens.
4. **Meta.** In Events Manager, create or pick the Pixel/Dataset for this brand. Generate a
   **Conversions API access token** from the pixel's settings. **(secret)**
5. **Anthropic.** Create an API key at console.anthropic.com for the answer bot. **(secret)**
6. **PayPal Business or Wise Business** for paying affiliates. Circle exports a CSV; it does not
   move the money.
7. **Hosting for the service.** Any Node 22 host works: Railway, Render, Fly.io. A Dockerfile is
   included. You need the public URL for the Zaps.

## C. Content and assets (can trickle in)

1. Logo, brand colors, cover images for each space.
2. The real course list. Replace the placeholder titles in `circle/structure.yaml`.
3. Lesson transcripts or notes as Markdown in `knowledge/`. The bot is only as good as this folder.
4. Terms of service, privacy policy, and the parent/guardian consent wording. Talk to a lawyer
   about under-13 users; the platform terms require 13+ with parental consent.

## D. Hand me these to finish the wiring

- Circle community URL and the paywall checkout URL.
- The paywall's **internal name** exactly as typed in Circle. It is the key both purchase
  events hash on; if it differs between the browser snippet and the Zap, Meta double counts.
- Meta Pixel ID (not secret) and, in the service env only, the CAPI token.
- The deployed service URL and its `HOOK_SECRET`.
- Whether you want me to build the Zaps with you on a call, or you follow the runbook.
