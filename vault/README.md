---
title: 日文筆記 Vault
tags: [japanese, jlpt, moc]
type: index
---

# 日文筆記 Vault

跟 Claude 一起整理的日文學習筆記，markdown 版本。這個資料夾就是給 **Obsidian / Claude Desktop 引用的 note vault**——純內容、無樣式，方便當教材被讀取。同一份內容的網頁版在 `../site/`。

## 筆記清單

- [[verb-conjugation]] — 動詞變化型（五段／一段／不規則，含段位原理、肯定否定時制）
- [[adjective-conjugation]] — 形容詞變化型（い形 vs な形，含條件形 たら／ば／なら／と）

## 怎麼被 Claude Desktop 引用

把這個 `vault/` 資料夾掛給 Claude Desktop 當 filesystem MCP server，Claude 就能讀這些 markdown 當教材。設定步驟見 [`../docs/claude-desktop.md`](../docs/claude-desktop.md)。

## 給未來維護者

- 每篇 `.md` 是一個主題，frontmatter 記 `title / aliases / tags / type / source`。
- 內容若有更動，對應的網頁版 `site/notes/<category>/<name>.html` 也要同步（兩者是同一份內容的兩種呈現）。
- 用 `[[wikilink]]` 連結相關主題。
