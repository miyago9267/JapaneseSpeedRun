# 某人的日文筆記

跟 Claude 整理的日文學習筆記，本身可以被部署成一個靜態網站的部分。
反正是某個語言白癡為了考日檢做的學習日誌，連筆記都不算是（雙押喔齁）。

## Layout

```
site/                       <- nginx root
  index.html                <- 首頁，依分類列出所有筆記 + 即時搜尋
  manifest.js               <- 唯一資料來源：分類與筆記清單
  assets/
    site.css                <- 首頁樣式
    app.js                  <- 首頁渲染 + 搜尋邏輯
    note.css / note.js      <- 每篇筆記共用的「回首頁」頂欄
  notes/<category>/<name>.html
_templates/note.html        <- 新筆記模板（不對外 serve）
```

## 新增一篇筆記

1. 複製 `_templates/note.html` 到 `site/notes/<分類>/<檔名>.html`，把內容填進去。
2. 在 `site/manifest.js` 對應分類的 `lessons` 陣列加一筆：

   ```js
   { title: "標題", desc: "說明", path: "notes/<分類>/<檔名>.html", tags: ["標籤"] }
   ```

   分類不存在就在 `categories` 新增一個物件（含 `id` / `title` / `desc` / `lessons`）。
3. 重新整理頁面即可，沒有 build step。

## Nginx

設定檔：`/etc/nginx/domains/miyago9267.com/jlpt.conf`
走既有的 wildcard `*.miyago9267.com` 憑證與 port 80 → 443 全域轉址。

改完設定後套用（需要 root）：

```bash
sudo nginx -t && sudo systemctl reload nginx
```
