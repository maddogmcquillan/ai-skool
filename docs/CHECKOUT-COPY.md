# Checkout page copy (Circle paywall "Founding Member", Customization tab)

The live checkout is https://www.joinlearnai.com/checkout/founding-member. Circle's Admin API
cannot edit paywall customization, so these are pasted by hand: Circle admin > Paywalls >
Founding Member > Checkout tab > Customize (sidebar sections: Paywall cover image, Product
details, Badges, Benefits, Testimonials, Price details). Brief 9 in `docs/COWORK-BRIEFS.md` is
the paste-ready version for Claude in Chrome. The copy mirrors the "8 in 10" ad and its landing
page (`site/the-gap.html`) so the ad, the page and the checkout say the same thing in the same
words, the ones parents used in the research (`docs/RESEARCH-AVATARS.md`, Part 5).

## Cover image

Upload `brand/assets/checkout-cover.png` (1080 x 606, renders at 540 x 303). It carries the
landing page headline ("Your kids use AI. Nobody has taught them how."), one line of proof
("Real instructors. Real projects. Help in minutes."), five instructor faces with "Instructors
from Microsoft, Google, Meta and IBM", and the founding-rate chip. Type is kept large and the
price is left off, because the cover renders small on phones and the price sits right below it.

## Product details: title

Learn AI Founding Membership

(Circle's "display name" is this title, and it also prints on the member's billing page and
receipts, so it has to read as a product name. The emotional headline lives on the cover image
directly above it. Not "Founding Member" alone: it is the paywall's internal label, not a name.)

## Product details: description (under 110 characters, or Circle hides the end behind "See more")

Real instructors, a finished project every class, help in minutes. Locked in at $49 for life. Start tonight.

(108 characters. The live page truncates at about 120 on a phone. The 200-family cap is on the
cover and in the price callout, so the description spends its space on proof, price and urgency.)

## Badges (Show badges on, exactly three, custom icons)

Circle lets each badge and benefit use an uploaded 280 x 280 image instead of an emoji. The
on-brand set is in `brand/assets/checkout-icons/` (blue tile, white line icon).

1. `icon-calendar.png` New classes every week
2. `icon-chat.png` Coach answers in minutes
3. `icon-unlock.png` Pause or cancel anytime

Badge text colour: dark (#141A2A); background: the light option, so the blue tiles carry the colour.

## Price details: callout on the $49 monthly price

Callout text (Circle enforces 30 characters, this is 23): Pause or cancel anytime
Fallback if the editor refuses it: Pause or cancel any time (24).
Callout colour: #FFC245. Then use the price option's three-dot menu and choose **Highlight**:
Circle renders a highlighted callout as a filled badge in the callout colour with auto-contrast
text, which fixes the unreadable yellow-on-grey text of the plain callout. The 200-family cap
already appears on the cover and in the description, so the callout spends its 30 characters on
the two reassurances parents look for at the price: the rate, and that they can leave.
Leave "Reduced price" off (we never charged more) and "Countdown price lock" off unless a real
price rise is scheduled for a fixed date, in which case use the Date & time mode only.

## Benefits (Show benefits on, section title "Everything your kid gets for $49 a month", in
this order, each with its custom icon from `brand/assets/checkout-icons/`)

1. `icon-cap.png` **Real instructors, real credentials** — A former Microsoft product manager, a Google
   product marketer, a former Meta data scientist, IBM's own engineers. College-level material,
   taught so a 12-year-old gets it.
2. `icon-brain.png` **How AI actually works** — Short classes on what it is, where it gets things wrong, and
   how to use it well. Watch the first one together tonight.
3. `icon-tools.png` **A finished project every class** — A game, an app, a website, a chatbot, an AI agent
   and more. Things they can turn the laptop around and show you.
4. `icon-calendar.png` **New classes every week** — Members ask for the class they want next and vote on it.
5. `icon-chat.png` **Get Unstuck** — Stuck at 9pm? An answer in minutes, and a real person on our team reads
   every thread.
6. `icon-shield.png` **Safe by design** — No messaging between members. Parent consent at signup. Built for
   ages 11 to 17.
7. `icon-lock.png` **Locked in for life** — Join at $49 and it stays $49 every month, for as long as you're
   a member. Pause or cancel anytime.

Icon rules: the chat bubble belongs to Get Unstuck only. New classes gets the calendar, safety the
shield, the price lock the closed padlock, pause or cancel anytime the open padlock. No emoji, no film or
clapperboard icons anywhere. Regenerate the set with `node` from the snippet in
`docs/COWORK-BRIEFS.md` Brief 9 notes if a new icon is needed.

## Testimonials

Off until there are real, permissioned reviews. The checkout is a purchase page and should not
carry invented quotes.

## Keep in sync

- The cap (200) appears in the cover, the description, the callout and on the landing pages; the
  service's `FOUNDING_CAP` feeds the live "spots taken" bar. Change all of them together.
- The title (display name) is the paywall's name on receipts, in the checkout slug (see
  `CLAUDE.md`) and on every charge the Admin API reports. After renaming it, add the new name to
  `DEFAULT_PAYWALL_KEYS` in `src/chargeLoop.ts`, or Meta counts each sale twice and the founding
  counter misses new families.
- Every credential above is verified in `site/the-gap.html` and the research doc. Do not add
  names of companies the instructors have not worked for.
- Never write "no refunds" anywhere on the checkout. The terms carry the one gentle clause.
- The $1,332 "total value" stack lives on the landing pages only; Circle has no field for it
  that is not the "Reduced price" strikethrough, which we do not use.
