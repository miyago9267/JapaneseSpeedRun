// Single source of truth for the notes catalog.
// Add a lesson:
//   1. Drop an HTML file under notes/<category>/  (copy _templates/note.html)
//   2. Append an entry to the matching category's `lessons` array below.
// No build step — just reload the page.
window.JLPT_MANIFEST = {
  site: {
    title: "日文筆記",
    subtitle: "跟 Claude 一起整理・隨時複習",
  },
  categories: [
    {
      id: "verb",
      title: "動詞",
      desc: "動詞的變化與活用",
      lessons: [
        {
          title: "動詞變化型完全對照表",
          desc: "可按變化型或按詞類兩種視角切換；列出五段／一段／不規則的各變化型變法",
          path: "notes/verb/conjugation.html",
          tags: ["變化型", "五段", "一段", "不規則", "活用", "て形", "可能形"],
        },
      ],
    },
    {
      id: "adjective",
      title: "形容詞",
      desc: "い形容詞與な形容詞的變化",
      lessons: [
        {
          title: "形容詞變化型完全對照表",
          desc: "い形 vs な形，可按變化型或按詞類兩種視角切換；含否定／過去／て形／副詞化／接名詞／條件形（たら・ば・なら・と）與常見陷阱",
          path: "notes/adjective/conjugation.html",
          tags: ["變化型", "い形容詞", "な形容詞", "否定形", "過去形", "て形", "副詞化", "たら形", "ば形", "條件形", "陷阱"],
        },
      ],
    },
  ],
};
