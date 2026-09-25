# Cowork briefs: the clicking Claude can do in your browser

Circle's API stops at a handful of visual settings, and Stripe, Meta and Zapier have no API path
that suits a one-time setup. Those steps are done in a browser that is signed in as you. Claude can
do that clicking only through the **Claude in Chrome** extension, which works inside your own
signed-in Chrome. A plain chat, a Claude Code session, or a Cowork session without Chrome connected
runs in a sandbox with no internet and none of your files, and will tell you it cannot do the task.

How to use these:

1. Install Claude in Chrome from the Chrome Web Store and sign in with your Claude account.
2. In Chrome, open the site the brief is about and make sure you are signed in there.
3. Open the Claude side panel in Chrome (or start a Cowork session in the desktop app and turn on
   Chrome as a tool), then paste the brief. Do one brief per session.
4. Watch the first two or three actions, then let it run.

File uploads are the one weak spot. The extension clicks inside web pages, but the "choose file"
window that opens on an upload belongs to your Mac or Windows, not the page, so it may not be able
to pick the file. Every brief below tells Claude to stop at that point, name the file, and wait for
you to pick it and say "done". Expect to do that a few dozen times for Brief 1.

---

## Brief 1: Circle visuals (files: learn-ai-manual-uploads.zip, learn-ai-lesson-thumbnails.zip)

Download both zips to the computer you will use and unzip them in Downloads, so the folders are
`~/Downloads/learn-ai-manual-uploads` and `~/Downloads/learn-ai-lesson-thumbnails`.

You are finishing the visual setup of my Circle community at learn-ai-46fe2f.circle.so, working
in my signed-in Chrome. Work through these blocks in order and tell me when each is done. If a
control is not where I describe, look under the space's Customize menu or the Settings page. Never
delete anything. When a "choose file" window opens and you cannot pick the file yourself, stop,
tell me the exact file name to pick from ~/Downloads/learn-ai-manual-uploads or
~/Downloads/learn-ai-lesson-thumbnails, and wait until I say "done" before continuing.

1. Settings → Theme. Logo for light mode: logo-light.png. Logo for dark mode: logo-dark.png.
   Community icon: community-icon.png. Default theme: light. Save.
2. For each space below: open it, click the dropdown beside its name, choose Customize, click the
   icon, choose the Custom tab, upload the file, save.
   Welcome and Announcements: icon-welcome.png. Ask Coach: icon-ask-coach.png.
   Course Requests: icon-course-requests.png. Parent Hub: icon-parent-hub.png.
   Classroom: icon-classroom.png. Show and Tell: icon-show-and-tell.png.
   Live Sessions: icon-live-sessions.png.
3. Open the Classroom. For each class, open its settings, find Thumbnail, upload the file that
   matches its title, save:
   What is AI? → lesson-01-what-is-ai.png
   Generative AI in a Nutshell → lesson-02-generative-ai-in-a-nutshell.png
   ChatGPT Power User in 30 Minutes → lesson-03-chatgpt-power-user-in-30-minutes.png
   Large Language Models, Explained Briefly → lesson-04-large-language-models-explained-briefly.png
   The Perfect ChatGPT Prompt Formula → lesson-05-the-perfect-chatgpt-prompt-formula.png
   What are AI Agents? → lesson-06-what-are-ai-agents.png
   AI Agents Fundamentals in 21 Minutes → lesson-07-ai-agents-fundamentals-in-21-minutes.png
   Make a Game → lesson-08-make-a-game.png
   Make an App → lesson-09-make-an-app.png
   Make a Website → lesson-10-make-a-website.png
   Make a Chatbot → lesson-11-make-a-chatbot.png
   Make an AI Agent → lesson-12-make-an-ai-agent.png
   Make a Video → lesson-13-make-a-video.png
   Make a Cartoon → lesson-14-make-a-cartoon.png
   Make Music → lesson-15-make-music.png
   Make AI Art → lesson-16-make-ai-art.png
   Make a Comic → lesson-17-make-a-comic.png
4. Open Home and its customize panel. Welcome banner: welcome-banner.png. Pin the post titled
   "Start here". Feature the Classroom, Ask Coach and Show and Tell spaces, in that order. Save.
5. Courses → three dots (top right) → Banner. On the Logged in tab: toggle the banner on. Title:
   Learn AI by building things. Description: Beginner AI. Intermediate AI. Then ten project classes:
   make a game, an app, a website, a chatbot, a song, a comic, and more. Button text: Start with
   class 1. Button URL: https://www.joinlearnai.com/c/classroom/ Image: course-directory-banner.png, dragged so
   the blue badge is centered. Save. Repeat on the Logged out tab.
6. Settings → SEO (or Social sharing). Preview image: og-image.png. Save.
7. In the left sidebar, drag spaces so the order reads: Welcome and Announcements, Ask Coach,
   Course Requests, Parent Hub, Classroom, Show and Tell, Live Sessions.
8. Take a screenshot of Home and of the Classroom and show me.

## Brief 1b: Connect joinlearnai.com to Circle (Circle settings + Cloudflare DNS)

Circle requires the www form for a root domain, so the community URL becomes
www.joinlearnai.com and the bare joinlearnai.com redirects to it. Setting a custom domain also
turns off Google and Facebook sign-in for the community; members sign in with email and password.

You are connecting my domain joinlearnai.com to my Circle community at learn-ai-46fe2f.circle.so.
I am signed in to Circle as the owner and to Cloudflare (dash.cloudflare.com) as the account that
owns the domain. Work in my signed-in Chrome. Never delete DNS records except where I say so, and
never change nameservers. Tell me when each block is done.

1. In Circle: click the community name at the top left → Settings → Custom domain. In the domain
   field type exactly www.joinlearnai.com (with the www). Circle shows a CNAME record with a
   Host/Name and a Target/Value. Copy both and show them to me. Do not click Setup domain yet.
2. In Cloudflare: open the joinlearnai.com domain → DNS → Records. If any record for www or for
   the root (@) already exists, tell me what it is and wait for my answer before touching it.
   Otherwise click Add record: Type CNAME, Name www, Target the value Circle showed, Proxy status
   OFF (it must say DNS only), TTL Auto. Save.
3. Still in Cloudflare DNS, add the redirect for the bare domain: Add record, Type A, Name @,
   IPv4 address 192.0.2.1, Proxy status ON. Save. Then go to Rules → Redirect Rules → Create
   rule. Name: root to www. Custom filter expression: Field Hostname, Operator equals, Value
   joinlearnai.com. Then: Type Dynamic, Expression
   concat("https://www.joinlearnai.com", http.request.uri.path), Status code 301, Preserve query
   string checked. Deploy.
4. Back in Circle: click Setup domain. If Circle asks for a CAA record, go back to Cloudflare DNS
   and add: Type CAA, Name @, Tag "Only allow specific hostnames" (issue), CA domain name
   pki.goog. Save, then click Setup domain again. The status will show pending; that is normal.
5. Wait five minutes, reload the Custom domain page, and tell me the status. When it says active,
   open a new tab and visit https://www.joinlearnai.com, then https://joinlearnai.com, then
   https://learn-ai-46fe2f.circle.so. All three should land on the community at
   www.joinlearnai.com. Screenshot the result of each and show me.

## Brief 2: Stripe and the paywall (runbook section 3)

You are setting up payments in my Circle community at www.joinlearnai.com. I am signed in.
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
