# CLAUDE.md — JapaneseSpeedRun

Project tone, content conventions, and guardrails live in `AGENTS.md`. Read it first.

@AGENTS.md

## Claude-specific notes

- This is a low-ceremony static site: small, well-scoped edits (add a lesson, tweak a style,
  fix Japanese). No spec/TDD ceremony needed unless a change is genuinely structural.
- When adding a lesson, mirror `site/notes/verb/conjugation.html` exactly for tone and markup,
  then update `site/manifest.js`. Reload — there is no build step or test suite to run.
- Never `sudo`. nginx reload is Miyago's to run.
