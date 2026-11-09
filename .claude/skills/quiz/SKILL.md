---
name: quiz
description: 每日日文練習出題：依錯題、未勾選的大家的日本語文型與近期實例出題，一題一題考，批改後把錯的記進 vault/mistakes 並推上去。觸發：/quiz、出題、考我、每日練習、今天的題目
---

# 每日日文練習出題

規則來源：`AGENTS.md`（分類、格式、build、deploy）與 `CLAUDE.md`「Practice session style」（題目語言與兩條 track）。本檔只寫流程，不重抄規則；衝突時以那兩份為準。

## 0. 參數

- 預設 8 題。Miyago 可指定題數（「出 5 題」）或範圍（「只考助詞」「考 N1」），照指定執行。
- 沒指定就直接開考，不要先問。
- 現階段是 N2 考前衝刺：言語知識優先（文字讀音 ＋ N2 高頻文型的接續），読解不另外出題。聽力練習改用 `listen` skill。
- 開始前先 `git pull --ff-only`，因為 Mac 和 Windows 兩台都會寫入 vault。

## 1. 選題來源與比例

- 約一半（預設 4 題）：`vault/mistakes/my-pitfalls.md` 既有錯題的同類變化題（同文法點、換詞或換語境）。
- 其餘從以下抽：
  - `vault/minna/*.md` 中未勾選 `- [ ]` 的文型
  - `vault/basics/grammar/*.md`（含 `compound-verbs` 相關頁）
  - `vault/compare/*.md`
- 近期 `vault/examples/` 出現的文法點也可納入。
- 偏重最近內容：用 `git log --since="2 weeks ago" --name-only` 或檔案修改時間挑檔，不要整個 vault 全讀。
- 每題開頭標來源檔（相對路徑），方便批改時連結。

## 2. 題型與標記

- 題型輪替，不連續兩題同型：
  - 選擇題（JLPT 問題7 文法形式の判断 風格）
  - 重組題（★ 排序）
  - 中→日 翻譯
  - 日→中 拆解
  - 活用填空（給原型與目標型，例：`食べる → たら形`）
  - 讀音選擇（JLPT 問題1 漢字読み 風格：給漢字詞選讀法，專抓促音・長音・濁音・拗音陷阱，例：`発展` → はってん／はつてん／はってい／ほってん）；這題型不加 ruby
- 每題標 **JLPT track** 或 **日常 track**（依 CLAUDE.md），並標難度〔N5〕〜〔N1〕。
- 日文只出現在題目與例句，說明、提示、批改一律繁體中文。

## 3. 流程（一次一題）

1. 每次只出一題，列出題目後停下，等 Miyago 作答。不要一次把整組題丟出去。
2. 批改：
   - 標示 對／錯。
   - 給一句錯因。
   - 連到 vault 專課的相對頁面（例：`[て形](../basics/grammar/te-compound.md)` 之類，路徑以實際檔案為準，先 Glob 確認）。
3. 批改完再出下一題。
4. 全部結束後給總結：對幾題、弱點類別（依文法點或題型歸類），以及建議下次的重點。

## 4. 記錄錯題

- 答錯的題，或翻譯／造句錯的題，依 `AGENTS.md`「Vault 分類與自動筆記規則」寫進 `vault/mistakes/my-pitfalls.md`。
- 每筆格式：`原句 ✗ → 正確 ✓ → 錯因 → 連到專課`，附難度標記〔N?〕。
- 若錯在 `vault/minna/` 某文型：保持該項未勾（`- [ ]`），並在對應專課補一條說明。
- 全對的 minna 文型**不要自動勾**。收尾時問 Miyago 要不要勾，等他回答後才改。
- 日文正確性由 Miyago 確認；寫入時不要自己宣稱「已驗證」。

## 5. 收尾

1. 跑 `bun run docs:build`，必須通過。失敗就停下回報，不 commit。
2. 只 `git add` 本次實際改動的檔案（`vault/mistakes/my-pitfalls.md`、必要時的 minna／專課檔）。不要 `git add -A`，因為工作區可能有其他 agent 的未提交變更。
3. commit 訊息：`feat(vault): quiz YYYY-MM-DD 錯題收錄`（日期用當天）。不加任何 AI attribution。
4. `git push origin main`，推送後回報 commit hash。
5. 日文內容交回 Miyago 確認（假名、活用、furigana、語感）。

## 隱私

- 任何考試成績（總分、分項）都不准寫進 repo 內的檔案；repo 是公開的，網站也是。

## 備註

- 從手機透過 Remote Control 開的 session 也適用。session 跑在桌機上，寫入 vault 是即時的，不需要另外同步。
