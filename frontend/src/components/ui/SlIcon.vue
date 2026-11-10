<script setup lang="ts">
/**
 * 统一图标组件：渲染 Remix Icon 图标字体。
 * name 传 Remix 的基础名（如 book-2、headphone、play），weight 选 line/fill。
 */
const props = defineProps<{
  name: string
  size?: number
  weight?: 'line' | 'fill'
}>()
</script>

<template>
  <i
    :class="`ri-${name}-${weight ?? 'line'}`"
    :style="size ? { fontSize: `${size}px`, lineHeight: 1 } : undefined"
    aria-hidden="true"
  />
</template>
