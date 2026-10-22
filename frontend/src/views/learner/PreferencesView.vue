<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ArrowDown, ArrowLeft, ArrowUp, Plus, X } from 'lucide-vue-next'
import { useRouter } from 'vue-router'

import { apiErrorMessage } from '@/api/http'
import { learnerApi } from '@/api/services'
import type { Category } from '@/api/types'
import { useCatalogStore } from '@/stores/catalog'

const router = useRouter()
const catalog = useCatalogStore()
const allCategories = ref<Category[]>([])
const selectedIds = ref<number[]>([])
const error = ref('')
const saved = ref(false)

const available = computed(() =>
  allCategories.value.filter((category) => !selectedIds.value.includes(category.id)),
)

const selectedCategories = computed(() =>
  selectedIds.value
    .map((id) => allCategories.value.find((category) => category.id === id))
    .filter((item): item is Category => Boolean(item)),
)

onMounted(async () => {
  try {
    ;[allCategories.value, selectedIds.value] = await Promise.all([
      learnerApi.categories(),
      learnerApi.interests().then((items) => items.map((item) => item.id)),
    ])
  } catch (reason) {
    error.value = apiErrorMessage(reason)
  }
})

function add(id: number) {
  selectedIds.value.push(id)
}

function remove(id: number) {
  selectedIds.value = selectedIds.value.filter((item) => item !== id)
}

function move(index: number, offset: number) {
  const target = index + offset
  if (target < 0 || target >= selectedIds.value.length) return
  const copy = [...selectedIds.value]
  ;[copy[index], copy[target]] = [copy[target]!, copy[index]!]
  selectedIds.value = copy
}

async function save() {
  error.value = ''
  saved.value = false
  try {
    await learnerApi.updateInterests(selectedIds.value)
    await catalog.loadInterests()
    saved.value = true
  } catch (reason) {
    error.value = apiErrorMessage(reason)
  }
}
</script>

<template>
  <main class="app-screen preferences-screen">
    <header class="settings-header">
      <button class="sl-icon-button" type="button" aria-label="返回" @click="router.back()"><ArrowLeft :size="21" /></button>
      <h1>学习偏好</h1>
      <span />
    </header>
    <div class="settings-scroll">
      <div class="settings-form">
        <section class="settings-section">
          <h2>已选兴趣</h2>
          <p>排序决定首页 Tab 顺序，第一项是默认 Tab。</p>
          <div class="interest-order-list">
            <article v-for="(category, index) in selectedCategories" :key="category.id" class="interest-order-row">
              <span class="interest-order-row__index">{{ index + 1 }}</span>
              <strong>{{ category.name }}</strong>
              <button type="button" aria-label="上移" :disabled="index === 0" @click="move(index, -1)"><ArrowUp :size="16" /></button>
              <button type="button" aria-label="下移" :disabled="index === selectedIds.length - 1" @click="move(index, 1)"><ArrowDown :size="16" /></button>
              <button type="button" aria-label="移除" @click="remove(category.id)"><X :size="16" /></button>
            </article>
            <p v-if="!selectedIds.length">至少选择一个兴趣分类。</p>
          </div>
        </section>

        <section class="settings-section">
          <h2>继续添加</h2>
          <div class="interest-pool">
            <button v-for="category in available" :key="category.id" type="button" @click="add(category.id)">
              <Plus :size="14" />
              {{ category.name }}
            </button>
            <p v-if="!available.length">全部兴趣都已添加。</p>
          </div>
        </section>

        <p v-if="error" class="inline-error">{{ error }}</p>
        <p v-if="saved" class="inline-success">学习偏好已保存</p>
        <button class="sl-button sl-button--accent sl-button--lg sl-button--full" type="button" :disabled="!selectedIds.length" @click="save">
          保存偏好
        </button>
      </div>
    </div>
  </main>
</template>
