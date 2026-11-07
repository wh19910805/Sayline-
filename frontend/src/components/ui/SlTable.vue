<script setup lang="ts">
import SlEmpty from './SlEmpty.vue'
import SlSkeleton from './SlSkeleton.vue'

withDefaults(
  defineProps<{
    loading?: boolean
    empty?: boolean
    emptyTitle?: string
    emptyDescription?: string
  }>(),
  { loading: false, empty: false, emptyTitle: '暂无内容', emptyDescription: '' },
)
</script>

<template>
  <SlSkeleton v-if="loading" :rows="4" />
  <SlEmpty v-else-if="empty" :title="emptyTitle" :description="emptyDescription" />
  <table v-else class="admin-table">
    <thead><slot name="head" /></thead>
    <tbody><slot /></tbody>
  </table>
</template>
