# Branding

Learn AI's look: deep navy ground, electric blue as the brand color, a warm "spark" accent, and a
rising constellation motif that says "learning path". Display type is Outfit, body type is
Manrope. Every asset is generated, not hand-drawn, so it can be regenerated in one command when
the name, colors, or copy change.

| Token | Value | Used for |
|---|---|---|
| Navy | `#0B1220` | cover and banner ground |
| Blue | `#3B7BFF` | Circle brand color (light theme), links, buttons, Classroom accent |
| Blue, dark theme | `#7FA8FF` | Circle brand color (dark theme) |
| Spark | `#FFC245` | logo mark, Course Requests, Live Sessions |
| Violet | `#9B7BFF` | Ask Coach |
| Mint | `#4FD1B3` | Parent Hub |
| Coral | `#FF7A59` | Show and Tell |

## What `npm run brand` applies through the API

- Community brand color and button text color, light and dark.
- Each space: emoji, wide cover image (1600x500), mobile thumbnail (800x450), pinned-posts label,
  default view.
- Classroom: self-paced, lessons labelled "class", sections labelled "section", lesson thumbnails on.
- Cover images on the four pinned posts.

Assets live in `brand/assets/`. Regenerate them with the generator in `brand/generate.py`
(needs headless Chrome and the fonts in `brand/fonts/`).

## What you do by hand (about 20 minutes)

Circle's API has no fields for these. Files are in `brand/assets/`.

1. **Logo and community icon.** Settings → Theme (or Branding). Upload `logo-light.png` for light
   mode and `logo-dark.png` for dark mode (960x240, transparent). Upload `community-icon.png`
   as the community icon.
2. **Custom space icons.** For each space: open the space, click the dropdown beside its name →
   Customize → click the icon → Custom tab → Upload a file → pick the matching `icon-<slug>.png`
   (280x280). Do this for welcome, ask-coach, course-requests, parent-hub, classroom,
   show-and-tell, live-sessions. Until then the emoji set by the script is shown.
3. **Home page.** Circle's Home is configured in the community's Home settings (Eclipse: the
   Home item in the left nav → Customize). Set the welcome banner to `welcome-banner.png`
   (1680x600), pin the "Start here" post, and feature the Classroom, Ask Coach, and Show and
   Tell spaces in that order.
4. **Course directory banner.** Courses → three dots → Banner. Circle lays this out as a white text
   column on the left and an image on the right, so the image carries no headline. Turn the banner on
   for both the Logged in and Logged out tabs and fill in:
   Title: `Learn AI by building things.`
   Description: `Beginner AI. Intermediate AI. Then ten project classes: make a game, an app, a website, a chatbot, a song, a comic, and more.`
   Button text: `Start with class 1`, custom URL: the Classroom (`/c/classroom/`).
   Image: `course-directory-banner.png`; drag it so the blue badge sits in the middle
   (1279x680).
5. **Social preview.** Settings → SEO / Social sharing: `og-image.png` (1200x630).
6. **Theme.** Settings → Theme: default to light, allow members to switch. Check the brand blue on
   both themes.
7. **Sidebar order.** Drag spaces in the sidebar so Start Here reads Welcome, Ask Coach, Course
   Requests, Parent Hub; then Classroom; then Community.
8. **Lesson thumbnails.** `brand/assets/lesson-01-*.png` through `lesson-17-*.png` (800x450), one
   per class, numbered in order. In the Classroom, open each class in the editor and set its
   thumbnail to the matching file. The API has no thumbnail field for lessons.
9. **Post authorship.** Pinned posts are authored by the "Learn AI Team" account once
   `TEAM_AUTHOR_EMAIL` is set and `npm run provision -- --reauthor-posts` has run. The Coach and
   Team accounts get their avatars from `brand/assets/avatar-*.png` automatically.

## Reference points

Circle Academy and Circle Community, both visible in your sidebar, are the bar: custom icons per
space, a banner at the top of Home, a pinned orientation post, and covers on every space. After
the script and the eight steps above, Learn AI has the same set.
