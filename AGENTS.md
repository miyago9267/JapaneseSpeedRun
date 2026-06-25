# AGENTS.md — JapaneseSpeedRun

Runtime-agnostic guide for any AI working on this repo. `CLAUDE.md` imports this file.
For human-facing setup (layout, how-to, nginx commands) see `README.md` — do not duplicate it here.

## What this is

A static site of Japanese-learning notes, organized by topic, built with Claude for fast
review ("speedrun"). Served directly by local nginx at `jlpt.miyago9267.com`. No build step,
no framework, no JS dependencies — plain HTML + a tiny vanilla manifest/render layer.

## Two representations of the same content

The same lesson content lives in two layers — keep them in sync when content changes:

- **`site/`** — the web layer. Rich, interactive HTML (tabbed views, color-coded cards). This
  is what nginx serves. `raw/` holds the standalone HTML drafts that `site/notes/` derives from.
- **`vault/`** — the teaching-material layer. Clean markdown of the same content, Obsidian-
  compatible, meant to be referenced by Claude Desktop via a filesystem MCP server (see
  `docs/claude-desktop.md`). Markdown reads far better for an LLM than the styled HTML.

There is no generator between them yet — they are maintained as parallel artifacts. If you
change a lesson's content, update both `site/notes/<cat>/<name>.html` and the matching
`vault/<name>.md`. Presentation-only changes (styling, tabs) stay in `site/` only.

## Content tone — this is the important part

Notes are **scannable comparison tables, not prose**. Optimize for "glance and recall the
rule," not for reading. Each note follows the lesson-1 pattern in
`site/notes/verb/conjugation.html` — copy its shape exactly:

- One **conjugation/usage form per card** (`.block`), each with a distinct colored header
  (`.c1`…`.c9`). One topic = one page of stacked cards.
- Inside each card: a 3-column table — **類型 / 規則 / 例子** (type / rule / examples).
- **規則** is a口訣-style chip (`.rule`, blue pill): terse, formula-like
  (e.g. `字尾 → a段 ＋ ない`, `い → くない`). State the mechanical transform, nothing more.
- **例子**: lead example with the changing part wrapped in `<strong>`; extra examples go in
  `.ex` (small grey). Kanji gets furigana in full-width parens, e.g. `難しい（むずかしい）`.
- Exceptions / traps → `.warn` (yellow callout, lead with `⚠`). Wrong forms → `.err` (red)
  marked `✗`, correct marked `✓`.
- Explanations: Traditional Chinese, casual and dense; keep Japanese terms in Japanese.
  Short, no long paragraphs. Use the full-width middle dot `・` and slash `／` as the raw notes do.

## Conventions

- **`site/manifest.js` is the single source of truth** for the catalog. A note does not exist
  to the index until it has a manifest entry.
- New note: copy `_templates/note.html` → `site/notes/<category>/<name>.html`. It must link
  `/assets/note.css` + `/assets/note.js` (these inject the sticky "← back home" bar) and keep
  `body { padding: 32px 20px }` — the bar's negative margins are aligned to that exact padding.
- Each note carries its own inline `<style>` (the comparison-table styleset). Reuse the
  existing block, extend color classes (`.c1`…) as needed; add `.err` when a note has a trap table.
- Then add a `lessons` entry under the matching category in `manifest.js`
  (`{ title, desc, path, tags }`). New topic → add a category object (`{ id, title, desc, lessons }`).
- Reload to see changes — there is no build.

## Raw → lesson workflow

Source drafts live in `raw/`. Converting a raw draft into a published lesson means:
integrate it into the site (note.css/note.js links, viewport meta, inline style with the
shared styleset), give each card a distinct sequential color, then register it in the manifest.
Keep the raw author's content faithful — don't pad it with extra forms; this is a speedrun.

## Guardrails

- nginx config: `/etc/nginx/domains/miyago9267.com/jlpt.conf` (wildcard cert, port 80→443).
  Reload needs root — AI must not `sudo`; hand `sudo nginx -t && sudo systemctl reload nginx`
  to Miyago.
- Don't introduce a build step, bundler, or runtime dependency. The whole point is plain files
  nginx can serve as-is.
- Verify Japanese content (kana, conjugation, furigana) before publishing; it's a learning aid.
