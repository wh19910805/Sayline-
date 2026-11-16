<script setup lang="ts">
import { computed } from 'vue'

import SlIcon from '@/components/ui/SlIcon.vue'

const props = defineProps<{
  document: 'terms' | 'privacy'
}>()

const documents = {
  terms: {
    eyebrow: 'USER AGREEMENT',
    title: '用户协议',
    description: '本页面用于承载正式发布前经法务审核的用户协议。',
  },
  privacy: {
    eyebrow: 'PRIVACY POLICY',
    title: '隐私政策',
    description: '本页面用于承载正式发布前经法务审核的隐私政策。',
  },
} as const

const document = computed(() => documents[props.document])
</script>

<template>
  <main class="legal-screen">
    <header class="legal-header">
      <RouterLink class="sl-icon-button" to="/login" aria-label="返回登录">
        <SlIcon name="arrow-left" :size="21" />
      </RouterLink>
      <span>{{ document.eyebrow }}</span>
      <span />
    </header>
    <article class="legal-document">
      <p class="eyebrow">{{ document.eyebrow }}</p>
      <h1>{{ document.title }}</h1>
      <p>{{ document.description }}</p>
      <div class="legal-review" role="status">
        <SlIcon name="error-warning" :size="20" />
        <div>
          <strong>正式文本待法务审核</strong>
          <p>上线前将替换为审核通过的完整条款，当前页面不构成最终协议。</p>
        </div>
      </div>
    </article>
  </main>
</template>

<style scoped>
.legal-screen {
  position: relative;
  width: min(100%, 760px);
  height: 100%;
  margin: 0 auto;
  overflow-y: auto;
  padding: calc(18px + var(--safe-top)) 24px 48px;
  background: var(--app-bg);
  color: var(--color-text);
}

.legal-header {
  min-height: 48px;
  display: grid;
  grid-template-columns: 44px 1fr 44px;
  align-items: center;
  color: var(--color-text-tertiary);
  font-size: 11px;
  letter-spacing: .12em;
  text-align: center;
}

.legal-document {
  padding-top: 64px;
}

.legal-document h1 {
  margin: 8px 0 18px;
  font-family: var(--font-display);
  font-size: clamp(42px, 13vw, 64px);
  font-weight: var(--weight-regular);
  line-height: .98;
  letter-spacing: -.04em;
}

.legal-document > p:not(.eyebrow) {
  max-width: 520px;
  margin: 0;
  color: var(--color-text-secondary);
  line-height: 1.7;
}

.legal-review {
  display: flex;
  gap: 12px;
  margin-top: 36px;
  padding: 18px;
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-lg);
  background: var(--color-bg-elevated);
}

.legal-review strong {
  font-size: 14px;
}

.legal-review p {
  margin: 7px 0 0;
  color: var(--color-text-secondary);
  font-size: 13px;
  line-height: 1.65;
}
</style>
