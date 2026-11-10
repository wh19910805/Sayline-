import { createApp } from 'vue'

import App from './App.vue'
import { router } from './router'
import { pinia } from './stores'
import { restoreAmbient } from './composables/useAmbient'
import 'remixicon/fonts/remixicon.css'
import './styles/global.css'

restoreAmbient()

// 生产环境注册 Service Worker（PWA 离线缓存），开发环境跳过避免影响 HMR
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => undefined)
  })
}

createApp(App).use(pinia).use(router).mount('#app')
