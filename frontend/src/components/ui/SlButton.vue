<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    variant?: 'accent' | 'secondary' | 'ghost' | 'danger'
    size?: 'sm' | 'lg'
    full?: boolean
    busy?: boolean
    type?: 'button' | 'submit'
    disabled?: boolean
  }>(),
  { variant: undefined, size: undefined, full: false, busy: false, type: 'button', disabled: false },
)

const emit = defineEmits<{ click: [event: MouseEvent] }>()

const classes = computed(() => ({
  [`sl-button--${props.variant}`]: !!props.variant,
  [`sl-button--${props.size}`]: !!props.size,
  'sl-button--full': props.full,
}))
</script>

<template>
  <button
    class="sl-button"
    :class="classes"
    :type="type"
    :disabled="disabled"
    :aria-busy="busy || undefined"
    @click="emit('click', $event)"
  >
    <slot />
  </button>
</template>
