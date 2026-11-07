<script setup lang="ts">
defineProps<{
  label?: string
  modelValue: boolean
}>()

const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>()
</script>

<template>
  <label class="sl-switch">
    <span v-if="label" class="sl-switch__label">{{ label }}</span>
    <input
      type="checkbox"
      role="switch"
      :checked="modelValue"
      :aria-checked="modelValue"
      @change="emit('update:modelValue', ($event.target as HTMLInputElement).checked)"
    />
    <span class="sl-switch__track"><span class="sl-switch__thumb" /></span>
  </label>
</template>
