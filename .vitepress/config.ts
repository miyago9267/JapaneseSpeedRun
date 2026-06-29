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
      // Obsidian-native source → VitePress tabs. vault/*.md 用 <!-- tabs:start/end -->
      // 包住一組 ## 標題分段（Obsidian 看到的是隱形 comment + 正常 H2）；build 時
      // 還原成 ::: tabs / == Label，交給 tabsMarkdownPlugin。衍生不落地、不進 git。
      md.core.ruler.before('normalize', 'obsidian_tabs', (state: any) => {
        if (state.src.indexOf('<!-- tabs:start -->') === -1) return
        const out: string[] = []
        let inTabs = false
        for (const raw of state.src.split('\n')) {
          const line = raw.replace(/\r$/, '')
          if (line.trim() === '<!-- tabs:start -->') { inTabs = true; out.push('::: tabs', ''); continue }
          if (line.trim() === '<!-- tabs:end -->') { inTabs = false; out.push('', ':::'); continue }
          if (inTabs && /^##\s+/.test(line)) { out.push('', `== ${line.replace(/^##\s+/, '').trim()}`, ''); continue }
          out.push(line)
        }
        state.src = out.join('\n')
      })
      md.use(tabsMarkdownPlugin)
    }
  },
  themeConfig: {
    nav: [
      { text: '首頁', link: '/' },
      {
        text: '變化型',
        items: [
          { text: '動詞變化型', link: '/verb-conjugation' },
          { text: '形容詞變化型', link: '/adjective-conjugation' }
        ]
      },
      {
        text: '動詞語法',
        items: [
          { text: '自他動詞', link: '/jidoushi-tadoushi' },
          { text: 'の 接續', link: '/no-nominalization' },
          { text: '授受動詞', link: '/juju-doushi' },
          { text: 'て形複合', link: '/te-compound' }
        ]
      },
      {
        text: '文法表現',
        items: [
          { text: '句子解析', link: '/sentence-parsing' },
          { text: '細節助詞', link: '/focus-particles' },
          { text: '條件形', link: '/conditional-forms' }
        ]
      },
      { text: '我的錯題', link: '/my-pitfalls' }
    ],
    sidebar: [
      {
        text: '變化型筆記',
        items: [
          { text: '動詞變化型', link: '/verb-conjugation' },
          { text: '形容詞變化型', link: '/adjective-conjugation' }
        ]
      },
      {
        text: '動詞語法',
        items: [
          { text: '自他動詞', link: '/jidoushi-tadoushi' },
          { text: 'の 接續', link: '/no-nominalization' },
          { text: '授受動詞', link: '/juju-doushi' },
          { text: 'て形複合', link: '/te-compound' }
        ]
      },
      {
        text: '文法表現',
        items: [
          { text: '句子解析', link: '/sentence-parsing' },
          { text: '細節助詞', link: '/focus-particles' },
          { text: '條件形', link: '/conditional-forms' },
          { text: '我的錯題', link: '/my-pitfalls' }
        ]
      }
    ],
    search: { provider: 'local' },
    outline: false,
    docFooter: { prev: false, next: false }
  }
})
