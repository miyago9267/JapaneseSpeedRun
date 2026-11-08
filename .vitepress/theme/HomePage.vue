<script setup lang="ts">
const sections = [
  {
    title: '基礎',
    sub: '活用・助詞・單字・基本句型，補 N5/N4 的底',
    cards: [
      { icon: '表', title: '活用速查表', sub: '動詞・形容詞・名詞一張看完', link: '/basics/conjugation-cheatsheet' },
      { icon: '動', title: '動詞變化型', sub: '全變化型・段位原理', link: '/basics/verb-conjugation' },
      { icon: '形', title: '形容詞變化型', sub: 'い・な形，條件陷阱', link: '/basics/adjective-conjugation' },
      { icon: '助', title: '常用助詞', sub: 'は・が・を・に・で・へ…', link: '/basics/particles' },
      { icon: '語', title: '基本單字', sub: 'こそあど・疑問詞・時間詞', link: '/basics/vocabulary' },
      { icon: '帳', title: '單字本', sub: '動詞・形容詞・名詞，標原型與變形', link: '/basics/words/verbs' },
      { icon: '自', title: '自他動詞', sub: 'を vs が・ている差異', link: '/basics/jidoushi-tadoushi' },
      { icon: '授', title: '授受動詞', sub: 'あげる・くれる・もらう', link: '/basics/juju-doushi' },
      { icon: '文', title: '句子解析', sub: '格助詞・修飾語方向', link: '/basics/sentence-parsing' },
    ],
  },
  {
    title: '比較',
    sub: '近義詞・相近用法差在哪',
    cards: [
      { icon: '因', title: 'から vs ので', sub: '主觀・客觀・禮貌度', link: '/compare/kara-node' },
      { icon: '差', title: 'は vs が', sub: '主題與主語', link: '/compare/wa-ga' },
      { icon: '条', title: '條件形', sub: 'と・ば・たら・なら', link: '/compare/conditional-forms' },
      { icon: '限', title: '細節助詞', sub: 'も・しか・だけ・ばかり', link: '/compare/focus-particles' },
    ],
  },
  {
    title: '實例',
    sub: '真實素材的翻譯拆解・生活用語怎麼講',
    cards: [
      { icon: '読', title: '讀解筆記', sub: '原文逐句拆解', link: '/examples/reading-notes' },
      { icon: '報', title: '新聞日文', sub: '新聞常見表現', link: '/examples/news-japanese' },
      { icon: '話', title: '生活用語', sub: '中文怎麼說 → 日文怎麼講', link: '/examples/daily-phrases' },
    ],
  },
  {
    title: '我的錯題',
    sub: '答錯・翻錯的點，反覆看到會的為止',
    cards: [
      { icon: '誤', title: '錯題整理', sub: '反覆出錯的模式', link: '/mistakes/my-pitfalls' },
      { icon: '試', title: 'N2 模擬・文法卷 01', sub: '模擬卷與解析', link: '/mistakes/n2-mock-grammar-01' },
    ],
  },
]

function openSearch() {
  document.dispatchEvent(
    new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true, cancelable: true })
  )
}
</script>

<template>
  <div class="jph">
    <header class="jph-header">
      <div class="jph-header-inner">
        <a href="/" class="jph-logo">
          <span class="jph-logo-mark">雨</span>
          <span class="jph-logo-name">日本語ノート</span>
        </a>
        <nav class="jph-nav">
          <a href="/study-method" class="jph-nav-link">指南</a>
          <a
            href="https://github.com/miyago9267/JapaneseSpeedRun"
            target="_blank"
            rel="noopener"
            class="jph-nav-link"
          >GitHub</a>
        </nav>
      </div>
    </header>

    <div class="jph-body">
      <div class="jph-status">
        <span class="jph-dot"></span>
        共 27 篇筆記・涵蓋 N5–N2・持續更新
      </div>

      <div
        class="jph-search"
        role="button"
        tabindex="0"
        @click="openSearch"
        @keydown.enter="openSearch"
      >
        <svg class="jph-search-icon" width="16" height="16" viewBox="0 0 16 16" fill="none">
          <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" stroke-width="1.5"/>
          <line x1="10.5" y1="10.5" x2="14" y2="14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
        <span class="jph-search-hint">搜尋單字、文法、文章…</span>
        <kbd class="jph-search-kbd">⌘K</kbd>
      </div>

      <section v-for="sec in sections" :key="sec.title" class="jph-section">
        <h2 class="jph-section-title">{{ sec.title }}<span class="jph-section-sub">{{ sec.sub }}</span></h2>
        <div class="jph-grid">
          <a
            v-for="card in sec.cards"
            :key="card.link"
            :href="card.link"
            class="jph-card"
          >
            <div class="jph-card-icon">{{ card.icon }}</div>
            <div class="jph-card-title">{{ card.title }}</div>
            <div class="jph-card-sub">{{ card.sub }}</div>
          </a>
        </div>
      </section>
    </div>

    <footer class="jph-footer">
      <span>© 2026 某人的日文筆記・個人學習筆記</span>
      <span>Built with VitePress</span>
    </footer>
  </div>
</template>
