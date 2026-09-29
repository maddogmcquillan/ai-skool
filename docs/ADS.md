# Meta ads: campaign structure, copy and creative briefs

Audience: parents of 11 to 17 year olds in the United States, 25 and up. Never target under 18.
Landing page: https://joinlearnai.com (served by the service from `site/index.html`).
Per-ad-group pages: https://joinlearnai.com/ai-for-kids (`site/ai-for-kids.html`) for the
"most kids won't learn this in school / head start" ad set; add `site/<slug>.html` for the next.
Checkout: https://www.joinlearnai.com/checkout/founding-member. Price: $49 a month.
Prefix every campaign with `LAI -` so spend splits cleanly from the other business.

## Structure for launch (one campaign, three ad sets)

| Campaign | Objective | Ad set | Audience | Daily budget to start |
|---|---|---|---|---|
| LAI - Founding Members | Sales, optimise for Purchase (dataset Learn AI Web) | Broad | US, 25 to 55, Advantage+ audience on with parents as a suggestion | $50 |
| | | Interests | US, 25 to 55, interests: parenting, homeschooling, STEM education, coding for kids, Khan Academy, Outschool | $30 |
| | | Retargeting | Visitors of joinlearnai.com and www.joinlearnai.com in the last 30 days, excluding purchasers | $10 |

Rules of thumb: three to four ads per ad set, let each ad set exit learning (about 50 purchases)
before judging it, kill an ad whose cost per purchase is above $80 after $250 spent, scale the
winner by 20% every two days. Add a StartTrial or lead objective only if a free class is added.

## Angles, one ad each

1. **The maker angle.** Show the ten projects. Headline: "Your kid builds a game, an app and a
   chatbot this month." The proof is the list itself.
2. **The parent-trust angle.** No private messaging, an adult reads every thread, consent at
   signup. Headline: "An AI program built around kids, not adapted to them."
3. **The future-readiness angle.** Headline: "AI is the new typing. Give them a head start."
   Body about learning how it works, not just how to use it.
4. **The creator angle.** "We licensed the clearest AI teachers on the internet and put them in
   order." Name three creators.
5. **The founding-member angle.** "$49 a month, locked in for founding members. Cancel anytime."
   Use this one in retargeting.

## Primary text (parent-facing, under 125 characters before the fold)

- Your kid can build real things with AI this month: a game, an app, a website, a chatbot. No coding needed. Ages 11 to 17. $49/month, cancel anytime.
- Seventeen short classes, ten real projects, a coach that answers in minutes, and a community with no private messaging. Built for parents to trust.
- Most kids use AI. Few understand it. Learn AI teaches how it works, then has them build with it. From $49 a month. Founding rate locked in.

## Headlines (40 characters or fewer)

- AI classes for ages 11 to 17
- Build a game, an app, a chatbot
- Learn AI by building things
- A kids' AI program parents can trust
- Founding Member: $49/month, locked in

## Descriptions

- Cancel anytime. No member messaging. An adult reads every thread.
- 17 classes, 10 projects, weekly live build-along.

## Ready-made statics

`brand/generate.py` renders three static ads in 1:1, 4:5 and 9:16 (`brand/assets/ad-list-*`,
`ad-path-*`, `ad-trust-*`): the project list, the three-level path, and the parent-trust angle.
Upload all three sizes of each so Meta picks the right one per placement. Regenerate after any
price or copy change.

## Creative briefs (produce three formats per angle: 1:1, 4:5, 9:16)

1. **Project reel, 15 seconds, vertical.** Screen recordings of the ten projects being made, one
   per second, brand chips over each ("Make a game" ... "Make a comic"), end card with the
   headline and price. No faces needed. Music: upbeat, no lyrics.
2. **Parent voice, 30 seconds.** A parent-aged presenter (the owner works) on camera: "Here is
   exactly how this community is moderated." Three cuts to the Circle screens: Ask Coach with a
   reply, the rules post, the settings showing messaging off. End on the price.
3. **Static, the list.** Navy background, the ten project chips, one line: "Your kid builds all
   ten. $49/month." Use the brand generator (`brand/generate.py`) style.
4. **Static, the path.** Three columns Beginner / Intermediate / Projects with class names, small
   creator credits. Headline: "Seventeen classes, in the right order."
5. **Testimonial cards.** Only after real quotes exist. Never invent them.

## Compliance notes

- Describe the product, do not diagnose the viewer. "AI classes for ages 11 to 17", not "Is your
  teen falling behind?".
- No guarantees of outcomes. "Builds a game" is a class description; "will get into MIT" is not.
- The landing page must link to terms, privacy and the parents page (it does).
- Keep the Meta dataset for Learn AI separate from any other business's pixel.

## Primary text for the "head start" ad set (modeled on a BrightChamps ad the owner liked)

The 92 million figure is the World Economic Forum Future of Jobs Report 2025 (jobs displaced by 2030; the same report counts 170 million created). The 85 million in the BrightChamps ad is the 2020 edition. Bold lines use Unicode math-bold characters because Meta primary text has no formatting.

### Version A (full, mirrors the reference structure)

```
𝟗𝟐 𝐦𝐢𝐥𝐥𝐢𝐨𝐧 𝐣𝐨𝐛𝐬 𝐰𝐢𝐥𝐥 𝐛𝐞 𝐫𝐞𝐩𝐥𝐚𝐜𝐞𝐝 𝐛𝐲 𝐀𝐈, 𝐚𝐧𝐝 𝐨𝐮𝐫 𝐤𝐢𝐝𝐬 𝐚𝐫𝐞 𝐧𝐨𝐭 𝐫𝐞𝐚𝐝𝐲. 📉🤖

The workforce is shifting fast, and school isn't keeping up. Kids don't learn this in school. AI isn't a toy or a cheat code. It's the tool every job they'll ever have will be built on. Learn AI takes your kid from passive user to active builder: they learn how AI actually works, then use it to make a game, an app, a website, a chatbot and more. 🚀✨

Give them the head start before the future leaves them behind.

𝗪𝗵𝘆 𝗽𝗮𝗿𝗲𝗻𝘁𝘀 𝗰𝗵𝗼𝗼𝘀𝗲 𝗟𝗲𝗮𝗿𝗻 𝗔𝗜:

✅ Real Instructors: College-level material, taught so a 12-year-old gets it.

✅ Build, Don't Just Scroll: Projects they actually finish. No coding needed.

✅ Help in Minutes: A coach that answers any day, with a real person reading every thread.

✅ New Classes Every Week: The program grows as fast as the tools do.

🔑 𝐅𝐨𝐮𝐧𝐝𝐢𝐧𝐠 𝐫𝐚𝐭𝐞 𝐟𝐨𝐫 𝐭𝐡𝐞 𝐟𝐢𝐫𝐬𝐭 𝟐𝟎𝟎 𝐟𝐚𝐦𝐢𝐥𝐢𝐞𝐬. 𝐄𝐧𝐫𝐨𝐥𝐥 𝐧𝐨𝐰! 👇
```

### Version B (short)

```
𝐊𝐢𝐝𝐬 𝐝𝐨𝐧'𝐭 𝐥𝐞𝐚𝐫𝐧 𝐭𝐡𝐢𝐬 𝐢𝐧 𝐬𝐜𝐡𝐨𝐨𝐥. 𝐀𝐧𝐝 𝟗𝟐 𝐦𝐢𝐥𝐥𝐢𝐨𝐧 𝐣𝐨𝐛𝐬 𝐚𝐫𝐞 𝐚𝐛𝐨𝐮𝐭 𝐭𝐨 𝐜𝐡𝐚𝐧𝐠𝐞. 📉🤖

Most kids use AI. Almost none understand it. Learn AI teaches ages 11 to 17 how it actually works, from real instructors, then has them build with it: a game, an app, a website, a chatbot and more. 🚀

Give them the head start before the future leaves them behind.

✅ College-level material, taught so a 12-year-old gets it
✅ Projects they finish, no coding needed
✅ A coach that answers in minutes, a person reads every thread
✅ New classes every week

🔑 𝐅𝐨𝐮𝐧𝐝𝐢𝐧𝐠 𝐫𝐚𝐭𝐞 𝐟𝐨𝐫 𝐭𝐡𝐞 𝐟𝐢𝐫𝐬𝐭 𝟐𝟎𝟎 𝐟𝐚𝐦𝐢𝐥𝐢𝐞𝐬. 𝐄𝐧𝐫𝐨𝐥𝐥 𝐧𝐨𝐰! 👇
```

Headline options (40 chars): "AI For Kids: Build Real Things with AI" / "Give them the head start with AI" / "Kids don't learn this in school". Description: "Real instructors. New classes every week." Landing page: https://joinlearnai.com/ai-for-kids
