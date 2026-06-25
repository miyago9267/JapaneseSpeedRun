# CLAUDE.md — JapaneseSpeedRun

Project tone, content conventions, and guardrails live in `AGENTS.md`. Read it first.

@AGENTS.md

## Claude-specific notes

- Single source of truth is `vault/*.md` (also the Claude Desktop / Obsidian teaching vault).
  Edit content there only; never hand-maintain a parallel HTML copy.
- After editing a lesson: register it in `.vitepress/config.ts` if new, then `bun run docs:build`
  to regenerate `.vitepress/dist/` (what nginx serves). `bun run docs:dev` for live preview.
- Keep the markdown LLM-clean: GFM tables, `::: tabs`, `> [!WARNING]`, backtick rules. Avoid
  heavy Vue/HTML in the md — it doubles as teaching material an LLM reads.
- Low ceremony: small content edits don't need spec/TDD. Never `sudo`; nginx reload is Miyago's.
