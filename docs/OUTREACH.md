# Affiliate outreach machine (to build after the first ads run)

Goal: find creators who teach AI, coding or study skills to teens and parents, bring them in as
Learn AI affiliates, and onboard them, with no manual messaging. The owner only reviews.

## Pipeline

1. **Find.** YouTube Data API search on a fixed list of queries ("AI for kids", "ChatGPT for
   students", "coding for teens", "homeschool STEM"), filtered to channels with 5k to 500k
   subscribers and a video in the last 90 days. Same idea for TikTok and Instagram via their
   public pages where the terms allow. Store each candidate in a small table on the service.
2. **Enrich.** Pull the business email from the channel's about page where the creator publishes
   one, otherwise the contact form URL. No scraping of private data, no guessed addresses.
3. **Reach out.** A three-step email sequence from hello@joinlearnai.com through a transactional
   sender with the domain authenticated (Resend or Postmark): the offer ($49 per first sale, a
   dashboard, creator kit), a follow-up at day 4, a last note at day 10. Every email carries an
   unsubscribe link and a postal address (CAN-SPAM), and a reply or a click stops the sequence.
4. **Onboard.** A reply that says yes triggers the Circle affiliate invitation through the Admin
   API (`paywall_affiliates/invite`), then a welcome email with their link, the creator kit
   (`docs/ADS.md` angles, the statics, a 60-second talking-points sheet) and a 14-day check-in.
5. **Train and keep warm.** A monthly email with what is converting, new classes and their own
   numbers, generated from Circle's affiliate data.
6. **Review.** The owner sees a weekly digest: found, contacted, replied, joined, first sales.
   Anything a creator asks that the sequence cannot answer goes to the owner, not to a bot.

## Rules

- Only publicly listed business contacts. No DMs at scale on platforms that forbid it.
- Write like a person, one ask per email, no fake urgency.
- Stop after three touches. A "no" is stored and never contacted again.
- The service already has the Circle token and the sending domain; the new parts are the
  candidate table, the YouTube search, the sender integration and the sequence scheduler.
