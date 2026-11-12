<script setup lang="ts">
withDefaults(
  defineProps<{
    message: string
    title?: string
    retryLabel?: string
    canRetry?: boolean
  }>(),
  {
    title: '内容暂时没有加载出来',
    retryLabel: '重试',
    canRetry: true,
  },
)

const emit = defineEmits<{ retry: [] }>()
</script>

<template>
  <section class="sl-error-state" role="alert">
    <span class="sl-error-state__mark" aria-hidden="true">!</span>
    <h2>{{ title }}</h2>
    <p>{{ message }}</p>
    <button v-if="canRetry" class="sl-button sl-button--secondary" type="button" @click="emit('retry')">
      {{ retryLabel }}
    </button>
  </section>
</template>
