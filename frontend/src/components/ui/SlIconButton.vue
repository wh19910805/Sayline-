<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    ariaLabel: string
    outline?: boolean
    active?: boolean
    disabled?: boolean
  }>(),
  { outline: false, active: false, disabled: false },
)

const emit = defineEmits<{ click: [event: MouseEvent] }>()

const classes = computed(() => ({
  'sl-icon-button--outline': props.outline,
  'sl-icon-button--active': props.active,
}))
</script>

<template>
  <button
    class="sl-icon-button"
    :class="classes"
    type="button"
    :aria-label="ariaLabel"
    :disabled="disabled"
    @click="emit('click', $event)"
  >
    <slot />
  </button>
</template>
