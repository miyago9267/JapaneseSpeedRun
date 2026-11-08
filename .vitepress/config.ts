import { defineConfig } from 'vitepress'
import { tabsMarkdownPlugin } from 'vitepress-plugin-tabs'
import taskLists from '@hackmd/markdown-it-task-lists'

// Single source of truth: markdown lives in ../vault (also the Claude/Obsidian note vault).
// Build output goes to .vitepress/dist; GitHub Actions deploys it to GitHub Pages.
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
      // GFM task list（- [ ] / - [x]）→ 唯讀 checkbox；教材追蹤 vault/minna/ 用。
      md.use(taskLists)
    }
  },
  themeConfig: {
    nav: [
      { text: '首頁', link: '/' },
      {
        text: '基礎',
        items: [
          {
            text: '文字・語彙',
            items: [
              { text: '基本單字（功能詞）', link: '/basics/vocab/function-words' },
              { text: '動詞單字本', link: '/basics/vocab/verbs' },
              { text: '形容詞單字本', link: '/basics/vocab/adjectives' },
              { text: '名詞單字本', link: '/basics/vocab/nouns' }
            ]
          },
          {
            text: '文法',
            items: [
              { text: '活用速查表', link: '/basics/grammar/conjugation-cheatsheet' },
              { text: '動詞變化型', link: '/basics/grammar/verb-conjugation' },
              { text: '形容詞變化型', link: '/basics/grammar/adjective-conjugation' },
              { text: '名詞活用', link: '/basics/grammar/noun-conjugation' },
              { text: '常用助詞', link: '/basics/grammar/particles' },
              { text: '自他動詞', link: '/basics/grammar/jidoushi-tadoushi' },
              { text: 'の 接續', link: '/basics/grammar/no-nominalization' },
              { text: '授受動詞', link: '/basics/grammar/juju-doushi' },
              { text: 'て形複合', link: '/basics/grammar/te-compound' },
              { text: '複合動詞', link: '/basics/grammar/compound-verbs' },
              { text: '使役形用法', link: '/basics/grammar/causative' }
            ]
          },
          {
            text: '解析',
            items: [
              { text: '句子解析', link: '/basics/parsing/sentence-parsing' }
            ]
          }
        ]
      },
      {
        text: '比較',
        items: [
          { text: 'から vs ので', link: '/compare/kara-node' },
          { text: 'は vs が', link: '/compare/wa-ga' },
          { text: '細節助詞', link: '/compare/focus-particles' },
          { text: '條件形', link: '/compare/conditional-forms' },
          { text: '推量・様態', link: '/compare/modality' },
          { text: '理由・程度', link: '/compare/reason-degree' }
        ]
      },
      {
        text: '大家的日本語',
        items: [
          { text: '總覽', link: '/minna/' },
          { text: '初級 I（第1〜25課）', link: '/minna/shokyu-1' },
          { text: '初級 II（第26〜50課）', link: '/minna/shokyu-2' }
        ]
      },
      {
        text: '實例',
        items: [
          { text: '讀解筆記', link: '/examples/reading-notes' },
          { text: '新聞日文', link: '/examples/news-japanese' },
          { text: '生活用語', link: '/examples/daily-phrases' }
        ]
      },
      {
        text: '我的錯題',
        items: [
          { text: '錯題整理', link: '/mistakes/my-pitfalls' },
          { text: 'N2 模擬・文法卷 01', link: '/mistakes/n2-mock-grammar-01' }
        ]
      },
      { text: '學習方法', link: '/study-method' }
    ],
    sidebar: [
      {
        text: '基礎',
        items: [
          {
            text: '文字・語彙',
            collapsed: false,
            items: [
              { text: '基本單字（功能詞）', link: '/basics/vocab/function-words' },
              { text: '動詞單字本', link: '/basics/vocab/verbs' },
              { text: '形容詞單字本', link: '/basics/vocab/adjectives' },
              { text: '名詞單字本', link: '/basics/vocab/nouns' }
            ]
          },
          {
            text: '文法',
            collapsed: false,
            items: [
              { text: '活用速查表', link: '/basics/grammar/conjugation-cheatsheet' },
              { text: '動詞變化型', link: '/basics/grammar/verb-conjugation' },
              { text: '形容詞變化型', link: '/basics/grammar/adjective-conjugation' },
              { text: '名詞活用', link: '/basics/grammar/noun-conjugation' },
              { text: '常用助詞', link: '/basics/grammar/particles' },
              { text: '自他動詞', link: '/basics/grammar/jidoushi-tadoushi' },
              { text: 'の 接續', link: '/basics/grammar/no-nominalization' },
              { text: '授受動詞', link: '/basics/grammar/juju-doushi' },
              { text: 'て形複合', link: '/basics/grammar/te-compound' },
              { text: '複合動詞', link: '/basics/grammar/compound-verbs' },
              { text: '使役形用法', link: '/basics/grammar/causative' }
            ]
          },
          {
            text: '解析',
            collapsed: false,
            items: [
              { text: '句子解析', link: '/basics/parsing/sentence-parsing' }
            ]
          }
        ]
      },
      {
        text: '比較',
        items: [
          { text: 'から vs ので', link: '/compare/kara-node' },
          { text: 'は vs が', link: '/compare/wa-ga' },
          { text: '細節助詞', link: '/compare/focus-particles' },
          { text: '條件形', link: '/compare/conditional-forms' },
          { text: '推量・様態', link: '/compare/modality' },
          { text: '理由・程度', link: '/compare/reason-degree' }
        ]
      },
      {
        text: '大家的日本語',
        items: [
          { text: '總覽', link: '/minna/' },
          { text: '初級 I', link: '/minna/shokyu-1' },
          { text: '初級 II', link: '/minna/shokyu-2' }
        ]
      },
      {
        text: '實例',
        items: [
          { text: '讀解筆記', link: '/examples/reading-notes' },
          { text: '新聞日文', link: '/examples/news-japanese' },
          { text: '生活用語', link: '/examples/daily-phrases' }
        ]
      },
      {
        text: '我的錯題',
        items: [
          { text: '錯題整理', link: '/mistakes/my-pitfalls' },
          { text: 'N2 模擬・文法卷 01', link: '/mistakes/n2-mock-grammar-01' }
        ]
      },
      {
        text: '學習方法',
        items: [
          { text: '怎麼用這個 vault 做筆記', link: '/study-method' }
        ]
      }
    ],
    search: { provider: 'local' },
    outline: false,
    docFooter: { prev: false, next: false }
  }
})
