<script setup lang="ts">
defineProps<{
  title: string
  description?: string
  actionLabel?: string
}>()

const emit = defineEmits<{ action: [] }>()
</script>

<template>
  <div class="sl-empty">
    <span v-if="$slots.icon" class="sl-empty__icon"><slot name="icon" /></span>
    <h3 class="sl-empty__title">{{ title }}</h3>
    <p v-if="description" class="sl-empty__description">{{ description }}</p>
    <button
      v-if="actionLabel"
      class="sl-button sl-button--secondary sl-button--sm"
      type="button"
      @click="emit('action')"
    >
      {{ actionLabel }}
    </button>
  </div>
</template>
