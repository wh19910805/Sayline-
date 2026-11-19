import { createApp } from 'vue'

import App from './App.vue'
import { router } from './router'
import { pinia } from './stores'
import { refreshThemeColor, restoreAmbient } from './composables/useAmbient'
import './styles/global.css'

function syncAppViewport() {
  const viewport = window.visualViewport
  const rootStyle = document.documentElement.style
  rootStyle.setProperty('--app-viewport-height', `${viewport?.height ?? window.innerHeight}px`)
  rootStyle.setProperty('--app-viewport-width', `${viewport?.width ?? window.innerWidth}px`)
  rootStyle.setProperty('--app-viewport-top', `${viewport?.offsetTop ?? 0}px`)
  rootStyle.setProperty('--app-viewport-left', `${viewport?.offsetLeft ?? 0}px`)
}

syncAppViewport()
window.visualViewport?.addEventListener('resize', syncAppViewport)
window.visualViewport?.addEventListener('scroll', syncAppViewport)

restoreAmbient()

window.addEventListener('pageshow', refreshThemeColor)
window.addEventListener('orientationchange', refreshThemeColor)
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') refreshThemeColor()
})

// 生产环境注册 Service Worker（PWA 离线缓存），开发环境跳过避免影响 HMR
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => undefined)
  })
}

createApp(App).use(pinia).use(router).mount('#app')
