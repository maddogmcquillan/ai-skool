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
5. **The founding-member angle.** "$49 a month, locked in for founding members. Pause or cancel anytime."
   Use this one in retargeting.

## Primary text (parent-facing, under 125 characters before the fold)

- Your kid can build real things with AI this month: a game, an app, a website, a chatbot. No coding needed. Ages 11 to 17. $49/month, pause or cancel anytime.
- Seventeen short classes, ten real projects, a coach that answers in minutes, and a community with no private messaging. Built for parents to trust.
- Most kids use AI. Few understand it. Learn AI teaches how it works, then has them build with it. From $49 a month. Founding rate locked in.

## Headlines (40 characters or fewer)

- AI classes for ages 11 to 17
- Build a game, an app, a chatbot
- Learn AI by building things
- A kids' AI program parents can trust
- Founding Member: $49/month, locked in

## Descriptions

- Pause or cancel anytime. No member messaging. An adult reads every thread.
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
   exactly how this community is moderated." Three cuts to the Circle screens: Get Unstuck with a
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

### Variation 2, "congratulations / start tonight" (modeled on a BrightChamps setup-reminder ad)

The "top 3%" line is a flattery device from the reference, not a measured figure; Version B says the same thing without a number. Class 1 ("What is AI?") is a five-minute concept video, so the copy says "under ten minutes" and points builders at the project classes, which go in any order.

#### Version A

```
𝐂𝐨𝐧𝐠𝐫𝐚𝐭𝐮𝐥𝐚𝐭𝐢𝐨𝐧𝐬! 𝐘𝐨𝐮'𝐫𝐞 𝐢𝐧 𝐭𝐡𝐞 𝐭𝐨𝐩 𝟑% 𝐨𝐟 𝐩𝐚𝐫𝐞𝐧𝐭𝐬 𝐢𝐧𝐯𝐞𝐬𝐭𝐢𝐧𝐠 𝐢𝐧 𝐭𝐡𝐞𝐢𝐫 𝐤𝐢𝐝'𝐬 𝐟𝐮𝐭𝐮𝐫𝐞 𝐰𝐢𝐭𝐡 𝐀𝐈. 🎉🤖

Here's the thing most parents get wrong: they sign their kid up, the laptop stays closed for a week, and the momentum is gone. The first ten minutes decide whether this sticks, so don't let a slow start hold back skills they'll use for the rest of their life. ⚠️📉

Good news: there is nothing to install. Every class runs in the browser, so your kid can start the night you enroll. Here's the 3-step setup so they dive straight in without a hitch. Grab any laptop or Chromebook, sit with them for Class 1 (it's under ten minutes, from a real instructor), and have them post their first question in Get Unstuck, where an answer comes back in minutes and a real person reads every thread. 🚀💡

⚡ 𝐆𝐞𝐭 𝐓𝐡𝐞𝐢𝐫 𝐒𝐞𝐭𝐮𝐩 𝐑𝐞𝐚𝐝𝐲 𝐀𝐧𝐝 𝐒𝐭𝐚𝐫𝐭 𝐓𝐡𝐞 𝐅𝐢𝐫𝐬𝐭 𝐂𝐥𝐚𝐬𝐬 𝐓𝐨𝐧𝐢𝐠𝐡𝐭! 👇
```

#### Version B

```
𝐂𝐨𝐧𝐠𝐫𝐚𝐭𝐮𝐥𝐚𝐭𝐢𝐨𝐧𝐬! 𝐘𝐨𝐮'𝐫𝐞 𝐨𝐧𝐞 𝐨𝐟 𝐭𝐡𝐞 𝐟𝐞𝐰 𝐩𝐚𝐫𝐞𝐧𝐭𝐬 𝐠𝐞𝐭𝐭𝐢𝐧𝐠 𝐭𝐡𝐞𝐢𝐫 𝐤𝐢𝐝 𝐚𝐡𝐞𝐚𝐝 𝐰𝐢𝐭𝐡 𝐀𝐈, 𝐧𝐨𝐭 𝐣𝐮𝐬𝐭 𝐥𝐞𝐭𝐭𝐢𝐧𝐠 𝐭𝐡𝐞𝐦 𝐬𝐜𝐫𝐨𝐥𝐥. 🎉🤖

Most kids who quit a program quit in week one, because starting felt like homework. ⚠️ With Learn AI there's nothing to install and nothing to schedule. Any laptop or Chromebook works, Class 1 is under ten minutes with a real instructor, and the project classes go in any order, so they can start building a game on night one. Stuck at 9pm? Get Unstuck answers in minutes, and a person reads every thread. 🚀

Founding rate for the first 200 families, locked in for as long as you stay.

⚡ 𝐒𝐭𝐚𝐫𝐭 𝐓𝐡𝐞𝐢𝐫 𝐅𝐢𝐫𝐬𝐭 𝐂𝐥𝐚𝐬𝐬 𝐓𝐨𝐧𝐢𝐠𝐡𝐭! 👇
```

### Variation 3, "8 in 10" (story ad for the classroom statics)

Primary text for the statics whose headline is "More than 8 in 10 students say no teacher has taught
them how to use AI". The story: kids already use it, nobody taught them, teachers were never shown
either, a parent names the gap, Learn AI is the in-between, learn the basics together, then build.
Sources: 86% / one in four (Common Sense Media, 2026); more than 8 in 10 (RAND, 2025); fewer than
1 in 5 teachers given formal guidance (Gallup and Walton Family Foundation, 2,069 teachers, Feb to
Mar 2026: 18%). An earlier draft used "only 1 in 4 teachers were taught what AI is"; that figure
could not be verified against EdWeek and was dropped. The parent quote is a Reddit post
(r/homeschool, Sept 2026), attributed to "one parent", never presented as a Learn AI member. Says
"some of the best AI instructors online", not "partnered with", because the classes embed their
published courses. The closing scarcity is the founding rate, which is true; "classes are filling
up" is not something a self-paced membership can say.

For a single-age ad set, swap the turning line: "It's where your high schooler learns how AI
actually works..." or "It's where your middle schooler learns how AI actually works...".

Landing page: https://joinlearnai.com/the-gap (`site/the-gap.html`). It repeats the ad's stat in
the hero, then the gap, the parent quote, where to start, the projects, the teachers, screen time
and safety, the cost comparison and the founding offer. Tracking page id `the-gap`; pixel
`content_category` `lp-the-gap`.

```
86% of kids aged 9 to 17 already use AI. One in four uses it every day.

But more than 8 in 10 students say no teacher has ever taught them how to use it.

Why? It's not the teachers' fault. Fewer than 1 in 5 have been given any formal guidance on how AI should be used in class. It's hard to teach something you're still figuring out yourself.

So kids figure it out alone. They paste the homework into a chatbot, take whatever comes back, and never learn what's happening underneath.

One parent put it this way: "Everything I find online is either 'ban it completely' or 'let them use ChatGPT for homework.' Nothing in between that actually teaches kids how AI works."

That "nothing in between" is the gap. AI is changing faster than any curriculum can keep up with. Schools are writing rules, not teaching the skill. And most of us parents never learned it either.

Learn AI is the in-between.

It's where your middle schooler or high schooler learns how AI actually works, from some of the best AI instructors online, and then uses it to build real things.

The intro classes are short, so watch them together. What AI is, where it gets things wrong, how to use it well. Learn it side by side with your kid instead of hoping they figure it out.

Then they build, start to finish: a custom game, their own cartoon, a video made with AI, an AI agent that handles real tasks. Finished projects they can turn the laptop around and show you.

New classes every week, and members can ask for the class they want next. When they get stuck, a coach answers in minutes, and a real person reads every thread.

Start tonight. The founding rate is only for the first 200 families.
```

### Statics for the "8 in 10" ad set (same primary text, same landing page /the-gap)

All run with Variation 3 primary text and point at /the-gap. Every number is from
`docs/RESEARCH-AVATARS.md` 1.6 or 2.1. Parent quotes are real public posts: attribute them to
"a parent on Reddit" (or the forum), never to a username, never with invented upvote counts, and do
not reproduce Reddit's logo or exact interface. Kids in photos must read as 11 to 17.

| # | Headline on the image | Format |
|---|---|---|
| 1 | More than 8 in 10 students say no teacher has taught them how to use AI. | News-style over a classroom photo (the one already uploaded) |
| 2 | 86% of kids already use AI. Only 1 in 5 know how it works. | Two-number stat card, dark, source line small |
| 3 | Fewer than 1 in 5 teachers have been given any guidance on AI in class. | News-style over an empty-classroom or teacher's-desk photo |
| 4 | Your kids use AI. Nobody has taught them how. | Plain text on brand navy, yellow second sentence (matches the page hero) |
| 5 | "Everything I find online is either 'ban it completely' or 'let them use ChatGPT for homework.' Nothing in between." | Parent-post card, "a parent on Reddit, Sept 2026" |
| 6 | "No literacy, no warnings, no prep. Just 'work hard and climb the ladder.'" | Parent-post card, "a parent on Reddit, Sept 2025" |
| 7 | "I realized I had no idea how to actually explain it to him." | Parent-post card, kitchen-table photo behind, "a dad on Reddit, Mar 2026" |
| 8 | 64% of teens use AI chatbots. 51% of parents think theirs does. | Split stat card, teen on one side, parent on the other |
| 9 | They've been figuring out AI alone. | Phone-screen photo, kid alone at a laptop at night, text in the dark area |
| 10 | The AI class their school doesn't have. | Chalkboard or school-hallway photo, headline in chalk style |

### Headlines and description for the head-start ad set

Headline A (scarcity + offer): ⏳ 200 Founding Spots · Rate Locked In
Headline B (the funnel's closing line): 🚀 Give Them the Head Start 👉
Description (one, category line like the reference ads): Online AI Classes for Kids 11–17
Display link shows JOINLEARNAI.COM automatically. Both headlines are under 40 characters, the
description under 35, so nothing truncates in mobile feed.

## Card statics modeled on Outschool's "Is your kid obsessed with using A.I.?" ad (10 image prompts)

Reference: Outschool's card static (periwinkle background, white chunky headline with one phrase
in yellow, chalk underline and arrow, "Outschool's got a class for that!", white class card with
thumbnail, title, "For Ages 11-18" and a star rating). Each prompt below goes to ChatGPT with
that ad attached as the reference image. Rules kept in every prompt: ages 11 to 17, no star
rating or review count (we have no reviews yet; the yellow pill carries a true credential or
promise instead), no real instructor likenesses, every class title is a class in the catalogue,
every stat is from `docs/RESEARCH-AVATARS.md` Part 1.6. Same primary text as the "8 in 10" ad.
Landing page for all ten: `/classes` (`site/classes.html`), a class-page layout modeled on
Outschool's class page and Harvard's HDSR program page, opening on the ads' own line "Learn AI's
got a class for that." and listing every class the cards name.

Shared style block (pasted at the top of every prompt):

> Use the attached ad as the exact layout and style reference. Portrait 4:5, 1080 by 1350. Flat
> solid periwinkle-blue background, hex 6C63FF. Top half: a large centered headline in a chunky,
> rounded, extra-bold sans-serif like the reference, white, up to three lines, with the words in
> [brackets] set in warm yellow, hex FFC245 (remove the brackets). Under the headline, a
> hand-drawn white chalk-style underline that becomes a short down arrow pointing at the
> subheadline. Subheadline: one line, white, bold, about half the headline size. Bottom half: a
> white card with large rounded corners and a soft shadow, inset from the edges, containing from
> top to bottom: a landscape thumbnail with rounded corners filling the card width; the class
> title in black, bold, centered, up to two lines; a thin light-grey divider; a bottom row with
> "For Ages 11-17" in bold dark grey on the left and a small rounded yellow pill (hex FFC245,
> dark text) on the right. No star rating, no review count, no logos, no watermark, no faces of
> real people, and no text anywhere except the strings given. Render every string exactly as
> written, correctly spelled, large enough to read on a phone.

| # | Headline (yellow in brackets) | Subheadline | Class title | Pill | Thumbnail |
|---|---|---|---|---|---|
| 1 | Is your kid obsessed with using [A.I.]? | Learn AI's got a class for that! | How ChatGPT Actually Works | Taught by a Stanford mathematician | Laptop with a glowing chat window, small friendly orange robot peeking in, warm red-orange gradient like the reference |
| 2 | Your kid already uses [A.I.] Nobody taught them how. | Learn AI's got a class for that! | ChatGPT Power User in 30 Minutes | Watch it together tonight | Over-the-shoulder teen at a kitchen table at night, laptop chat window open, parent's mug in the foreground |
| 3 | 8 in 10 students say no teacher has taught them [A.I.] | Learn AI's got the class their school doesn't. | How ChatGPT Actually Works | New class every week | Empty school desk, stack of textbooks, a photocopied sheet headed "AI POLICY", a glowing laptop beside it |
| 4 | Your kid could build a [video game] with A.I. this week. | Learn AI's got a class for that! | Make a Game with AI | Taught by a pro game developer | Laptop showing a bright 2D platformer the kid made, kid's hand on the trackpad |
| 5 | Your 14-year-old can build an [A.I. agent]. Most adults can't. | Learn AI's got a class for that! | Make an AI Agent | Taught by an ex-Microsoft PM | Laptop with a clean agent dashboard: a to-do list being ticked off by a small robot icon |
| 6 | Same screen time. Except tonight they [made a cartoon]. | Turn screen time into skill time with Learn AI. | Make a Cartoon with AI | A finished project every class | Tablet showing three storyboard frames of an original cartoon character, crayons and a sketchbook beside it |
| 7 | From "can I have the iPad?" to ["look what I built."] | Learn AI's got a class for that! | Make an App with AI | Instructor teaches millions to code | Teen holding a phone up toward the camera showing a simple colourful app they built, face out of frame |
| 8 | Every answer online is "ban [A.I.]" or "let them cheat." | Learn AI is the in-between. | The Perfect ChatGPT Prompt Formula | Instructors from Google and Microsoft | Teen at a desk with a chat window on the laptop and their own handwritten notes and sketches in a notebook beside it |
| 9 | 71% of bosses would rather hire the kid with [A.I. skills]. | Learn AI's got a class for that! | AI Agents Fundamentals in 21 Minutes | Taught by an ex-Meta data scientist | Teen's desk, laptop split between a chat window and a finished presentation, notebook with a checklist |
| 10 | They could build a chatbot that [quizzes them] for Friday's test. | Learn AI's got a class for that! | Make a Chatbot with AI | Taught by an ex-Microsoft PM | Phone on a desk showing a chat: "Quiz me on chapter 4" and the bot's first question, textbook open beside it |

Source for 3: RAND, national student survey. Source for 9: Microsoft and LinkedIn Work Trend
Index 2024 (71% of leaders would rather hire a less experienced candidate with AI skills). Ask
ChatGPT for a 1:1 version of any winner by changing the first line to "Square 1:1, 1080 by 1080".
