---
name: listen
description: 日文聽力練習（JLPT N2 聴解風格）：用本機語音念題，Miyago 只靠耳朵作答，批改後附假名原文，錯題記進 vault/mistakes 並推上去。Mac 用 say、Windows 用 SAPI。另有「網頁聽力包」：build-pack.ts 產生 mp3 與網站頁面（手機可聽），Miyago 回報「聽力 pack-0X 錯 3、7」時走回報流程。觸發：/listen、聽力、聴解、念給我聽、練聽力、聽力包、聽力 pack
---

# 聽力練習（聴解）

規則來源：`AGENTS.md`（分類、格式、build、deploy）與 `CLAUDE.md`「Practice session style」。本檔只寫流程；收尾與錯題格式沿用 `.claude/skills/quiz/SKILL.md`。

## 0. 參數與優先順序

- 預設 5 題。Miyago 可指定題數或題型（「只練即時応答」「出 3 題課題理解」）。沒指定就直接開考。
- 現階段是 N2 考前衝刺，聽力是最優先的科目。題型比例：即時応答 約 7 成、課題理解／ポイント理解 約 3 成；概要理解・統合理解只在 Miyago 指定時出。
- 偏重的內容：口語縮約（なきゃ・なくちゃ・ちゃう・とく・てる）、敬語與謙讓語的回應、授受表現、慣用回應（〜ところだった、〜わけないでしょ、それはないよ）。可從 `vault/mistakes/`、`vault/basics/grammar/`、`vault/compare/` 近期內容挑點。

## 1. 播放

一律用專案腳本，不要把文字寫成 heredoc 給 `say`：

```bash
bun .claude/skills/listen/speak.ts "A: もう八時だよ。" "1. じゃ、そろそろ出ないと。" "2. ..." "3. ..."
```

- `A:`／`B:` 前綴切換兩種聲音，前綴本身不念；選項用 `1.` `2.` `3.` 開頭，照原樣念出。
- 「再一次」→ 用同樣參數重播；「慢一點」→ 加 `--slow`。
- 播放前提醒戴耳機（第一題前說一次就好）。
- 腳本 exit 2 表示沒有日文語音：把錯誤訊息裡的安裝路徑轉告 Miyago，改成把題目用假名打出來當閱讀版，並註明這題不算聽力。

## 2. 題型

- **即時応答（問題4 風格）**：念一句話，接著念三個回應選項。**畫面上不顯示任何日文**，只寫「第 N 題，即時応答，請選 1–3」。
- **課題理解／ポイント理解（問題1・2 風格）**：先用中文給情境和提問，選項以日文印在畫面上（真實考試也是這樣），再播一段 A／B 對話（4–8 句），最後重念提問。
- 每題標 **JLPT track** 或 **日常 track** 與難度〔N5〕〜〔N1〕。說明、提示、批改一律繁體中文。

## 3. 流程（一次一題）

1. 出題 → 播放 → 停下等作答。答案揭曉前不要露出原文。
2. 批改：
   - 對／錯，一句話點出關鍵的那個音或表現（例：「なきゃ」＝ なければ，不是否定過去）。
   - 附原文：每句先寫漢字，讀音用 `漢字（かな）`（對話裡不渲染 ruby，不要用 `{漢字|かな}`），下一行寫全假名，再一行中文翻譯。ruby 只用在寫進 vault 的錯題。
   - 有對應專課就連過去（先 Glob 確認路徑）。
3. 答錯時請 Miyago 看著假名跟念一次，再用原速重播一次，然後才出下一題。
4. 全部結束後總結：對幾題、聽漏的類型（縮約／敬語／數字時間／否定與條件 …），以及下次的重點。

## 4. 記錄錯題

- 答錯的題寫進 `vault/mistakes/my-pitfalls.md` 的 `## 聽力錯題` 節（沒有這節就在檔尾新增）。
- 每筆格式：`聽到的句子（ruby＋全假名）✗ 選了什麼 → 正解 ✓ → 錯因（聽漏哪個音／不懂哪個表現）→ 連到專課`，附難度標記。
- 錯因暴露出 vault 沒有的文法點時，照 `AGENTS.md` 補進對應的 `basics/` 或 `compare/` 專課。

## 5. 收尾

照 `quiz` skill 的「5. 收尾」：`bun run docs:build` 通過 → 只 `git add` 本次改動的檔案 → commit `feat(vault): listen YYYY-MM-DD 聽力錯題收錄`（不加 AI attribution）→ `git push origin main`。
開始前先 `git pull --ff-only`，因為 Mac 和 Windows 兩台都會寫入 vault。

## 6. 網頁聽力包（手機可聽）

Miyago 離開電腦時用手機練：一包 10 題（即時応答 7＋課題理解／ポイント理解 3），音檔放在網站 `vault/listening/`。

- 內容在 `.claude/skills/listen/packs/pack-NN.json`（單一來源）；`build-pack.ts` 讀它，同時產生 `vault/listening/audio/pack-NN/qNN.mp3` 和 `vault/listening/pack-NN.md`。**要改題目改 JSON 再重跑，不要直接改產生的 md。**
- 自編題，不抄官方・市售教材。題材照第 0 節偏重（縮約・敬語・授受・否定條件・數字時間・慣用回應），並標 `JLPT`／`日常` track 與難度〔N?〕。
- JSON 欄位見 `build-pack.ts` 檔頭註解。日文一律寫 ruby `{漢字|かな}`（數字・時間也要，例如 `{三時半|さんじはん}`），腳本會自動導出 TTS 文字、全假名行與頁面原文；漢字沒包 ruby 會報錯。每題要有 `zh`（中文翻譯）和 `point`（重點，附 vault 專課連結，先 Glob 確認路徑；沒有專課就補一條進 `basics/` 或 `compare/`）。
- 干擾選項要「聽漏才會選到」（同音・數字・肯定否定・主體互換），不要出模稜兩可、兩個都能回的選項。

**新增一包：**

1. 複製既有 `packs/pack-NN.json` 當樣板，寫 `pack-(NN+1).json`。
2. `bun .claude/skills/listen/build-pack.ts .claude/skills/listen/packs/pack-NN.json`。TTS 預設 `edge-tts`（神經語音：A ＝ Nanami 女、B ＝ Keita 男；PATH、`uvx edge-tts`、`python -m edge_tts` 依序找）；連不上時在 Windows 自動退回 SAPI Haruka（B 以 ffmpeg 降調區分），也可用 `--engine sapi|edge` 指定。`--only 3,5` 只重做指定題的音檔。
3. 註冊：`.vitepress/config.ts` nav＋sidebar 的「聽力練習」群組、`vault/listening/index.md` 題包表、`HomePage.vue` 首頁卡片、`.github/workflows/deploy.yml` verify 清單加 `listening/pack-NN.html`。
4. `bun run docs:build` 通過，檢查 `.vitepress/dist/listening/pack-NN.html` 裡每個 `<source src>` 都對得到 `dist/assets/` 的檔案；`ffprobe` 抽驗一個 mp3 長度。
5. 只 `git add` 本次檔案（packs JSON・`vault/listening/` 音檔與頁面・註冊到的檔案）→ commit `feat(vault): listening pack-NN 聽力包`（不加 AI attribution）→ `git pull --rebase origin main` → `git push origin main`。
6. 日文（假名・活用・語感）交回 Miyago 確認，把最沒把握的句子列出來。

## 7. 回報流程（「聽力 pack-0X 錯 a、b」）

Miyago 在手機上聽完後會說「聽力 pack-0X 錯 3、7」（沒說題號就問一次；全對就簡短肯定並問要不要出下一包）。

1. 讀 `vault/listening/pack-0X.md`（或 `packs/pack-0X.json`），取出那幾題的題型・原文（ruby）・全假名・中文・選項與正解・`重點`。**不要重新念或猜**，以頁面為準。
2. 每個錯題寫進 `vault/mistakes/my-pitfalls.md` 的 `## 聽力錯題` 節，沿用該節既有格式（見第 4 節）：

   ```markdown
   ### YYYY-MM-DD pack-0X 第N題 即時応答〔N2〕：一句話概括錯因

   - 聽到：原文（ruby）（全假名）
   - 作答：✗ 不知道選了哪個就寫「第 N 題錯，沒說選哪個」；有說就寫選項內容
   - 正解：✓ 正解選項（ruby）（中文）
   - 錯因：聽漏哪個音・不懂哪個表現（引用該題 `重點`，用自己的話補一兩句）
   - 專課：[專課名稱](../basics/grammar/xxx.md)
   ```

   同一個點已經在節內出現過 → 不要新增，在原條目補「再犯日期」。課題理解題的「聽到」寫關鍵那幾句，不用整段對話。
3. 錯因暴露 vault 缺的文法點 → 依 `AGENTS.md` 補進對應的 `basics/` 或 `compare/` 專課。
4. 聊天裡簡短說明：每題一兩行（聽錯的是什麼・正解為什麼是它），最後點出這批錯題的共同類型（縮約／敬語／數字／否定條件），以及下一包要加強什麼。
5. 收尾照第 5 節：`git pull --ff-only` → `bun run docs:build` 通過 → 只 `git add` 本次改動的檔案 → commit `feat(vault): listen pack-0X 聽力錯題收錄` → `git push origin main`。

## 隱私

- 任何考試成績（總分、分項）都不准寫進 repo 內的檔案；repo 是公開的，網站也是。
