# CLAUDE.md — JapaneseSpeedRun

Project tone, content conventions, and guardrails live in `AGENTS.md`. Read it first.

@AGENTS.md

## Claude-specific notes

- Single source of truth is `vault/**/*.md` (four category folders `basics/ compare/ examples/ mistakes/`; `basics/` has sub-folders `vocab/ grammar/ particles/ parsing/`
  plus root `index.md` / `study-method.md`; also the Claude Desktop / Obsidian teaching vault).
  Edit content there only; never hand-maintain a parallel HTML copy. Where things go and when to
  auto-record them: `AGENTS.md` → 「Vault 分類與自動筆記規則」.
- After editing a lesson: register it in `.vitepress/config.ts` if new, then `bun run docs:build`
  to regenerate `.vitepress/dist/`. `bun run docs:dev` for live preview. Pushing `main` lets CI
  build + deploy to GitHub Pages (`jp.miyago9267.com`).
- Furigana is ruby syntax `{漢字|かんじ}` (okurigana outside the braces: `{難|むずか}しい`; in table
  rows write `{漢字\|かんじ}`; bold/backticks wrap the whole token). Never write full-width-paren
  furigana `漢字（かんじ）`. Details: `AGENTS.md` → Content tone.
- Keep the markdown LLM-clean AND Obsidian-native: GFM tables, `<!-- tabs:start/end -->` + `## Label`
  (NOT `::: tabs`), `> [!WARNING]`, backtick rules, relative `(other.md)` links. VitePress-only
  syntax is derived at build by `.vitepress/config.ts`. Avoid heavy Vue/HTML — it doubles as
  teaching material an LLM reads.
- Low ceremony: small content edits don't need spec/TDD. Deploy is automatic on push to `main`
  (GitHub Pages); never `sudo`.

## Practice session style

- All drill instructions, explanations, and feedback in Traditional Chinese. Japanese appears only as
  the target-language content (example sentences, fill-in-the-blank items). Never use Japanese as
  the medium of instruction.
- Use longer sentences in examples — short isolated clauses are fine for introducing a rule, but
  drills should escalate to full-length natural sentences to build reading tolerance.
- Maintain two tracks, clearly labelled in each exercise:
  - **JLPT track**: exam-style phrasing, formal register, patterns that appear on JLPT N3–N2
  - **日常 track**: conversational, colloquial contractions (ちゃう・とく・じゃう etc.), natural
    spoken-Japanese register
- Prefer versatile examples that map onto real situations — avoid abstract or overly academic
  sentences. Multiple plausible contexts per grammar point where possible.
