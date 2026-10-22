<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { Check, Plus } from 'lucide-vue-next'
import { useRouter } from 'vue-router'

import BrandLogo from '@/components/BrandLogo.vue'
import { apiErrorMessage } from '@/api/http'
import { learnerApi } from '@/api/services'
import type { Category } from '@/api/types'
import { useCatalogStore } from '@/stores/catalog'

const router = useRouter()
const catalog = useCatalogStore()
const categories = ref<Category[]>([])
const selected = ref<number[]>([])
const error = ref('')
const saving = ref(false)

onMounted(async () => {
  categories.value = await learnerApi.categories()
})

function toggle(categoryId: number) {
  selected.value = selected.value.includes(categoryId)
    ? selected.value.filter((id) => id !== categoryId)
    : [...selected.value, categoryId]
}

async function finish() {
  if (!selected.value.length) return
  saving.value = true
  error.value = ''
  try {
    await learnerApi.updateInterests(selected.value)
    await catalog.loadInterests()
    await router.replace('/')
  } catch (reason) {
    error.value = apiErrorMessage(reason)
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <main class="app-screen onboarding-screen">
    <header class="onboarding-header">
      <BrandLogo compact />
      <span>01 / 01</span>
    </header>
    <div class="onboarding-copy">
      <p class="eyebrow">MAKE IT YOURS</p>
      <h1>选择你感兴趣的<br />领域。</h1>
      <p>首页只展示你选择的分类。第一个选择会成为默认 Tab，之后可随时调整。</p>
    </div>
    <div class="interest-grid">
      <button
        v-for="(item, index) in categories"
        :key="item.id"
        class="interest-option"
        :class="{ 'is-selected': selected.includes(item.id) }"
        :aria-pressed="selected.includes(item.id)"
        :style="{
          '--category-a': item.themeColorPrimary || '#53634e',
          '--category-b': item.themeColorSecondary || '#263128',
        }"
        type="button"
        @click="toggle(item.id)"
      >
        <span class="interest-option__number">{{ String(index + 1).padStart(2, '0') }}</span>
        <span class="interest-option__icon">
          <component :is="selected.includes(item.id) ? Check : Plus" :size="22" />
        </span>
        <span class="interest-option__copy">
          <strong>{{ item.name }}</strong>
          <small>{{ item.description || '按你的节奏，逐句学习' }}</small>
        </span>
        <span class="interest-option__check">
          {{ selected.includes(item.id) ? selected.indexOf(item.id) + 1 : '+' }}
        </span>
      </button>
    </div>
    <div class="onboarding-foot">
      <p v-if="error" class="inline-error">{{ error }}</p>
      <div class="onboarding-selection">
        <span>{{ selected.length ? `${selected.length} 个已选` : '至少选择 1 个' }}</span>
        <strong>
          {{
            selected.length
              ? `默认：${categories.find((item) => item.id === selected[0])?.name}`
              : '选择顺序决定首页顺序'
          }}
        </strong>
      </div>
      <button
        class="sl-button sl-button--accent sl-button--lg sl-button--full"
        type="button"
        :disabled="!selected.length || saving"
        @click="finish"
      >
        {{ saving ? '正在保存…' : '完成，开始学习' }}
      </button>
    </div>
  </main>
</template>
