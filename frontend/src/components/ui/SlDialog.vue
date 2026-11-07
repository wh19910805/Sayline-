<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'

const props = withDefaults(
  defineProps<{
    open: boolean
    title: string
    eyebrow?: string
    description?: string
  }>(),
  { eyebrow: undefined, description: undefined },
)

const emit = defineEmits<{ close: [] }>()

const dialogRef = ref<HTMLElement | null>(null)

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && props.open) emit('close')
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))

watch(
  () => props.open,
  (open) => {
    if (open) dialogRef.value?.focus()
  },
)
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="sl-dialog-backdrop" @click.self="emit('close')">
      <div ref="dialogRef" class="sl-dialog" role="dialog" aria-modal="true" :aria-label="title" tabindex="-1">
        <p v-if="eyebrow" class="sl-dialog__eyebrow">{{ eyebrow }}</p>
        <h2 class="sl-dialog__title">{{ title }}</h2>
        <p v-if="description" class="sl-dialog__description">{{ description }}</p>
        <div class="sl-dialog__body"><slot /></div>
        <div v-if="$slots.actions" class="sl-dialog__actions"><slot name="actions" /></div>
      </div>
    </div>
  </Teleport>
</template>
