<script setup lang="ts">
withDefaults(defineProps<{ rows?: number }>(), { rows: 4 })
</script>

<template>
  <div class="sl-skeleton" role="status" aria-label="加载中">
    <div v-for="i in rows" :key="i" class="sl-skeleton__row" />
  </div>
</template>
