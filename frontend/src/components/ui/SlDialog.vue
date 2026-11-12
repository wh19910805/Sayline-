<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, useId, watch } from 'vue'

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
const titleId = useId()
const descriptionId = useId()
let previousFocus: HTMLElement | null = null

function onKeydown(event: KeyboardEvent) {
  if (!props.open) return
  if (event.key === 'Escape') {
    emit('close')
    return
  }
  if (event.key !== 'Tab' || !dialogRef.value) return
  const focusable = [...dialogRef.value.querySelectorAll<HTMLElement>(
    'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
  )]
  if (!focusable.length) {
    event.preventDefault()
    dialogRef.value.focus()
    return
  }
  const first = focusable[0]!
  const last = focusable.at(-1)!
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault()
    last.focus()
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault()
    first.focus()
  }
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))

watch(
  () => props.open,
  async (open) => {
    if (open) {
      previousFocus = document.activeElement as HTMLElement | null
      await nextTick()
      dialogRef.value?.focus()
    } else {
      previousFocus?.focus()
      previousFocus = null
    }
  },
)
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="sl-dialog-backdrop" @click.self="emit('close')">
      <div
        ref="dialogRef"
        class="sl-dialog"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="titleId"
        :aria-describedby="description ? descriptionId : undefined"
        tabindex="-1"
      >
        <p v-if="eyebrow" class="sl-dialog__eyebrow">{{ eyebrow }}</p>
        <h2 :id="titleId" class="sl-dialog__title">{{ title }}</h2>
        <p v-if="description" :id="descriptionId" class="sl-dialog__description">{{ description }}</p>
        <div class="sl-dialog__body"><slot /></div>
        <div v-if="$slots.actions" class="sl-dialog__actions"><slot name="actions" /></div>
      </div>
    </div>
  </Teleport>
</template>
