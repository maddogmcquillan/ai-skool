# Circle setup runbook

Follow top to bottom. Each step says where the setting lives in Circle and what to set.
Estimated time for everything: one working day, spread over a few sessions while trials and
DNS propagate.

## 1. Create the community

1. Sign up at circle.so, pick **Business** (14-day trial, $219/mo after, 1% transaction fee).
   Business adds the Admin API used by the provisioning script and by the bot to post replies.
2. Name: your chosen name. Default URL: `<name>.circle.so` for now.
3. Settings > General: set the community description, logo, and brand color. Theme: light.

## 2. Custom domain (do this early, DNS takes time)

Settings > Site > Domain. Use a **subdomain of the landing page's root domain**, e.g.
`www.joinlearnai.com`. Add the CNAME Circle shows you. Why it matters: Meta's pixel cookies are
set on the root domain, so a click on your landing page and a purchase on Circle share cookies
and Meta can attribute the sale.

## 3. Payments

1. Payments > Settings: connect Stripe.
2. Payments > Paywalls > New paywall:
   - Internal name: `founding-member` (write this down exactly; the tracking snippets use it)
   - Display name: `Founding Member`
   - Price: $50 / month, recurring. No trial (see NEEDED-FROM-YOU decision A4).
   - Access: grant access to every space group except admin-only ones.
   - Checkout page: enabled. Copy the checkout URL; it goes on the landing page buy button.
3. Paywall > **Tracking** tab: paste `circle/paywall-thank-you-tracking.html` with your Pixel ID
   filled in. Keep the `<script>` tags.
4. Payments > Coupons: create a 100% coupon named `TEST100` for test purchases. Delete it before
   launch.

## 4. Structure, safety settings, pinned posts (automated)

With `CIRCLE_ADMIN_TOKEN` in the environment, `npm run provision` creates everything in
`circle/structure.yaml`: space groups, spaces, course modules and draft lessons, the pinned
welcome and how-to posts, member tags, the parent consent profile fields, the messaging
lockdown from step 5, and the Coach member (when `BOT_AUTHOR_EMAIL` is set). Run
`npm run provision:dry` first to see the plan. Re-running is safe.

If you would rather click, the spaces are listed below. Key settings per space:

| Space | Type | Members can post | Notes |
|---|---|---|---|
| Welcome and Announcements | Post | No | Pin a "Start here" post |
| Ask Coach | Post | Yes | The bot watches this space |
| Course Requests | Post | Yes | Pin a post explaining "one idea per post, like to vote" |
| Parent Hub | Post | Yes | Consider access-gating to a "parent" tag |
| Each course | Course | n/a | Sections and lessons per the yaml; upload videos to lessons |
| Show and Tell | Post | Yes | Image-forward layout |
| Live Sessions | Event | n/a | |



## 5. Safety settings for a community with minors

Items 1 and 3 are applied by `npm run provision`; verify them and do the rest by hand.

1. Settings > Connect > Messaging: **Enable messaging ON**, **Enable member-to-member messaging
   OFF**, **Enable group messaging OFF**. Admins can still DM members.
2. Settings > Moderation: turn on flagged-content review, add a blocked-words list, and require
   admin approval for new member posts in Show and Tell for the first month.
3. Settings > Members > Profile fields: add a required field `Parent or guardian email` and a
   required checkbox `I am a parent/guardian and I consent to my child using this community`.
   Show both on the onboarding form.
4. Settings > Onboarding: default space access = Start Here group + the courses in the paywall.
5. Member profiles: hide location and social link fields (Settings > Members > Profile fields).

## 6. Meta pixel

1. Site > Code snippets > **JavaScript code snippets**: paste `circle/meta-pixel-javascript-snippet.js`
   with your Pixel ID. Do not add `<script>` tags in this field.
2. Paywall Tracking tab: done in step 3.
3. Landing page: follow `circle/landing-page-snippets.md`.
4. Verify: Meta Events Manager > Test events. Load a community page (PageView), then run a
   test checkout with the `TEST100` coupon and confirm a Purchase (or StartTrial) event arrives
   with a value and an event_id.

## 7. Deploy the service

1. Copy `.env.example` to `.env` and fill it in. Generate `HOOK_SECRET` with
   `openssl rand -hex 32`.
2. Deploy with the Dockerfile (Railway, Render, Fly) or `npm run build && npm start` on any Node 22
   host. Note the public URL.
3. Check `GET https://<service>/healthz` returns `{"ok":true,"dryRun":false,...}`. If `dryRun`
   is true, the Anthropic key is missing.

## 8. Zapier

Create a Zapier token in Circle (Developers > Tokens > Create token > Type: Zapier) and connect
the Circle app in Zapier with it.

### Zap 1: purchases to Meta Conversions API

1. Trigger: **Circle > New Member Paid Charge**.
2. Action: **Webhooks by Zapier > POST**
   - URL: `https://<service>/hooks/circle/charge`
   - Payload type: JSON
   - Headers: `X-Hook-Secret: <HOOK_SECRET>`
   - Data fields (map from the trigger):
     - `email` = member email
     - `first_name`, `last_name` = member name fields
     - `amount` = amount paid
     - `currency` = currency
     - `paywall_key` = paywall **internal name** (must equal what the thank-you snippet sees)
     - `charge_id` = charge id
     - `paid_at` = charge created time
3. Test with the `TEST100` coupon purchase. The response echoes `event_id`; find the same id in
   Meta Test events with two sources (Browser and Server) deduplicated into one.

### Zap 2: questions to the answer bot

1. Trigger: **Circle > New Post**, Space = Ask Coach.
2. Filter (optional): author email is not the bot's account.
3. Action: **Webhooks by Zapier > Custom Request**
   - Method POST, URL `https://<service>/hooks/circle/question`
   - Headers: `Content-Type: application/json`, `X-Hook-Secret: <HOOK_SECRET>`
   - Data (JSON):
     ```json
     {"kind":"post","post_id":"<post id>","title":"<post name>","body_html":"<post body>",
      "author_name":"<author name>","author_email":"<author email>","space_name":"Ask Coach","post_url":"<post url>"}
     ```
4. Posting the reply. Add a **Circle > Create Comment** action: Space = Ask Coach, Post = post id
   from the trigger, Body = `answer` from the webhook response, Member email = the Coach account
   (`BOT_AUTHOR_EMAIL`). This is what makes the reply appear as Coach.
   Alternative: with `CIRCLE_ADMIN_TOKEN` on the service, add `"post_directly": true` to the JSON
   and the service posts the comment itself, but Circle's API has no author field, so the reply
   appears as whichever admin created the token. To use that path and still post as Coach, make
   the Coach member an admin and create the token while signed in as Coach.
5. Action (optional): **Slack or Email** when the webhook response has `escalate = true`, so a
   human sees billing and safety threads immediately.

### Zap 3: follow-up comments (optional)

Same as Zap 2 with trigger **New Comment Posted** in Ask Coach, `kind = "comment"`, and
`parent_post_body` mapped to the original post body. The service already ignores comments
written by the bot account and by admins.

## 9. Affiliate program

Settings > Payments > Affiliates settings:

1. Reward type: **Fixed amount**. Commission: your bounty (decision A2).
2. **Limit number of recurring commissions: ON, value 1.** This is what makes it a first-sale
   bounty instead of a recurring split.
3. Pending commission length: 30 days (covers refunds).
4. Payout method: PayPal or Wise.
5. Promotional link: ON. URL = your landing page. Copy the tracking script into the landing page
   `<head>` (see `circle/landing-page-snippets.md`).
6. Paywalls: enable only `founding-member`.
7. Payments > Affiliates > Invite affiliate: enter each marketer's email. They get a member
   account (default space access only) plus an Affiliate dashboard with their links.
8. Monthly: Payments > Affiliates > Start payout > Export CSV > pay via PayPal Payouts or Wise
   Batch > Mark paid.

## 10. Content

1. Upload lesson videos to each lesson. Turn on automated transcription in Community AI settings
   if available on your plan; otherwise export transcripts from your video tool.
2. Put every transcript into `knowledge/` as Markdown (see `knowledge/README.md`) and redeploy or
   call `/admin/reload-knowledge`.
3. Update `knowledge/00-community-faq.md` with real answers.

## 11. Launch checks

- [ ] Test purchase shows in Stripe, Circle, and Meta (one deduplicated Purchase with value).
- [ ] Affiliate test: open an affiliate's link in a private window, buy with `TEST100`, confirm the
      sale appears under that affiliate in Payments > Affiliates.
- [ ] Post a question in Ask Coach from a test member; the bot replies within a few minutes.
- [ ] Post "can I get a refund" from a test member; the bot escalates and a human is notified.
- [ ] A test member cannot DM another test member.
- [ ] Delete `TEST100`, remove test members, clear test events in Meta.
