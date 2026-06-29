<script setup lang="ts">
const cards = [
  { icon: '動', title: '動詞變化型', sub: '全變化型・段位原理', link: '/verb-conjugation' },
  { icon: '形', title: '形容詞變化型', sub: 'い・な形，條件陷阱', link: '/adjective-conjugation' },
  { icon: '自', title: '自他動詞', sub: 'を vs が・ている差異', link: '/jidoushi-tadoushi' },
  { icon: 'の', title: 'の 接續', sub: '名詞化，のに，んだ', link: '/no-nominalization' },
  { icon: '文', title: '句子解析', sub: '格助詞・修飾語方向', link: '/sentence-parsing' },
  { icon: '助', title: '細節助詞', sub: 'も・しか・だけ・ばかり', link: '/focus-particles' },
  { icon: '誤', title: '我的錯題', sub: '反覆出錯的模式整理', link: '/my-pitfalls' },
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
          <a href="/verb-conjugation" class="jph-nav-link">指南</a>
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
        共 7 篇筆記・涵蓋 N3–N2・持續更新
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

      <div class="jph-grid">
        <a
          v-for="card in cards"
          :key="card.link"
          :href="card.link"
          class="jph-card"
        >
          <div class="jph-card-icon">{{ card.icon }}</div>
          <div class="jph-card-title">{{ card.title }}</div>
          <div class="jph-card-sub">{{ card.sub }}</div>
        </a>
      </div>
    </div>

    <footer class="jph-footer">
      <span>© 2026 某人的日文筆記・個人學習筆記</span>
      <span>Built with VitePress</span>
    </footer>
  </div>
</template>
