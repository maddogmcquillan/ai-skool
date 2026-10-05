# Checkout page copy (Circle paywall, Checkout tab > Customize)

The live checkout is https://www.joinlearnai.com/checkout/back-in-school-access. Circle's Admin API
cannot edit paywall customization, so everything here is pasted by hand: Circle admin > Payments >
Paywalls > the paywall > Checkout tab > Customize (sidebar sections: Paywall cover image, Product
details, Badges, Benefits, Testimonials, Price details). Brief 13 in `docs/COWORK-BRIEFS.md` is the
paste-ready version for Claude in Chrome.

The page is deliberately short. The landing page (`site/classes.html`) does the selling; the
checkout restates what is included in six lines and gets to the payment form.

## Cover image

None. Remove the cover so the title is the first thing on the page. (`brand/assets/checkout-cover.png`
stays in the repo for ads and social, unused here.)

## Product details: title (Circle's "display name")

Back in School Access

The display name is the checkout headline, the name on receipts and on the member's billing page,
and the label Circle puts on every charge. Three things follow from changing it, all handled in
Brief 13: Circle regenerates the Checkout URL slug (it is now `back-in-school-access`, and every
link on the site matches it; verify in a private window), the name must be in
`DEFAULT_PAYWALL_KEYS` in `src/chargeLoop.ts` (it is), and
receipts will read "Back in School Access". If the owner would rather see the brand on receipts,
use "Learn AI: Back in School Access" and add that exact string to `DEFAULT_PAYWALL_KEYS` first.

## Product details: description

Leave empty. If Circle insists on one, use (49 characters):

Everything your kid needs to learn AI and build with it.

## Badges

Show badges off. The benefits below carry the same points; badges would repeat them.

## Benefits (Show benefits on, section title "What's included", in this order, title only;
if the editor requires a description, use the short line in brackets)

Icons are the uploaded 280 x 280 tiles in `brand/assets/checkout-icons/`.

1. `icon-tools.png` **Classes from AI basics to building games, apps and chatbots**
   [17 classes, from what AI is to real projects.]
2. `icon-calendar.png` **New classes every week**
   [Members vote on what comes next.]
3. `icon-cap.png` **Taught by working experts from Microsoft, Google, Meta and IBM**
   [The same instructors adults learn from.]
4. `icon-chat.png` **Stuck? Real help in minutes**
   [Coach answers fast, and a real person reads every thread.]
5. `icon-unlock.png` **Pause or cancel anytime**
   [From your account, or by email.]
6. `icon-rocket.png` **The result: skills they keep for life**
   [For school, for work and for whatever comes next.]

Benefit titles are capped at 50 characters; the longest above is 49 (line 3: "Taught by working
experts from Microsoft, Google, Meta and IBM" is 58, so if Circle refuses it use "Taught by experts
from Microsoft, Google and Meta" at 48, or "Instructors from Microsoft, Google, Meta and IBM" at 48).

## Price details

- Reduced price: **on**, original price **$199**, so the price line shows $199 struck through
  beside $49 a month, the same as the landing page. Keep the actual price at $49.
- Callout text (30-character limit): `Back in School: cancel anytime` (exactly 30). Callout colour
  #FFC245 with **Highlight** on, so it renders as a filled badge with dark text.
- Countdown price lock: off.

## Testimonials

Off until there are real, permissioned reviews.

## Keep in sync

- Every claim above is on the landing page and in the research doc. The company names are the
  instructors' verified employers; do not add others.
- Never write "no refunds" anywhere on the checkout. The terms carry the one gentle clause.
- A struck-through $199 is only honest if $199 is a real price for this membership. Set the
  paywall's standard price to $199 with $49 as the promotional price, or be ready to show that
  $199 was charged, before ads point at this page.
- The slug guard in `CLAUDE.md` applies every time the title changes.
