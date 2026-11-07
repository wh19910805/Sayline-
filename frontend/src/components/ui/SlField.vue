<script setup lang="ts">
defineProps<{
  label: string
  aside?: string
  hint?: string
  error?: string
}>()
</script>

<template>
  <label class="sl-field">
    <span v-if="aside" class="sl-field__label-row">
      <span class="sl-field__label">{{ label }}</span>
      <span class="sl-field__aside">{{ aside }}</span>
    </span>
    <span v-else class="sl-field__label">{{ label }}</span>
    <slot />
    <span v-if="hint" class="sl-field__hint">{{ hint }}</span>
    <span v-if="error" class="sl-field__error">{{ error }}</span>
  </label>
</template>
