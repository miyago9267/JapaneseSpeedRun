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

1. **Places it** — route by the four categories (see 「Vault 分類與自動筆記規則」below): fold into
   an existing page under `vault/basics|compare|examples|mistakes/` if it fits, else start a new
   `vault/<category>/<name>.md` mirroring an existing lesson's shape.
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
  - `basics/` 基礎・`compare/` 比較・`examples/` 實例・`mistakes/` 我的錯題 — four categories, one
    lesson per file (rules: 「Vault 分類與自動筆記規則」)
  - `study-method.md` — 學習方法 guide (stays at root, outside the four categories)
- `.vitepress/config.ts` — VitePress config (`srcDir: ./vault`, nav/sidebar, tabs plugin, local
  search). Holds the `obsidian_tabs` markdown-it rule that derives `::: tabs` from the comment
  markers at build time (see Content tone) — the source stays Obsidian-native.
- `.vitepress/theme/` — custom theme: `index.ts` (extends default + registers tabs) + `HomePage.vue`
  (home cards grouped by the four categories) + `custom.css`
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

## Vault 分類與自動筆記規則

`vault/` 分四個資料夾。Miyago 問什麼、貼什麼、答錯什麼，agent 依下表**自己判斷放哪、自動寫入**，
不用先問「要不要記」。

| 資料夾 | 分類 | 放什麼 | 何時寫入 |
|---|---|---|---|
| `vault/basics/` | 基礎 | 基本單字（功能詞 `vocabulary.md`；動詞／形容詞／名詞單字本 `basics/words/`）、動詞／形容詞／名詞活用、常用助詞、基本句型與動詞語法 | Miyago 問到基礎文法，或 agent 發現他基礎缺口時，補進對應專課；問到或背了**單一單字**時，記進 `basics/words/` 對應的單字本 |
| `vault/compare/` | 比較 | 近義詞・相近用法的區別（例：から vs ので、は vs が、と・ば・たら・なら） | 問「A 和 B 差在哪」或錯題暴露混淆時；一組比較一個檔，或併入既有比較頁 |
| `vault/examples/` | 實例 | Miyago 貼的真實素材（galgame、書、新聞截圖）的翻譯＋拆解；以及「中文生活用語 → 日文怎麼講」 | 他貼素材或問「這句日文怎麼講」時，答完自動記錄，不用問。依來源分檔：一部作品／一類來源一個檔，句號遞增（原文 → 翻譯 → 結構 → 片段表）；生活用語進 `examples/daily-phrases.md` |
| `vault/mistakes/` | 我的錯題 | agent 出題考他時答錯率高的點；他自己造句或中日互譯翻錯的地方（≠ 主動請教） | 出題後依答錯情況斟酌收錄；他造句／翻譯有錯時收錄：原句 ✗ → 正確 ✓ → 錯因 → 連到對應 basics／compare 專課 |

### 分流判斷

- **單一單字（問到或他在背）→ `basics/words/`**：依詞性記進 `verbs.md`／`adjectives.md`／`nouns.md`，
  欄位照該頁表頭：動詞標類型（五段／一段／不規則・自／他）＋ます形・て形・ない形；形容詞標 い／な ＋否定・過去・副詞化；
  名詞標能否 ＋ する。**不要記進 `examples/`**；單字在實例中出現時，單字本備註可連回實例。
- **請教用法（asking）→ `examples/`**：他問「這句什麼意思／這個怎麼講」，記進實例。
- **自己造句・翻譯的錯（own-production errors）→ `mistakes/`**：他寫出來或翻出來的東西錯了，記進錯題，
  格式 `原句 ✗ → 正確 ✓ → 錯因 → 連到專課`（`mistakes/my-pitfalls.md` 的「造句・翻譯錯誤」節）。
- 一件事兩邊都沾到（例：問了一句、之後造句又錯同一點）→ 兩邊各記一筆，互相連結，不要合併。
- **實例中冒出新文法點**：必須在對應的 `basics/` 或 `compare/` 頁補一條（或至少加連結），實例頁只留
  「這句怎麼拆」，規則本體放專課，避免同一規則散在多處。
- 截圖是 Miyago 挑「不會的句子」截的，不是連續原文；不要推論句與句之間的承接。

### `vault/minna/` — 教材追蹤線（不屬於上面四類）

《みんなの日本語》第2版的逐課文型檢查表（`index.md`・`shokyu-1.md`・`shokyu-2.md`），是**進度索引**，不是第五個內容分類。

- 格式：每課 `## 第N課` ＋ GFM task list，一個文型一行；Miyago 會用時把 `[ ]` 勾成 `[x]`（網站上 checkbox 唯讀，勾選在 Obsidian／直接改 md）。
- Miyago 說某點**不熟**、或造句／答題錯在該點時：agent 把說明補進 `basics/` 或 `compare/` 專課（本體規則只放那裡），自己造句錯的另記 `mistakes/`；`minna/` 該行保留並連到專課（` → [專課](../basics/xxx.md)`）。
- **絕不抄課本**：只放文型名稱，例句一律自編；不收本文・例文・練習・會話・單字表。
- 課次歸屬依記憶整理，不確定的標 `⚠待對照`；Miyago 拍目次後再校正。
- 中級 I・II **只依 Miyago 提供的目次照片建立**，沒照片不憑記憶填。
- 新增課冊頁時照「寫入檢查清單」註冊 nav / sidebar，並加進 `deploy.yml` 的 verify 清單。

### 難度標記

網站涵蓋 N5–N1（Miyago 重考 N2，同時已在刷 N1 題）。**每個文法點・單字都要帶難度標記**，之後寫的新內容一律照此辦理。

| 標記 | 意思 | 例 |
|---|---|---|
| 〔N5〕…〔N1〕 | JLPT 級別 | ～ざるを得ない〔N2〕 |
| 〔約N2〕・〔N2〜N1〕 | 各家公認級別有爭議時，寫約略級別或跨級區間 | しいて〔N2〜N1〕 |
| 〔日常〕 | 日常口語，JLPT 不考（じゃん・ちゃう・てる・っす …） | 気にしてなかった〔日常〕 |
| 〔文言〕 | 文章語・文言殘留，出現在硬的文章・新聞・法律（～べし・～ざる・～ねばならぬ …） | 突如〔N1・文言〕 |
| 〔死語〕 | 過時・已淘汰，只見於舊作品或角色台詞 | ～でござる |

- 標記可組合：〔N1・文言〕、〔N2・日常〕（前者是文法點本身的級別，後者是它的口語變體）。
- **一律用全形 〔〕 當純文字，不要包 backtick**（backtick 是藍色 rule chip，標記不是規則）。
- 位置：緊接在文法點／單字後面；表格有「級」欄就放那一欄（新增一欄時，每一列都要補，欄數要一致）。
- 單字本（`basics/words/`）表格固定有「級」欄，新背的字照加。
- 不確定的級別用〔約Nx〕，並在回覆中列出請 Miyago 確認，不要自己默默拍板。
- Frontmatter 每頁加 `level:` 清單，例：`level: [N4, N3]`。跨很多級就列範圍；教材追蹤線 `minna/shokyu-1` → `[N5]`、`shokyu-2` → `[N4]`；純日常口語頁可寫 `[日常]`。首頁 `index.md`（只有 layout）免。`tags:` 只在該頁本來就有 N 級 tag 時才同步，不要另外亂加。

### 寫入檢查清單

1. 新頁面一律要有 frontmatter（`title / aliases / tags / level / type`），內容照「難度標記」標級別。
2. 新頁面要在 `.vitepress/config.ts` 的 nav + sidebar 註冊，放進對應分類群組；必要時加首頁卡片。
3. 跨資料夾連結用相對路徑（`../compare/wa-ga.md`），同資料夾直接 `x.md`；不寫 root-absolute。
4. `bun run docs:build` 必須通過，才 commit + push `main`。
5. 日文（假名・活用・furigana・語感）一律交回 Miyago 確認；不確定的地方在回覆裡明講，不要自己默默拍板。

Practice session 的出題風格（JLPT track / 日常 track）見 `CLAUDE.md`，這裡不重複。

## Adding / editing a lesson

1. Add or edit `vault/<category>/<name>.md` (frontmatter: `title / aliases / tags / level / type`; label every point per 「難度標記」). Mirror
   an existing lesson's shape.
2. Register it in `.vitepress/config.ts` (nav + sidebar, under its category group) and, if it
   deserves a home card, in `.vitepress/theme/HomePage.vue`.
3. `bun run docs:dev` to preview, `bun run docs:build` to produce `.vitepress/dist/`.

Because `vault/` is also the Claude/Obsidian vault, write **Obsidian-native** markdown: plain GFM
tables, `> [!WARNING]` alerts, `<!-- tabs:start/end -->` + `## Label` for tabs, relative `(other.md)`
links (between categories: `../compare/wa-ga.md`; same folder: `x.md`). The VitePress build derives the site-only syntax — never hand-write VitePress-only
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
