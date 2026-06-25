import { defineConfig } from 'vitepress'
import { tabsMarkdownPlugin } from 'vitepress-plugin-tabs'

// Single source of truth: markdown lives in ../vault (also the Claude/Obsidian note vault).
// Build output goes to .vitepress/dist, which nginx serves.
export default defineConfig({
  lang: 'zh-TW',
  title: '某人的日文筆記',
  description: '跟 Claude 整理的日文學習筆記・隨時複習',
  srcDir: './vault',
  cleanUrls: true,
  lastUpdated: false,
  markdown: {
    config(md) {
      md.use(tabsMarkdownPlugin)
    }
  },
  themeConfig: {
    nav: [
      { text: '首頁', link: '/' },
      { text: '動詞', link: '/verb-conjugation' },
      { text: '形容詞', link: '/adjective-conjugation' }
    ],
    sidebar: [
      {
        text: '變化型筆記',
        items: [
          { text: '動詞變化型', link: '/verb-conjugation' },
          { text: '形容詞變化型', link: '/adjective-conjugation' }
        ]
      }
    ],
    search: { provider: 'local' },
    outline: false,
    docFooter: { prev: false, next: false }
  }
})
