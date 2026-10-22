<script setup lang="ts">
import mark from '@/assets/brand/sayline-mark.svg'
import markLight from '@/assets/brand/sayline-mark-cream.svg'

defineProps<{
  light?: boolean
  compact?: boolean
}>()
</script>

<template>
  <div class="sayline-lockup" :class="{ 'is-light': light, 'is-compact': compact }">
    <img class="sayline-lockup__mark" :src="light ? markLight : mark" alt="" />
    <div>
      <div class="sayline-lockup__word">Sayline</div>
      <div class="sayline-lockup__cn">逐 句 英 语</div>
    </div>
  </div>
</template>
