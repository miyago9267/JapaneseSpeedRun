# 某人的日文筆記

跟 Claude 整理的日文學習筆記，同時是一個可以線上看的靜態網站。
反正是某個語言白癡為了考日檢做的學習日誌，連筆記都不算是（雙押喔齁）。

線上版：<https://jp.miyago9267.com>

## 這是什麼

單一來源是 `vault/` 裡的 markdown，它同時是兩種東西：

- VitePress 網站的頁面（build 後部署到 GitHub Pages）
- Obsidian / Claude Desktop 直接讀的筆記 vault（教材）

一份 markdown、兩種用途。寫法慣例與 AI 協作規則見 [`AGENTS.md`](AGENTS.md)。

## Layout

```text
vault/                       <- 唯一來源：markdown = 網站頁面 + Obsidian vault
  index.md                   <- 首頁（hero）
  <topic>-conjugation.md     <- 一課一檔
  public/CNAME               <- 綁定 jp.miyago9267.com
.vitepress/
  config.ts                  <- VitePress 設定（nav/sidebar、tabs、Obsidian 相容規則）
  theme/                     <- 自訂主題（clean-paper 亮色 + 暗色）
.github/workflows/deploy.yml <- CI：build + 驗證 + 部署到 GitHub Pages
```

## 新增 / 編輯一篇筆記

1. 編輯 `vault/<name>.md`（frontmatter：`title / aliases / tags / type`），照既有課的格式。
2. 若是新檔，在 `.vitepress/config.ts` 註冊（nav + sidebar）。
3. `bun run docs:dev` 本地預覽、`bun run docs:build` 產生 `.vitepress/dist/`。

寫法（比較表、rule chip、furigana、tabs、警告框）詳見 [`AGENTS.md`](AGENTS.md) 的 Content tone。
Markdown 要保持 Obsidian-native（它同時是 Obsidian vault）。

## 部署

push 到 `main` → GitHub Actions 自動 build + 驗證產物 + 部署到 GitHub Pages（`jp.miyago9267.com`）。
build 失敗就不會更新線上站，沒有手動步驟、不碰 server。

## 開發

```bash
bun install
bun run docs:dev      # 本地預覽
bun run docs:build    # 產生 dist/
```
