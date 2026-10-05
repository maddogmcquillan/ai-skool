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
   Founding Member. Price: $49 per month, recurring, no trial. Access: the Classroom space group
   plus Start Here and Community. Checkout page: on. Save, then copy the checkout URL and show me.
3. Do not touch the paywall's Tracking tab yet; I will give you the snippet separately.

## Brief 3: Affiliates (runbook section 9)

Settings → Payments → Affiliates settings. Reward type: Fixed amount. Amount: [BOUNTY]. Turn on
"Limit number of recurring commissions" and set it to 1. Pending commission length: 30 days.
Payout method: [PayPal or Wise]. Promotional link: on, URL [LANDING PAGE URL]; copy the tracking
script it shows and paste it back to me. Paywalls: enable only founding-member. Save.
Then Payments → Affiliates → Invite affiliate, and invite these emails one by one: [LIST].

## Brief 3b: Put Coach live (Circle token, Anthropic key, Railway)

Most of this can run in Claude in Chrome. The owner still does four things: click the
password-reset email for the Coach account, sign in to console.anthropic.com and add the card,
authorize Railway with GitHub, and post the test questions. Secrets are copied from one tab to
the Railway Variables page and never typed into chat.

You are putting my Circle community's answer bot, Coach, live. Work in my signed-in Chrome. I am
signed in to Circle at www.joinlearnai.com as the owner. Tell me when each block is done. When a
step says STOP, stop and wait until I say "done". Never write a token or API key into your
replies; copy it straight into the Railway Variables page and tell me only that it is in place.

Block 1, Circle. Community name at the top left → Members. Find the member named Coach and open
it. Change its role to Admin (look for a role setting or a "Make admin" option in the member's
menu). Save. Note the email shown on Coach's profile; call it COACH_EMAIL. Then open Settings →
Members (or Team) and note the email of the account named Learn AI Team; call it TEAM_EMAIL. Tell
me both emails.

Block 2, Coach's password. STOP. I will open a private window, use Forgot password with
COACH_EMAIL, set a password from the email, and say "done". Then, in a new tab, sign in to
www.joinlearnai.com as Coach with the password I give you. Go to Settings → Developers → Tokens →
Create token, type Admin API v2, name coach-service. Leave the page with the token visible.

Block 3, Anthropic key. STOP. I will sign in at console.anthropic.com and add a card and credits,
then say "done". Then go to API keys → Create key, name learn-ai-coach, and leave the key visible
in its tab.

Block 4, Railway. Open railway.com. STOP if it asks me to log in or authorize GitHub; say "done"
when I have. Then: New project → Deploy from GitHub repo → choose maddogmcquillan/ai-skool (if it
is missing, use the link to configure GitHub app access, then STOP for me). Let the first build
start. Click the service card → Variables → add these, copying the two secrets from their tabs:
  HOOK_SECRET = a random string of 48 letters and digits that you generate yourself
  ANTHROPIC_API_KEY = the key from Block 3
  CIRCLE_ADMIN_TOKEN = the token from Block 2
  BOT_AUTHOR_EMAIL = COACH_EMAIL
  TEAM_AUTHOR_EMAIL = TEAM_EMAIL
  COACH_IGNORE_EMAILS = the owner's email (the account I am signed in to Circle with)
  PORT = 8787
Save. Then Settings → Networking → Generate domain, port 8787. Tell me the domain. Then
Deployments → latest → Logs, wait for the build, and confirm you see a line containing
"coach=polling" and one containing "watching". Then open https://<domain>/healthz and show me the
JSON. Close the tabs that show the token and the key.

Block 5, check. STOP. I will post test questions in Ask Coach as a test member and watch Coach
reply. Reload /healthz when I say so and read me the coach counters.

## Brief 4: Meta tracking end to end (Business Portfolio, Cloudflare, Railway, Circle)

You are setting up Meta ad tracking for my membership at www.joinlearnai.com. Work in my
signed-in Chrome. Tabs I have signed in: business.facebook.com (my Business Portfolio),
dash.cloudflare.com (owns joinlearnai.com), railway.com (project ai-skool) and Circle as the
owner. Tell me when each block is done. STOP means stop and wait for me to say "done". Never
write the Conversions API token into your replies; copy it straight into Railway.

Block 1, Page, inside the PetsVet Supply business portfolio. Business settings → Accounts →
Pages → Add → Create a new Page: name Learn AI, category Education. Open the Page: profile
picture fb-profile.png and cover fb-cover.png from ~/Downloads (STOP at each file chooser if you
cannot pick the file), website https://www.joinlearnai.com, bio "AI classes and a safe community
for ages 11 to 17. Learn AI by building things." In the Page's settings turn on the profanity
filter, set "Who can post on the Page" to only the Page, and leave everything else at its
default. Ads will run from the existing petsvet ad account; do not create an ad account.

Block 2, Dataset and token. Events Manager (for the PetsVet Supply portfolio) → Connect data
sources → Web → name it Learn AI Web → create. Copy the dataset id (also called Pixel ID) and
tell it to me. In the dataset's Settings, under connected assets, add the petsvet ad account.
Then Conversions API → Generate access token. Leave the token on screen.

Block 3, Railway. Open the ai-skool service → Variables. Add META_PIXEL_ID = the dataset id,
META_CAPI_ACCESS_TOKEN = the token (copied from the Meta tab), META_PAYWALL_KEYS = Founding
Member=founding-member. Save; Railway redeploys. Close the Meta tab that shows the token. Then
open https://ai-skool-production.up.railway.app/healthz and confirm it now has a "meta" block.

Block 4, domain. Business settings → Brand safety and suitability → Domains → Add →
joinlearnai.com → choose DNS verification. Copy the TXT record value it shows. In Cloudflare →
joinlearnai.com → DNS → Records → Add record: Type TXT, Name @, Content the value, TTL Auto.
Save. Back in Meta, click Verify domain (retry after two minutes if it says not found).

Block 5, Circle snippets. The two files are in my repo; I will paste their contents to you when
you ask. Circle → Settings → Site → Code snippets → JavaScript code snippets: paste the first
file with REPLACE_WITH_PIXEL_ID replaced by the dataset id, no <script> tags. Save. Then
Payments → Paywalls → Founding Member → Tracking tab: paste the second file with the id filled in,
keeping its <script> tags. Save.

Block 6, check. Events Manager → the dataset → Test events. Open www.joinlearnai.com in a new tab
and confirm a PageView appears. Tell me what you see and STOP.

## Brief 5: Zapier zaps (only if the pollers are turned off; runbook section 8)

Two zaps, exact field mappings are in docs/SETUP-RUNBOOK.md section 8. Connect the Circle app with
the Zapier token I created in Circle (Developers → Tokens, type Zapier). Build Zap 1 (New Member
Paid Charge → Webhooks by Zapier POST to [SERVICE URL]/hooks/circle/charge with header
X-Hook-Secret) and Zap 2 (New Post in Ask Coach → Webhooks Custom Request to
[SERVICE URL]/hooks/circle/question → Circle Create Comment as [COACH EMAIL]). Turn both on and
run a test of each, showing me the results.

## Brief 6: Website on the bare domain, email at the domain, affiliate settings

You are finishing three things for my membership Learn AI. Work in my signed-in Chrome. Tabs I
have signed in: railway.com (project ai-skool), dash.cloudflare.com (owns joinlearnai.com) and
Circle at www.joinlearnai.com as the owner. Tell me when each block is done. STOP means stop and
wait for me to say "done".

Block 1, Railway. Open the ai-skool service → Settings → Networking → Custom Domain → add
joinlearnai.com. Railway shows a CNAME target (a hostname ending in railway.app). Copy it and
tell it to me.

Block 2, Cloudflare DNS. Open joinlearnai.com → DNS → Records. Delete the A record named @ that
points to 192.0.2.1 (this one deletion is allowed; touch nothing else). Add record: Type CNAME,
Name @, Target the Railway hostname from Block 1, Proxy status ON. Save. Then SSL/TLS → Overview:
make sure the mode is Full (not Flexible). Then Rules → Redirect Rules: find the rule named
"root to www" and delete it (or disable it), otherwise the bare domain keeps redirecting to
Circle. Do not touch the www CNAME.

Block 3, check. Back in Railway, wait until the custom domain shows as ready with a certificate
(reload every minute, up to ten minutes). Then open https://joinlearnai.com in a new tab: it must
show the Learn AI landing page with the blue "Join as a Founding Member" button. Open
https://www.joinlearnai.com: it must still show the Circle community. Click the join button on
the landing page and confirm it opens the Founding Member checkout. Screenshot all three.

Block 4 (superseded by Brief 7; skip). Cloudflare → joinlearnai.com → Email → Email Routing → Get
started (or Settings if already enabled). Destination addresses → add my Gmail address (ask me
for it) → STOP while I click the verification email. Then Routing rules → Create address: custom
address hello, action Send to, destination my Gmail. If Cloudflare asks to add the MX and TXT
records for routing, accept. Confirm the rule shows Active.

Block 5, Circle affiliates. Community name → Settings → Paywalls (or Payments) → Affiliates →
Settings. Turn affiliates on. Reward type: Fixed amount. Commission: 49 (dollars). Turn on
"Limit number of recurring commissions" and set it to 1. Pending commission period: 30 days.
Payout method: PayPal. Promotional link: ON, URL https://joinlearnai.com. Copy the tracking
script Circle shows for the promotional link and paste it to me in full (it is not a secret).
Paywalls: enable only Founding Member. Save. Then open Paywalls → Founding Member → the monthly
price settings and confirm "Allow members to self-cancel subscriptions" is ON; turn it on if not.
Save.

Block 6 (cut; the owner invites the first affiliates by hand).

## Brief 6b (superseded by Brief 7): Reply from hello@joinlearnai.com inside Gmail

Run this after Brief 6 Block 4 (Cloudflare forwards hello@ to the owner's Gmail). Gmail must be
open and signed in in the same Chrome profile.

You are setting up Gmail so I can send email as hello@joinlearnai.com. Work in my signed-in
Chrome with Gmail open. STOP means stop and wait for me to say "done". Never type my Google
password; if Google asks for it or for a code, STOP.

1. Open myaccount.google.com → Security. If 2-Step Verification is off, STOP and tell me; I will
   turn it on myself. If it is on, open App passwords (search the page for it), create one named
   Gmail send-as, and leave the 16-character password on screen.
2. In Gmail: Settings (gear) → See all settings → Accounts and Import → "Send mail as" → Add
   another email address. Name: Learn AI. Email: hello@joinlearnai.com. Keep "Treat as an alias"
   checked. Next. SMTP server smtp.gmail.com, port 587, username my full Gmail address, password
   the app password from step 1, TLS. Add account.
3. Gmail sends a confirmation code to hello@joinlearnai.com, which Cloudflare forwards into this
   same inbox. Open the inbox, find the message from Gmail Team, copy the code, paste it into the
   confirmation box, verify.
4. Back in "Send mail as", set hello@joinlearnai.com as the default, and set "Reply from the
   same address the message was sent to". Close the app-password tab.
5. Compose a test email from hello@joinlearnai.com to my Gmail address with the subject "test
   from the domain" and send it. Tell me when it arrives and what the From line shows.

## Brief 7: A real mailbox, hello@joinlearnai.com on Google Workspace

The owner chose a proper mailbox over forwarding. Google Workspace Business Starter, one user,
about eight dollars a month. Cloudflare Email Routing must stay off (it would fight the MX
records). The Meta and Railway TXT records at the root stay as they are.

You are creating a Google Workspace mailbox hello@joinlearnai.com for my business Learn AI.
Work in my signed-in Chrome; dash.cloudflare.com is signed in and owns joinlearnai.com. STOP
means stop and wait for me to say "done". Never type a password or card number; STOP when a
form asks for one.

Block 1, sign-up. Open workspace.google.com and start the Business Starter plan (free trial is
fine). Business name Learn AI, just me, United States. Use my name and my current Gmail as the
contact. When it asks whether I have a domain, say yes and enter joinlearnai.com. First user:
username hello. STOP at the password screen; I will set the password and say "done".

Block 2, verify the domain. Google shows a verification TXT record (a value starting with
google-site-verification=). In Cloudflare → joinlearnai.com → DNS → Records → Add record: Type
TXT, Name @, Content that value, TTL Auto. Save. Back in Google, click Verify (retry after two
minutes if it fails). Do not delete any existing TXT records.

Block 3, activate Gmail. Google shows the MX record to add. In Cloudflare DNS, check there are no
existing MX records for joinlearnai.com (if Cloudflare Email Routing left any, tell me and STOP).
Add record: Type MX, Name @, Mail server smtp.google.com, Priority 1, TTL Auto. Save. Back in
Google, click Activate (or Verify) Gmail; retry after a few minutes if it says the record is
not found yet. STOP if Google asks for billing details; I will enter the card.

Block 4, make the mail trustworthy. In Cloudflare DNS add: Type TXT, Name @, Content
v=spf1 include:_spf.google.com ~all. Then in admin.google.com → Apps → Google Workspace →
Gmail → Authenticate email → Generate new record (2048-bit): copy the DKIM host name and value
and add them in Cloudflare as a TXT record; wait five minutes, then click Start authentication.
Then add one more TXT: Name _dmarc, Content v=DMARC1; p=none; rua=mailto:hello@joinlearnai.com.

Block 5, check. Open mail.google.com in a new tab (STOP for me to sign in as
hello@joinlearnai.com). Send a test message from hello@ to my personal Gmail with the subject
"mailbox test". Tell me when it lands, and screenshot the Cloudflare DNS records list.

## Brief 8: Build the first Meta campaign as drafts

Prerequisites: a card on the Learn AI ad account, the nine statics from `brand/assets/ad-*.png`
unzipped into ~/Downloads/learn-ai-ad-statics, Ads Manager open on the Learn AI account.

You are building my first Meta campaign in Ads Manager for the Learn AI ad account. The nine
image files are in ~/Downloads/learn-ai-ad-statics. Build everything, leave the campaign OFF,
and STOP for my review before publishing anything live.

Campaign: name "LAI - Founding Members", objective Sales, manual setup, no campaign budget
(budgets sit on the ad sets). Conversion location Website, dataset Learn AI Web, conversion
event Purchase, attribution 7-day click and 1-day view.

Ad set 1 "LAI - Broad": United States, ages 25 to 55, Advantage+ audience on, all placements,
daily budget $50.
Ad set 2 "LAI - Interests": United States, ages 25 to 55, detailed targeting interests
parenting, homeschooling, STEM education, coding for kids, Khan Academy, Outschool; daily
budget $30.
Ad set 3 "LAI - Retargeting": create a custom audience of website visitors from the Learn AI
Web dataset, last 30 days; exclude a custom audience of Purchase events, last 180 days; daily
budget $10.

In every ad set create three ads named List, Path and Trust. For each, upload the three sizes
(ad-list-1x1, ad-list-4x5, ad-list-9x16, and the same for path and trust) and assign 1:1 to
feeds, 4:5 to Instagram feed, 9:16 to stories and reels. Identity: the Learn AI Page. Website
URL https://joinlearnai.com. Call to action "Learn more". URL parameters:
utm_source=meta&utm_campaign=lai-founding&utm_content={{ad.name}}.
List ad: primary text "Your kid can build real things with AI this month: a game, an app, a
website, a chatbot. No coding needed. Ages 11 to 17. $49/month, cancel anytime." Headline
"Build a game, an app, a chatbot". Description "Cancel anytime. An adult reads every thread."
Path ad: primary text "Seventeen short classes, ten real projects, a coach that answers in
minutes, and a community with no private messaging. Built for parents to trust." Headline
"AI classes for ages 11 to 17". Description "17 classes, 10 projects, weekly live build-along."
Trust ad: primary text "Most kids use AI. Few understand it. Learn AI teaches how it works, then
has them build with it. From $49 a month. Founding rate locked in." Headline "A kids' AI
program parents can trust". Description "No member messaging. Parent consent at signup."

Save everything as drafts with the campaign switched off, show me a screenshot of the campaign
tree, and STOP.

## Brief 9: Checkout page copy and cover (Circle paywall "Founding Member")

Prerequisite: save the new cover image from the chat to `~/Downloads/checkout-cover.png`
(it is `brand/assets/checkout-cover.png` in the repo, 1080 x 606). Have Chrome signed in to
www.joinlearnai.com as the admin. Copy is also in `docs/CHECKOUT-COPY.md`.

You are updating the checkout page of my Circle community at www.joinlearnai.com, working in my
signed-in Chrome. Open the admin area (click the community name top-left, or Settings), go to
Paywalls, open the paywall named "Founding Member", open its Checkout tab and click Customize.
The customize editor has a sidebar with sections named Paywall cover image, Product details,
Badges, Benefits, Testimonials and Price details. Work through the blocks in order, click Save
Changes after every block, and tell me when each block is done. Never delete the paywall, never
change its price, access or Tracking tab, and never turn on "Reduced price" or "Countdown price
lock". If a "choose file" window opens that you cannot operate, stop, tell me to pick
~/Downloads/checkout-cover.png, and wait until I say "done".

Block 1, cover image. In the sidebar click Paywall cover image. Use the option under the current
thumbnail to replace the image with checkout-cover.png. Save Changes.

Block 2, product details. Click Product details. Replace the title with exactly:
Learn AI Founding Membership
Replace the description with exactly:
Real instructors, a finished project every class, and a coach that answers in minutes. Founding rate for the first 200 families, locked in for life. Your kid can start tonight.
IMPORTANT: Circle regenerates the Checkout URL slug from the title. Before saving, find the
Checkout URL field (in Product details, or on the paywall's main edit form) and make sure the slug
is exactly founding-member, so the URL stays https://www.joinlearnai.com/checkout/founding-member.
If it changed, type founding-member back in. Save Changes. Then open that URL in a private
window and confirm it shows the checkout page, not a sign-in page, before continuing.

Block 3, badges. Click Badges. Show badges: on. Edit the existing badges so that exactly three
remain, in this order, with this exact text and emoji (if each badge has an icon or emoji picker,
pick the one in brackets; if it only takes text, put the emoji at the start of the text):
1. New classes every week  [📅 calendar]
2. Coach answers in minutes  [💬 speech bubble]
3. Cancel anytime  [🔓 open padlock]
Delete every other badge, including "Founding rate · first 200 families" and "Ages 11 to 17".
Save Changes.

Block 4, benefits. Click Benefits. Show benefits: on. Replace the current list so that exactly
these seven remain, in this order. Each has an icon, a title and a description. Where the
editor offers an icon picker, choose the one described in brackets; the chat bubble must be on
Ask Coach and nowhere else, and nothing may use a film, movie or clapperboard icon.
1. [🎓 graduation cap] Real instructors, real credentials — A former Microsoft product manager, a Google product marketer, a former Meta data scientist, IBM's own engineers. College-level material, taught so a 12-year-old gets it.
2. [🧠 brain] How AI actually works — Short classes on what it is, where it gets things wrong, and how to use it well. Watch the first one together tonight.
3. [🛠️ tools] A finished project every class — A game, an app, a website, a chatbot, an AI agent and more. Things they can turn the laptop around and show you.
4. [📅 calendar] New classes every week — Members ask for the class they want next and vote on it.
5. [💬 speech bubble] Ask Coach — Stuck at 9pm? An answer in minutes, and a real person on our team reads every thread.
6. [🛡️ shield] Safe by design — No messaging between members. Parent consent at signup. Built for ages 11 to 17.
7. [🔒 closed padlock] Locked in for life — Join at $49 and it stays $49 every month, for as long as you're a member. Cancel anytime.
Delete anything else left over ("Beginner-friendly AI classes", "Project classes", "A safe,
moderated space", "Your rate never goes up" and any older items). Save Changes.

Block 5, price callout. Click Price details. Next to the $49 monthly price, set Callout text to
exactly: Founding rate · first 200 families. Callout colour: the yellow/amber option (closest to
#FFC245). Leave Reduced price off and Countdown price lock off. Save Changes.
Then open the paywall's Pricing tab. If the $49 monthly price has a description field, change it
to: Locked in for life. Less than a family dinner out.
If there is no such field, skip this and tell me.

Block 6, testimonials. Click Testimonials and make sure Show testimonials is OFF. Do not add any.

Block 7, check. Click View (top right) and preview on mobile, then on desktop; screenshot both.
Then open https://www.joinlearnai.com/checkout/founding-member in a new tab on a phone-width
window and screenshot the top of the page. Confirm: the cover reads "Your kids use AI. Nobody has
taught them how." with five small faces on it, the title under the cover is "The AI class their
school doesn't have.", the description shows in full with no "See more" link, exactly three
badges show (calendar, speech bubble, open padlock), the yellow callout shows on the $49 price,
and the benefits list has exactly the seven items from Block 4 with the speech bubble only on
Ask Coach. Show me the screenshots and STOP.

### Brief 9 follow-up (what is still open after the first run)

Status after the first run, verified from a logged-out phone on Oct 3: cover, title "Learn AI
Founding Membership", three badges, seven benefits and the callout are live, and
/checkout/founding-member renders the checkout again. Still open: custom icons (badges and
benefits still show emoji), the benefits section title, the callout text and highlight, and the
description, which is still cut off behind "See more" on phones.

Prerequisite: save the eight icon files from the chat into `~/Downloads/checkout-icons/` (they are
`brand/assets/checkout-icons/icon-*.png` in the repo, 280 x 280 PNG).

Same place as before: Paywalls > Learn AI Founding Membership > Checkout > Customize. Save
Changes after each block and tell me when each is done. If a file picker opens that you cannot
operate, stop, tell me which file to pick, and wait for "done". Do not touch the title or the
Checkout URL slug; both are correct now.

Block 1, description. In Product details, replace the description with exactly:
Real instructors, a finished project every class, help in minutes. Locked in at $49 for life. Start tonight.
Save Changes.

Block 2, badge icons. In Badges, for each of the three badges click the emoji/icon control and
choose the option to upload an image. Upload, in order:
1. New classes every week → ~/Downloads/checkout-icons/icon-calendar.png
2. Coach answers in minutes → ~/Downloads/checkout-icons/icon-chat.png
3. Cancel anytime → ~/Downloads/checkout-icons/icon-unlock.png
If the badge has text and background colour swatches, pick the darkest text option and the
lightest background option. Save Changes.

Block 3, benefit icons and section title. In Benefits, set the section Title field to exactly:
Everything your kid gets for $49 a month
Then for each of the seven benefits replace the emoji with the uploaded image:
1. Real instructors, real credentials → icon-cap.png
2. How AI actually works → icon-brain.png
3. A finished project every class → icon-tools.png
4. New classes every week → icon-calendar.png
5. Ask Coach → icon-chat.png
6. Safe by design → icon-shield.png
7. Locked in for life → icon-lock.png
Save Changes.

Block 4, price callout. In Price details > Callouts, set the callout text for the $49 monthly
price to exactly (30 characters, which is the limit): Founding rate · cancel anytime
If the editor still refuses it, use: Locked in · cancel anytime
Keep the callout colour #FFC245. Then open the three-dot menu next to the $49 price option and
choose Highlight, so the callout renders as a filled yellow badge with dark text instead of
yellow text on grey. Leave Reduced price off and Countdown price lock off. Save Changes.

Block 5, check. Open https://www.joinlearnai.com/checkout/founding-member in a logged-out,
phone-width window and screenshot the top. Confirm: the description shows in full with no "See
more" link, the three badges show blue square icons (not emoji), the $49 option shows a filled
yellow badge reading "Founding rate · cancel anytime", and the benefits section is titled
"Everything your kid gets for $49 a month" with blue square icons. Then, without paying, type a
test email into the account field and confirm the payment form renders card fields and an Apple
Pay, Google Pay or Link button with no red error text anywhere. Screenshot it and STOP.

## Brief 10: Pull the funnel report (Meta Events Manager, Ads Manager, Stripe, Circle)

Have Chrome signed in to business.facebook.com (Learn AI portfolio), dashboard.stripe.com and
www.joinlearnai.com as admin. Read-only: this brief changes nothing anywhere.

You are pulling a read-only funnel report for my Learn AI ads, working in my signed-in Chrome.
Do not change any setting, budget, ad, or page. Collect the numbers below for the range "since
the campaign started" (use the campaign's start date; if unsure use the last 7 days) and give
them back to me as one table, with a screenshot of each screen you read from.

Block 1, Meta Events Manager. Go to business.facebook.com/events_manager2, select the Learn AI
business portfolio, open the dataset "Learn AI Web" (pixel id 2050628052248432), Overview tab.
Set the date range. Record the count for each event: PageView, ViewContent, InitiateCheckout,
Purchase, and any others listed. Then click PageView, then "View details", and look for the URL
breakdown: record how many PageViews were on joinlearnai.com/ai-for-kids, how many on
joinlearnai.com/ (the home page), and how many on www.joinlearnai.com/checkout/founding-member
(that number is how many people reached the checkout). Do the same URL breakdown for
InitiateCheckout. Screenshot each view.

Block 2, Ads Manager. Go to adsmanager.facebook.com for the Learn AI ad account, campaigns
list, same date range. Click Columns and choose "Performance and clicks", then Customize columns
and make sure these are on: Amount spent, Impressions, Reach, Link clicks, CTR (link
click-through rate), CPC (cost per link click), Landing page views, Checkouts initiated,
Purchases, Cost per purchase, Purchase ROAS. Record the campaign row, then open the ad sets and
each ad and record the same columns per ad. Screenshot each level. If the campaign's start
date is visible, record it.

Block 3, Stripe. Go to dashboard.stripe.com, Payments. Filter status Succeeded for the range and
record the count and total. Then filter status Incomplete (and Failed, if any) and record the
count: these are people who reached the payment step and did not finish. Open Customers and
record how many were created in the range. Screenshot each.

Block 4, Circle. On www.joinlearnai.com go to the admin area, Paywalls, Founding Member, and
record what its Transactions and Subscriptions tabs show for the range. Then Audience: record how
many members joined in the range. Screenshot both.

Report format: a table with rows Impressions, Link clicks, Landing page views, Landing page
PageViews (pixel), ViewContent, InitiateCheckout, Checkout PageViews (pixel), Stripe incomplete
payments, Stripe succeeded payments, Circle subscriptions, Amount spent, Cost per purchase.
Add one line per ad with its link clicks, landing page views and checkouts initiated. STOP.

## Brief 11: Stop paying for Circle API polling (Circle Workflows → webhook)

Context for me, not for the other Claude: Circle billed $52 of Admin API overage in the first
five days the service was live, because both pollers asked Circle every 60 seconds (about 2,900
calls a day against an allowance of 5,000 a month). The code now polls every 5 minutes (Coach)
and hourly (Meta), which keeps the overage near $25 a month. This brief makes Circle tell the
service when something happens, so polling can drop to a safety net and the overage to zero.
Chrome needs to be signed in to www.joinlearnai.com as admin and to railway.com. The HOOK_SECRET
value lives in Railway → the service → Variables; it is copied inside the browser and never
pasted into chat.

You are setting up Circle workflows that call my service's webhook, working in my signed-in
Chrome. Do not change any paywall, price, member, space, or Railway variable other than the one
named in block 4. After each block tell me what you did, with a screenshot, and write down the
exact names Circle uses for the trigger and the action you picked.

Block 1, the values. Open railway.com, the ai-skool project, the service, Variables. Find
HOOK_SECRET and reveal its value. Also note the service's public domain under Settings →
Networking (ai-skool-production.up.railway.app unless it changed). Build two URLs and keep them
for the next blocks, using the Railway domain, not joinlearnai.com:
  https://<domain>/hooks/circle/nudge/coach?secret=<HOOK_SECRET>
  https://<domain>/hooks/circle/nudge/meta?secret=<HOOK_SECRET>

Block 2, Coach. On www.joinlearnai.com open the admin area → Workflows → New workflow →
Automation. Name it "Nudge Coach: new post". Trigger: the one for a new post published in a
space, scoped to the space "Ask Coach". Action: the one that sends to a webhook (Circle may call
it "Send to webhook" or similar). Paste the coach URL. If the action lets you add a header, add
X-Hook-Secret with the secret as its value and remove "?secret=..." from the URL. Save and turn
it on. Then make a second workflow, "Nudge Coach: new comment", with the trigger for a new
comment on a post (scoped to Ask Coach if it allows) and the same action and URL. If Circle
offers no comment trigger, say so in your report and skip this one.

Block 3, purchases. New workflow "Nudge Meta: purchase". Trigger: the one for a successful
paywall payment or purchase (scoped to the paywall "Learn AI Founding Membership" if it asks).
Action: send to webhook with the meta URL (header variant if available). Save and turn it on.

Block 4, test and slow the poll. In a private window, signed in as the test member, post a
question in Ask Coach, for example "How do I give my chatbot a memory?". Coach should reply
within a minute. Open https://<domain>/healthz and screenshot it: coach.ticks should have gone up
by one right after the post. If Coach replied within a minute, go to Railway → Variables and set
COACH_POLL_SECONDS to 1800 (add it if it is missing). If block 2 found no comment trigger, set it
to 300 instead. Do not touch any other variable; Railway redeploys on its own.

Block 5, the usage number. On www.joinlearnai.com, admin → Settings → Developers (the API tokens
page) shows the API usage for this billing cycle. Screenshot it, so I have today's number to
compare against tomorrow's. STOP.

## Brief 12: Rename Ask Coach to Get Unstuck in Circle, update the checkout badges

Context for me, not for the other Claude: the help space is called Get Unstuck in the code, on
the website and in Coach's knowledge; the slug stays `ask-coach` so the poller is unchanged.
Circle's Admin API has no call to rename a space, so the live rename is a click job. The new
cover, thumbnail and welcome banner are in `brand/assets/` (`cover-ask-coach.png`,
`thumb-ask-coach.png`, `welcome-banner.png`); `npm run brand` uploads them from an environment
that has `CIRCLE_ADMIN_TOKEN`, or the other Claude uploads the cover by hand in block 1. Chrome
signed in to www.joinlearnai.com as admin.

You are renaming one space and editing the checkout page in my Circle community, working in my
signed-in Chrome. Change nothing else. Screenshot each step and report what you did.

Block 1, the space. Open the space currently named "Ask Coach" (in the Start Here group) and
open its settings. Change the name to exactly "Get Unstuck". Do not touch the URL slug: it must
stay ask-coach. Save. If I have given you the file cover-ask-coach.png, open Customize for the
space and replace the cover image with it. Reopen the space and confirm the sidebar shows
"Get Unstuck" and the URL still ends in /ask-coach.

Block 2, the checkout. Payments → Paywalls → "Learn AI Founding Membership" → Checkout →
Customize. In Benefits, open the benefit titled "Ask Coach", change the title to "Get Unstuck"
and the description to: "Ask anything. Coach answers in minutes, and a real person reads every
thread." Keep its icon. In Badges, change the badge "Cancel anytime" to "Pause or cancel
anytime". In Callout, change the text to "Pause or cancel anytime" (23 characters, within the
30 limit) and keep Highlight on. Save. Do not change the paywall's display name, price, access,
Tracking tab, or the Checkout URL slug.

Block 3, check. In a private window open https://www.joinlearnai.com/checkout/founding-member
on a phone-sized window. Confirm it opens the checkout (not a sign-in page), the three badges
read "New classes every week", "Coach answers in minutes" and "Pause or cancel anytime", and
the benefit list shows "Get Unstuck". Screenshot it. STOP.
