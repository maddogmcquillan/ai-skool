# Checkout page copy (Circle paywall, Checkout tab > Customize)

The live checkout is https://www.joinlearnai.com/checkout/back-in-school-access. Circle's Admin API
cannot edit paywall customization, so everything here is pasted by hand in Circle admin > Payments >
Paywalls > the paywall > Checkout tab > Customize. Brief 14 in `docs/COWORK-BRIEFS.md` is the
paste-ready version for Claude in Chrome.

Model: a direct-to-consumer checkout (brand header with a review line and trust badges, short
"what's included", guarantee, reviews under the payment form). Circle gives us these pieces:
cover image, title, description, up to 5 badges, up to 10 benefits, a price callout, a reduced
price strikethrough, up to 10 testimonials. It does not give us an FAQ accordion, a collapsible
benefits list, a custom header, or any custom code on the checkout page itself.

## Cover image (the "header")

Upload `brand/assets/checkout-header.png` (1080 x 606, renders at 540 x 303). White background,
the Learn AI wordmark, a yellow "4.9 rating · 1,000+ students" pill, and a trust row:
Money-back guarantee · Secure checkout · Pause or cancel anytime. This is the closest Circle gets
to a brand header with trust badges, because the community logo at the very top cannot be changed.

## Product details

Title (display name, do not change: it regenerates the checkout slug): Back in School Access
Description: empty. If Circle insists: Everything your kid needs to learn AI and build with it.

## Badges (Show badges on, three, custom icons from `brand/assets/checkout-icons/`)

1. `icon-shield.png` Money-back guarantee
2. `icon-lock.png` Secure checkout by Stripe
3. `icon-unlock.png` Pause or cancel anytime

## Benefits (Show benefits on, section title "What's included", title then description)

1. `icon-tools.png` **AI basics to building games, apps and chatbots** — 17 classes, from what AI is to real projects.
2. `icon-calendar.png` **New classes every week** — Members vote on what comes next.
3. `icon-cap.png` **Instructors from Microsoft, Google, Meta and IBM** — The same instructors adults learn from.
4. `icon-chat.png` **Live answers to questions** — Coach answers fast, and a real person reads every thread.
5. `icon-shield.png` **Money-back guarantee** — Not what we described? Email within 30 days of your first payment for a full refund.
6. `icon-unlock.png` **Pause or cancel anytime** — From your account, or by email.
7. `icon-rocket.png` **Skills they keep for life** — For school, for work and for whatever comes next.

Circle caps titles at 50 characters and shows a placeholder when a description is blank, so every
line above has both.

## Price details

- Reduced price on, original price $199, actual price $49. (Only honest while $199 is the listed
  standard price; see the note at the end.)
- Callout, 30-character limit: `Money back · pause or cancel` (28). Colour #FFC245, Highlight on.
- Countdown price lock: off. Circle's countdown is a per-visitor timer that ends the reduced price
  for that visitor when it expires, which would send a returning parent to $199. The landing page
  already carries the urgency. Turn it on only with a fixed end date and a real price change.

## Testimonials (Show testimonials on, five, in this order)

These render at the bottom of the order details, which on a phone is under the payment form,
exactly where the reference page puts its reviews. Name and role as written; quote verbatim.
If the editor requires an image, upload `brand/assets/community-icon.png`. If it offers a star
rating, set 5.

1. Parent of Mason · Age 16, verified review — "My son is now creating websites and apps, and he's gotten so good that people have started asking him to build websites and apps for their businesses."
2. Parent of Sophia · Age 12, verified review — "My daughter has improved greatly since joining. Her teacher makes the classes engaging, and now she looks forward to learning and completing her projects."
3. Parent of Ethan · Age 16, verified review — "My son started traditional coding classes in high school, but with everything changing because of AI, we wanted something more current. This gave him a structured introduction to AI coding and helped him decide whether computer science might be something he wants to pursue in college."
4. Parent of Ava & Noah · Ages 13 & 15, verified review — "I enrolled my kids and followed along with them. They stayed interested and motivated throughout the entire course. The assignments challenged them without being overwhelming and helped them build real understanding."
5. Parent of Lucas · Age 14, verified review — "My son has taken several courses and keeps asking for more classes and more challenges. He willingly wakes up early to attend class and complete his assignments."

## The guarantee itself

30 days on the first payment, full refund if the membership is not what the website described.
It is written into `site/terms.html` (section 3), `site/parents.html`, and the landing page's
offer fine print and FAQ, so the checkout promise is backed by the policy.

## Not possible on Circle's checkout, and what stands in

- FAQ accordion under the pay button: no. The landing page FAQ covers it; the testimonials and
  benefits fill the space under the form instead.
- Collapsible "What's included": no. Seven short lines is the compromise.
- Payment-method logo row: Stripe's form shows the available methods itself; do not add card logos
  to the cover image.
- Custom header text under the community logo: no; the cover image is the header.

## Keep in sync

- Never edit the display name without repointing every checkout link (see `CLAUDE.md`).
- Never write "no refunds" anywhere.
- A struck-through $199 is only honest if $199 is a real listed price for this membership.
