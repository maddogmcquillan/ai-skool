# AI Skool on Circle

Launch tooling for an AI education membership for kids aged 11 to 17 (plus adult courses),
hosted on Circle (circle.so). Read `README.md` for the repo map and `docs/SETUP-RUNBOOK.md`
for the full configuration plan.

## Commands

- `npm install` then `npm test` (unit tests, no network) and `npm run typecheck`.
- `npm run provision:dry` prints what the Circle setup would create. Needs no token.
- `npm run provision` applies it through Circle's Admin API v2. Needs `CIRCLE_ADMIN_TOKEN`.
- `npm run dev` runs the webhook service locally (`GET /healthz`).

## Secrets and environment variables

Never ask for or paste tokens in chat. They live in the cloud environment's settings and are
read from the environment:

- `CIRCLE_ADMIN_TOKEN`: Circle Admin v2 API token (Business plan or above). Used by
  `scripts/provision.ts` and, when set on the deployed service, lets the bot post replies directly.
- `BOT_AUTHOR_EMAIL`: email for the "Coach" member account the bot posts as. `provision`
  creates the member when this is set.
- `ANTHROPIC_API_KEY`, `META_PIXEL_ID`, `META_CAPI_ACCESS_TOKEN`: only for the deployed service.

## When asked to set up or update the Circle community

1. Confirm `CIRCLE_ADMIN_TOKEN` is present in the environment. If it is not, say which variable
   is missing and stop; do not ask for the value.
2. Run `npm install`, then `npm run provision:dry` and read the plan.
3. Run `npm run provision`. It is idempotent: space groups and spaces match by slug, sections,
   lessons, tags, profile fields and pinned posts match by name or key. Re-running is safe.
4. Report what was created versus kept, and any step that logged `warn`.
5. Remind the owner of the steps the API cannot do (runbook sections 3, 6, 8, 9): Stripe and the
   paywall, the pixel snippets, Zapier, and the affiliate settings.

Edit `circle/structure.yaml` to change the community: structure, settings, tags, profile
fields, the bot member, and pinned post text all live there. Pinned posts are matched by title,
so after changing a post's body run `npm run provision -- --update-posts` to push the new text.

Lessons in the yaml carry a `youtube` id, a `creator` credit and a `description`; `provision`
creates them as published lessons with a YouTube embed (or a link if Circle rejects the embed
node) and marks lessons without a video as drafts. After editing lesson text run
`npm run provision -- --update-lessons`. `retired_spaces` / `retired_space_groups` list old
placeholders that `provision` deletes when it finds them.

The community's public name is **Learn AI** (the repo name "ai-skool" is historical).

## When asked to upload course videos

1. Requires `CIRCLE_ADMIN_TOKEN`, `circle/videos.yaml` (copy `circle/videos.example.yaml`), a
   Drive folder shared as "Anyone with the link", and `pip install gdown`.
2. Run `npm run provision` first so every lesson in the manifest exists.
3. Run `npm run upload-videos -- --dry-run` and check the mapping, then
   `npm run upload-videos -- --test-one`. Stop and ask the owner to open that lesson in Circle
   and confirm the video plays. Only then run `npm run upload-videos` for the rest.
4. The API cannot set a lesson's featured (top) video; the file lands in the lesson body. If
   the owner wants it as the featured video, they move it in the editor.

## Conventions

- TypeScript, ESM, Node 22. Imports use `.js` extensions.
- Keep `src/lib/eventId.ts` and `circle/paywall-thank-you-tracking.html` in sync; the test
  suite checks the hash parity.
- Commit messages: imperative subject, short body explaining why.
