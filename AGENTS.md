# AGENTS.md — JapaneseSpeedRun

Runtime-agnostic guide for any AI working on this repo. `CLAUDE.md` imports this file.
Human-facing intro is in `README.md`.

## What this is

A VitePress site of Japanese-learning notes, built for fast review ("speedrun"). **Single
source of truth: markdown in `vault/`.** GitHub Actions builds it to `.vitepress/dist/` and
deploys to GitHub Pages at `jp.miyago9267.com` on every push to `main`. The same `vault/*.md` is
also the note vault that Claude Desktop / Obsidian reference as teaching material (see
`docs/claude-desktop.md`) — one source, two consumers (rendered website + LLM/Obsidian reading
the raw markdown).

## How this works — Miyago learns, the agent maintains

The whole point: **Miyago supplies the Japanese and judges whether it's correct; the agent owns
everything else — placement, formatting, structure, build, deploy.** Miyago should not have to
think about markdown syntax, tabs, links, the build, or DNS. He pastes raw material; he reviews
the 日文. That is the division of labour — keep it that way.

When Miyago drops raw material (a word list, a grammar point, example sentences), the agent:

1. **Places it** — fold into an existing `vault/<topic>.md` if it fits, else start a new
   `vault/<name>.md` mirroring an existing lesson's shape.
2. **Formats to the house style** (see Content tone) — comparison tables, rules in `backticks`,
   changing morpheme in **bold**, kanji furigana 難しい（むずかしい）, traps in `> [!WARNING]`,
   multi-view sections in `<!-- tabs:start/end -->` + `## Label`.
3. **Stays Obsidian-native** — GFM only, relative `(other.md)` links; no `::: tabs`, no heavy HTML.
4. **Wires a new lesson in** — frontmatter (`title / aliases / tags / type`) + register it in
   `.vitepress/config.ts` (nav + sidebar).
5. **Ships it** — `bun run docs:build` must pass, then commit and push `main`. CI re-builds, the
   verify-output gate runs, and only a green build deploys to Pages; a broken build never touches
   the live site.
6. **Hands the 日文 back to Miyago to confirm** — kana, conjugation, furigana, nuance. The agent
   never silently trusts its own Japanese; that review is Miyago's one job.

If a formatting/structure/tooling call is ambiguous, the agent decides and proceeds — it does not
pull Miyago back into tooling. The only thing that routinely needs Miyago is Japanese correctness.

## Layout

- `vault/` — markdown source = the pages AND the Claude/Obsidian vault. Keep it **pure markdown**.
  - `index.md` — home (hero layout)
  - `<topic>-conjugation.md` — one lesson per file
- `.vitepress/config.ts` — VitePress config (`srcDir: ./vault`, nav/sidebar, tabs plugin, local
  search). Holds the `obsidian_tabs` markdown-it rule that derives `::: tabs` from the comment
  markers at build time (see Content tone) — the source stays Obsidian-native.
- `.vitepress/theme/` — custom theme: `index.ts` (extends default + registers tabs) + `custom.css`
  (brand blue, Noto Sans TC, clean-paper light + dark theme split via CSS vars, table / rule-chip
  / callout styling)
- `package.json` — scripts `docs:dev` / `docs:build` / `docs:preview` (run with Bun)
- `docs/claude-desktop.md` + `claude_desktop_config.example.json` — wire the vault to Claude Desktop (filesystem MCP)
- `.github/workflows/deploy.yml` — CI: build + verify-output gate + deploy to GitHub Pages on push to `main`
- `vault/public/CNAME` — pins the `jp.miyago9267.com` custom domain (copied into `dist/` at build)

## Content tone — this is the important part

Notes are **scannable comparison tables, not prose**. Optimize for "glance and recall the rule."

- One lesson = one `.md`. For multi-view switching (按變化型 / 按詞類 / 肯定否定) wrap the views
  in `<!-- tabs:start -->` … `<!-- tabs:end -->` and start each view with a `## Label` heading.
  A markdown-it rule in `.vitepress/config.ts` rewrites this to VitePress tabs at build time; in
  Obsidian the comments are invisible and the `##` headings read as normal sections. **Do not
  write `::: tabs` / `== Label` directly** — that breaks Obsidian rendering.
- Internal links use relative markdown paths: `[形容詞變化型](adjective-conjugation.md)`. VitePress
  rewrites `.md` to clean URLs at build; Obsidian follows them natively. **Never** root-absolute
  `/adjective-conjugation` — Obsidian can't resolve it.
- The core unit is a markdown table (columns like **類型 / 規則 / 例**).
- **Rules go in `backticks`** → the theme renders inline code as a blue "chip" (the old `.rule`
  pill). Keep them terse and formula-like: `あ段 ＋ ない`, `い → くない`.
- Wrap the changing morpheme in **bold** in examples. Kanji gets furigana in full-width parens:
  難しい（むずかしい）.
- Exceptions / traps → GitHub alert `> [!WARNING]` (theme styles it amber, like the old `.warn`).
  Wrong forms marked ✗, correct ✓.
- Explanations: Traditional Chinese, casual and dense; Japanese terms stay in Japanese. Use the
  full-width middle dot `・` and slash `／` as separators.

## Adding / editing a lesson

1. Add or edit `vault/<name>.md` (frontmatter: `title / aliases / tags / type`). Mirror an
   existing lesson's shape.
2. Register it in `.vitepress/config.ts` (nav + sidebar).
3. `bun run docs:dev` to preview, `bun run docs:build` to produce `.vitepress/dist/`.

Because `vault/` is also the Claude/Obsidian vault, write **Obsidian-native** markdown: plain GFM
tables, `> [!WARNING]` alerts, `<!-- tabs:start/end -->` + `## Label` for tabs, relative `(other.md)`
links. The VitePress build derives the site-only syntax — never hand-write VitePress-only
constructs (`::: tabs`, root-absolute links) or heavy HTML/Vue in the source.

## Deploy

GitHub Actions deploys to **GitHub Pages** on every push to `main` (`.github/workflows/deploy.yml`):
`bun install --frozen-lockfile` → `bun run docs:build` → verify expected output → `deploy-pages`.
The `deploy` job needs `build`, so a failed build or missing output skips deploy — the live site is
never overwritten by a broken build. Custom domain `jp.miyago9267.com` is pinned by
`vault/public/CNAME` (copied into `dist/` at build); HTTPS is provisioned by GitHub. The repo does
not commit `dist/`. No nginx, no server, no sudo.

## Guardrails

- **Single source**: edit content in `vault/*.md` only. Do not reintroduce a parallel hand-
  maintained HTML copy — that dual-maintenance problem is exactly what VitePress removed.
- Keep the markdown **Obsidian-native** (it doubles as the teaching vault, edited in Obsidian):
  GFM tables, `> [!WARNING]`, `<!-- tabs:start/end -->` + `## Label`, relative `(other.md)` links.
  VitePress-only syntax (`::: tabs`, root-absolute links) is derived at build time by
  `.vitepress/config.ts`, never written by hand. Don't embed large Vue components in the md.
- Toolchain is Bun: `bun install`, then `bun run docs:build`. Commit `bun.lock`.
- Verify Japanese content (kana, conjugation, furigana) before publishing.
