# 讓 Claude Desktop 引用這個 vault 當教材

`vault/` 裡的 markdown 是給 Claude 讀的教材層。把它掛成 Claude Desktop 的 **filesystem MCP server**，Claude 在對話裡就能直接讀這些筆記。

## 一、設定 MCP server

編輯 Claude Desktop 的設定檔（不存在就新建）：

- macOS：`~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows：`%APPDATA%\Claude\claude_desktop_config.json`

把 `mcpServers` 加上一個指向本 repo `vault/` 的 filesystem server（範本見同目錄 [`claude_desktop_config.example.json`](../claude_desktop_config.example.json)）：

```json
{
  "mcpServers": {
    "japanese-notes": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        "/絕對路徑/JapaneseSpeedRun/vault"
      ]
    }
  }
}
```

把路徑換成 repo 在你機器上的絕對路徑（例如 macOS `/Users/miyago/.../JapaneseSpeedRun/vault`）。存檔後**完全重啟 Claude Desktop**。連上後對話框會出現該 server 的工具，Claude 就能讀 `vault/` 下的檔案。

> 這個 server 只開放 `vault/` 這個資料夾。它同時具備讀寫權限，所以你也可以叫 Claude 幫你新增／修改筆記，改動會直接落在 `vault/`。

## 二、Chat 還是 Project（cowork）？

兩種都能用，差別在「教材要不要常駐」：

- **一般 Chat**：server 連上後，任何對話都能叫 Claude 讀 vault。適合臨時「考我五段動詞變化」「用 vault 出十題」這種即問即用。教材永遠是最新檔案。
- **Project / cowork**：開一個 Project，靠這個 MCP server 讀 vault（教材會跟著檔案更新），或把 `vault/*.md` 當 project knowledge 上傳（變成固定快照，不會自動跟檔案同步）。適合長期、跨多個對話的固定教材。

建議：**vault 會持續長大就用 MCP server（Chat 或 Project 皆可）**，永遠讀到最新內容；只有要一份不再變動的快照時才用上傳 knowledge 的方式。

## 三、用法範例（連上 server 後直接打）

- 「讀 verb-conjugation，隨機考我 10 題五段動詞的て形，我答完再對答案。」
- 「用 adjective-conjugation 的條件形比較，解釋たら和ば差在哪，各給兩個例句。」
- 「根據 vault 的內容，幫我把今天搞混的『可能形 vs 受身形』整理成一張小抄。」
