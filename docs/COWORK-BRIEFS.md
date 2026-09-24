# Cowork briefs: the clicking Claude can do in your browser

Circle's API stops at a handful of visual settings, and Stripe, Meta and Zapier have no API path
that suits a one-time setup. Those steps are done in a browser that is signed in as you. The
Claude desktop app's Cowork mode with browser access can do that clicking while you watch,
because it drives your own browser and your own logins. Nothing is pasted into a chat.

How to use these: open the Claude desktop app, start a Cowork session with browser access, make
sure you are signed in to the site in Chrome, download the named files first, and paste the brief.
Do one brief per session. Watch the first two or three actions, then let it run.

---

## Brief 1: Circle visuals (files: learn-ai-manual-uploads.zip, learn-ai-lesson-thumbnails.zip)

You are finishing the visual setup of my Circle community at learn-ai-46fe2f.circle.so. I am
signed in as the owner. The files are unzipped in ~/Downloads/learn-ai-manual-uploads and
~/Downloads/learn-ai-lesson-thumbnails. Work through these in order and tell me when each block
is done. If a control is not where I describe, look for it under the space's Customize menu or
the Settings page; do not guess at destructive actions.

1. Settings → Theme. Upload logo-light.png as the light-mode logo, logo-dark.png as the dark-mode
   logo, and community-icon.png as the community icon. Set the default theme to light. Save.
2. For each of these spaces, open it, click the dropdown beside its name, choose Customize, click
   the icon, choose the Custom tab, upload the file, save:
   Welcome and Announcements → icon-welcome.png; Ask Coach → icon-ask-coach.png; Course Requests →
   icon-course-requests.png; Parent Hub → icon-parent-hub.png; Classroom → icon-classroom.png;
   Show and Tell → icon-show-and-tell.png; Live Sessions → icon-live-sessions.png.
3. Open the Classroom. For each class in order, open its lesson settings, find Thumbnail, click
   Upload thumbnail, and upload the file whose number matches the class position:
   lesson-01-*.png for the first class through lesson-17-*.png for the seventeenth. Save each.
4. Open Home and its customize panel. Set the welcome banner to welcome-banner.png. Pin the "Start
   here" post. Feature the Classroom, Ask Coach, and Show and Tell spaces in that order. Save.
5. Courses → directory settings: banner course-directory-banner.png. Save.
6. Settings → SEO or Social sharing: upload og-image.png as the preview image. Save.
7. In the left sidebar, drag spaces so the order reads: Welcome and Announcements, Ask Coach,
   Course Requests, Parent Hub, then Classroom, then Show and Tell, Live Sessions.
8. Take a screenshot of Home and of the Classroom and show me.

## Brief 2: Stripe and the paywall (runbook section 3)

You are setting up payments in my Circle community at learn-ai-46fe2f.circle.so. I am signed in.
1. Payments → Settings → connect Stripe. When Stripe opens, stop and hand control to me for the
   login and identity steps, then continue once I say so.
2. Payments → Paywalls → New paywall. Internal name exactly: founding-member. Display name:
   Founding Member. Price: $50 per month, recurring, no trial. Access: the Classroom space group
   plus Start Here and Community. Checkout page: on. Save, then copy the checkout URL and show me.
3. Payments → Coupons → New coupon. Code TEST100, 100% off, applies to founding-member. Save.
4. Do not touch the paywall's Tracking tab yet; I will give you the snippet separately.

## Brief 3: Affiliates (runbook section 9)

Settings → Payments → Affiliates settings. Reward type: Fixed amount. Amount: [BOUNTY]. Turn on
"Limit number of recurring commissions" and set it to 1. Pending commission length: 30 days.
Payout method: [PayPal or Wise]. Promotional link: on, URL [LANDING PAGE URL]; copy the tracking
script it shows and paste it back to me. Paywalls: enable only founding-member. Save.
Then Payments → Affiliates → Invite affiliate, and invite these emails one by one: [LIST].

## Brief 4: Meta assets

You are working inside my existing Meta Business Portfolio. Create a new Facebook Page named
Learn AI (category Education). Create a new Dataset in Events Manager named Learn AI Web; open its
Settings and generate a Conversions API access token; do not paste the token into chat, instead
tell me it is on screen and I will copy it. Under Business settings → Brand safety → Domains, add
[ROOT DOMAIN] and show me the DNS TXT verification record. Stop before creating any ad campaigns.

## Brief 5: Zapier zaps (runbook section 8)

Two zaps, exact field mappings are in docs/SETUP-RUNBOOK.md section 8. Connect the Circle app with
the Zapier token I created in Circle (Developers → Tokens, type Zapier). Build Zap 1 (New Member
Paid Charge → Webhooks by Zapier POST to [SERVICE URL]/hooks/circle/charge with header
X-Hook-Secret) and Zap 2 (New Post in Ask Coach → Webhooks Custom Request to
[SERVICE URL]/hooks/circle/question → Circle Create Comment as [COACH EMAIL]). Turn both on and
run a test of each, showing me the results.
