import { h } from 'vue'
import { useData } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import { enhanceAppWithTabs } from 'vitepress-plugin-tabs/client'
import HomePage from './HomePage.vue'
import './custom.css'

export default {
  extends: DefaultTheme,
  Layout() {
    const { frontmatter } = useData()
    if (frontmatter.value.layout === 'jp-home') {
      return h(HomePage)
    }
    return h(DefaultTheme.Layout)
  },
  enhanceApp({ app }) {
    enhanceAppWithTabs(app)
  }
}
