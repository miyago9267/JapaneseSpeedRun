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
      // 振假名：vault 裡寫 {漢字|かんじ}（Obsidian 社群外掛 Markdown Furigana 的語法），
      // 表格列內寫 {漢字\|かんじ}。多段讀音 {漢字|かん|じ} 需段數 = base 字數。
      // build 時轉成 <ruby>。兩階段做是為了不被 CommonMark 的 ** flanking 規則干擾：
      // 先（inline 解析前）把 token 換成不含標點的 PUA 佔位字元，emphasis 才會把它當一般文字；
      // 解析後再把 text token 裡的佔位字元切成 <ruby> 的 token，code span / 連結等原樣還原。
      // 以 code point 組 regex，來源檔不放 unicode 跳脫（formatter 會改寫它們）
      const cp = (a: number, b?: number) =>
        b === undefined ? String.fromCharCode(a) : `${String.fromCharCode(a)}-${String.fromCharCode(b)}`
      const BS = String.fromCharCode(92)
      const KANJI = cp(0x3005) + cp(0x3006) + cp(0x3400, 0x4dbf) + cp(0x4e00, 0x9fff) + cp(0xf900, 0xfaff)
      const KANA = cp(0x3041, 0x3096) + cp(0x30a1, 0x30fa) + cp(0x30fc)
      const RUBY_KANJI = new RegExp(`[${KANJI}]`)
      // 等價於：(?<!反斜線)\{ ([kana/kanji]+) ( (?:反斜線?\| [kana]+)+ ) \}
      const RUBY_RE = new RegExp(
        `(?<!${BS}${BS})${BS}{([${KANA}${KANJI}]+)((?:${BS}${BS}?${BS}|[${KANA}]+)+)${BS}}`, 'g')
      const P_OPEN = cp(0xe000), P_MID = cp(0xe001), P_END = cp(0xe002), P_SEP = cp(0xe003)
      const PLACEHOLDER_RE = new RegExp(`${P_OPEN}([^${P_MID}]+)${P_MID}([^${P_END}]+)${P_END}`, 'g')
      const restoreRuby = (s: string) =>
        s.replace(PLACEHOLDER_RE, (_m, base: string, rd: string) => `{${base}|${rd.split(P_SEP).join('|')}}`)

      md.core.ruler.before('inline', 'ruby_pre', (state: any) => {
        for (const tok of state.tokens) {
          if (tok.type !== 'inline' || tok.content.indexOf('{') === -1) continue
          tok.content = tok.content.replace(RUBY_RE, (m: string, base: string, rest: string) => {
            if (!RUBY_KANJI.test(base)) return m
            const rd = rest.split(/\\?\|/).slice(1)
            if (rd.length > 1 && rd.length !== [...base].length) return m
            return P_OPEN + base + P_MID + rd.join(P_SEP) + P_END
          })
        }
      })
      md.core.ruler.after('inline', 'ruby_post', (state: any) => {
        const Token = state.Token
        for (const blk of state.tokens) {
          if (blk.type !== 'inline' || !blk.children) continue
          // anchor 的 aria-label 之類會讀 inline content：只留 base，不要讓佔位字元或 {…|…} 漏出去
          blk.content = blk.content.replace(PLACEHOLDER_RE, (_m: string, base: string) => base)
          const out: any[] = []
          for (const t of blk.children) {
            if (t.type !== 'text' || t.content.indexOf(P_OPEN) === -1) {
              if (t.content && t.content.indexOf(P_OPEN) !== -1) t.content = restoreRuby(t.content)
              if (t.attrs) for (const a of t.attrs) a[1] = restoreRuby(a[1])
              out.push(t)
              continue
            }
            let last = 0
            let m: RegExpExecArray | null
            PLACEHOLDER_RE.lastIndex = 0
            while ((m = PLACEHOLDER_RE.exec(t.content))) {
              const plain = t.content.slice(last, m.index)
              if (plain) { const x = new Token('text', '', 0); x.content = plain; out.push(x) }
              last = m.index + m[0].length
              const chars = [...m[1]]
              const rds = m[2].split(P_SEP)
              const open = new Token('html_inline', '', 0); open.content = '<ruby>'; out.push(open)
              const esc = state.md.utils.escapeHtml
              const rt = (r: string) => `<rp>（</rp><rt>${esc(r)}</rt><rp>）</rp>`
              if (rds.length === 1) {
                const x = new Token('text', '', 0); x.content = m[1]; out.push(x)
                const r = new Token('html_inline', '', 0); r.content = rt(rds[0]); out.push(r)
              } else {
                chars.forEach((c, i) => {
                  const x = new Token('text', '', 0); x.content = c; out.push(x)
                  const r = new Token('html_inline', '', 0); r.content = rt(rds[i]); out.push(r)
                })
              }
              const close = new Token('html_inline', '', 0); close.content = '</ruby>'; out.push(close)
            }
            const tail = t.content.slice(last)
            if (tail) { const x = new Token('text', '', 0); x.content = tail; out.push(x) }
          }
          blk.children = out
        }
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
              { text: '自他動詞', link: '/basics/grammar/jidoushi-tadoushi' },
              { text: 'の 接續', link: '/basics/grammar/no-nominalization' },
              { text: '授受動詞', link: '/basics/grammar/juju-doushi' },
              { text: 'て形複合', link: '/basics/grammar/te-compound' },
              { text: '複合動詞', link: '/basics/grammar/compound-verbs' },
              { text: '使役形用法', link: '/basics/grammar/causative' }
            ]
          },
          {
            text: '助詞',
            items: [
              { text: '常用助詞', link: '/basics/grammar/particles' },
              { text: '格助詞進階', link: '/basics/particles/case-particles' },
              { text: '副助詞', link: '/basics/particles/adverbial-particles' },
              { text: '接続助詞', link: '/basics/particles/conjunctive-particles' },
              { text: '終助詞', link: '/basics/particles/sentence-final-particles' },
              { text: '複合助詞', link: '/basics/particles/compound-particles' }
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
          { text: '理由・程度', link: '/compare/reason-degree' },
          { text: 'わけ系列', link: '/compare/wake' },
          { text: 'とたん・まま', link: '/compare/tatan-mama' }
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
        text: '聽力練習',
        items: [
          { text: '總覽・用法', link: '/listening/' },
          { text: 'pack-01', link: '/listening/pack-01' },
          { text: 'pack-02', link: '/listening/pack-02' },
          { text: 'pack-03', link: '/listening/pack-03' }
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
              { text: '自他動詞', link: '/basics/grammar/jidoushi-tadoushi' },
              { text: 'の 接續', link: '/basics/grammar/no-nominalization' },
              { text: '授受動詞', link: '/basics/grammar/juju-doushi' },
              { text: 'て形複合', link: '/basics/grammar/te-compound' },
              { text: '複合動詞', link: '/basics/grammar/compound-verbs' },
              { text: '使役形用法', link: '/basics/grammar/causative' }
            ]
          },
          {
            text: '助詞',
            collapsed: false,
            items: [
              { text: '常用助詞', link: '/basics/grammar/particles' },
              { text: '格助詞進階', link: '/basics/particles/case-particles' },
              { text: '副助詞', link: '/basics/particles/adverbial-particles' },
              { text: '接続助詞', link: '/basics/particles/conjunctive-particles' },
              { text: '終助詞', link: '/basics/particles/sentence-final-particles' },
              { text: '複合助詞', link: '/basics/particles/compound-particles' }
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
          { text: '理由・程度', link: '/compare/reason-degree' },
          { text: 'わけ系列', link: '/compare/wake' },
          { text: 'とたん・まま', link: '/compare/tatan-mama' }
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
        text: '聽力練習',
        items: [
          { text: '總覽・用法', link: '/listening/' },
          { text: 'pack-01', link: '/listening/pack-01' },
          { text: 'pack-02', link: '/listening/pack-02' },
          { text: 'pack-03', link: '/listening/pack-03' }
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
