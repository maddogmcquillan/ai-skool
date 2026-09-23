# Knowledge base for the answer bot

Drop Markdown files here. The bot reads every `*.md` file (except this README) when it starts,
splits them by `##` headings, and searches them to answer member questions.

Conventions:

- `00-*.md` files are **pinned**: their full text is always given to the model. Keep them short.
  Use them for the community FAQ, house rules, and how the courses are organized.
- Everything else is retrieved by relevance. One file per lesson works best, named like
  `ai-foundations/01-01-what-ai-is.md`, with the lesson title as the `#` heading and
  the transcript or notes underneath. Split long transcripts into `##` sections.
- The bot only knows what is in this folder. If a lesson is not here, it will say the material
  does not cover it.

To reload without restarting the service:

```
curl -X POST -H "X-Hook-Secret: $HOOK_SECRET" https://your-service/admin/reload-knowledge
```
