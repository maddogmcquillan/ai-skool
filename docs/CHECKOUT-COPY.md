# Checkout page copy (Circle paywall "Founding Member", Customization tab)

The live checkout is https://www.joinlearnai.com/checkout/founding-member. Circle's Admin API
cannot edit paywall customization, so these are pasted by hand: Circle admin > Paywalls >
Founding Member > Checkout tab > Customize (sidebar sections: Paywall cover image, Product
details, Badges, Benefits, Testimonials, Price details). Brief 9 in `docs/COWORK-BRIEFS.md` is
the paste-ready version for Claude in Chrome. The copy mirrors the ad landing pages
(`site/ai-for-kids.html`) so the click, the page and the checkout all say the same thing.

## Cover image

Upload `brand/assets/checkout-cover.png` (1080 x 606, renders at 540 x 303). It carries the
headline, the three heavy hitters, the founding cap and the locked-in price, so the text fields
below can stay short.

## Product details: title

Founding Member

## Product details: description

Give your kid the head start. Real instructors, new classes every week, and a coach that answers
in minutes. Founding rate for the first 200 families: $49/month, locked in for as long as you stay.

## Badges (Show badges on)

1. Founding rate · first 200 families
2. New classes every week
3. Coach answers in minutes
4. Ages 11 to 17
5. Cancel anytime

## Price details: callout on the $49 monthly price

Callout text: Founding rate · first 200 families (yellow). Leave "Reduced price" and "Countdown
price lock" off: we never charged a higher price, and a per-visitor countdown is fake urgency.
Price description (Pricing tab, if the field exists): Founding rate, locked in for life.

## Benefits (Show benefits on, in this order)

1. **Beginner-friendly AI classes** — College-level material, taught so a 12-year-old gets it.
2. **Project classes** — Make a game, an app, a website, a chatbot and more. No code required.
3. **New classes every week** — Chosen by member vote, from real instructors.
4. **Ask Coach** — Help in minutes, any day, with a person reading every thread.
5. **A safe, moderated space** — No messaging between members. Parent consent at signup.
6. **Your rate never goes up** — Join at $49 and it stays $49 every month, for as long as you're a member.

Removed from the old list: Show and Tell, the weekly live build-along, the Parent Hub line and
the adult courses. They still exist; they just are not what sells the membership.

## Testimonials

Off until there are real, permissioned reviews. The landing page's review cards are placeholders;
the checkout is a purchase page and should not carry invented quotes.

## Keep in sync

- The cap (200) appears in the cover, the description, the first badge, and on the landing
  pages; the service's `FOUNDING_CAP` feeds the live "spots taken" bar. Change all of them
  together.
- Never write "no refunds" anywhere on the checkout. The terms carry the one gentle clause.
