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

The AI class their school doesn't have.

(Not "Founding Member": the paywall's internal name is not a headline. Alternatives if Circle
truncates: "Real AI teachers for kids 11 to 17" or "Give them a real AI teacher tonight.")

## Product details: description (short enough that no "See more" appears)

Real instructors, a finished project every class, and a coach that answers in minutes. Founding
rate for the first 200 families, locked in for life. Your kid can start tonight.

## Badges (Show badges on, exactly three)

1. 📅 New classes every week
2. 💬 Coach answers in minutes
3. 🔓 Cancel anytime

## Price details: callout on the $49 monthly price

Callout text: Founding rate · first 200 families (yellow). Leave "Reduced price" and "Countdown
price lock" off: we never charged a higher price, and a per-visitor countdown is fake urgency.
Price description (Pricing tab, if the field exists): Locked in for life. Less than a family
dinner out.

## Benefits (Show benefits on, in this order, with these icons)

1. 🎓 **Real instructors, real credentials** — A former Microsoft product manager, a Google
   product marketer, a former Meta data scientist, IBM's own engineers. College-level material,
   taught so a 12-year-old gets it.
2. 🧠 **How AI actually works** — Short classes on what it is, where it gets things wrong, and
   how to use it well. Watch the first one together tonight.
3. 🛠️ **A finished project every class** — A game, an app, a website, a chatbot, an AI agent
   and more. Things they can turn the laptop around and show you.
4. 📅 **New classes every week** — Members ask for the class they want next and vote on it.
5. 💬 **Ask Coach** — Stuck at 9pm? An answer in minutes, and a real person on our team reads
   every thread.
6. 🛡️ **Safe by design** — No messaging between members. Parent consent at signup. Built for
   ages 11 to 17.
7. 🔒 **Locked in for life** — Join at $49 and it stays $49 every month, for as long as you're
   a member. Cancel anytime.

Icon rules: the chat bubble belongs to Ask Coach only. New classes gets the calendar, safety the
shield, the price lock the padlock. No film or clapperboard icons anywhere.

## Testimonials

Off until there are real, permissioned reviews. The checkout is a purchase page and should not
carry invented quotes.

## Keep in sync

- The cap (200) appears in the cover, the description, the callout and on the landing pages; the
  service's `FOUNDING_CAP` feeds the live "spots taken" bar. Change all of them together.
- Every credential above is verified in `site/the-gap.html` and the research doc. Do not add
  names of companies the instructors have not worked for.
- Never write "no refunds" anywhere on the checkout. The terms carry the one gentle clause.
- The $1,332 "total value" stack lives on the landing pages only; Circle has no field for it
  that is not the "Reduced price" strikethrough, which we do not use.
