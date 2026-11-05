<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'

import { dictationWords, getLetterStates } from '@/utils/dictation'

const props = defineProps<{
  sentence: string
  submitted: boolean
}>()

const emit = defineEmits<{
  submit: [answer: string]
  complete: [answer: string]
}>()

const values = ref<string[]>([])
const root = ref<HTMLElement | null>(null)
const inputs = ref<Record<number, HTMLInputElement>>({})
const words = computed(() => dictationWords(props.sentence))
let completeTimer: ReturnType<typeof setTimeout> | undefined
let leaveTimer: ReturnType<typeof setTimeout> | undefined

function ensureValues() {
  if (values.value.length !== words.value.length) {
    values.value = words.value.map((_, index) => values.value[index] ?? '')
  }
}
ensureValues()

function setInputRef(index: number, element: unknown) {
  if (element instanceof HTMLInputElement) {
    inputs.value[index] = element
  } else {
    delete inputs.value[index]
  }
}

function setInput(index: number, event: Event) {
  const value = (event.target as HTMLInputElement).value.replace(/\s+/g, '')
  values.value[index] = value
  ;(event.target as HTMLInputElement).value = value
}

function handleKeydown(index: number, event: KeyboardEvent) {
  if (event.key === ' ') {
    event.preventDefault()
    inputs.value[index + 1]?.focus()
    return
  }
  if (event.key === 'Backspace' && !(values.value[index] ?? '')) {
    event.preventDefault()
    const previous = inputs.value[index - 1]
    if (previous) {
      previous.focus()
      const length = previous.value.length
      previous.setSelectionRange(length, length)
    }
  }
}

function letterStates(word: string, index: number) {
  return getLetterStates(values.value[index] ?? '', word)
}

function answerText() {
  return words.value.map((_, index) => values.value[index] ?? '').join(' ')
}

function submitIfLeaving() {
  if (leaveTimer) clearTimeout(leaveTimer)
  leaveTimer = setTimeout(() => {
    if (root.value?.contains(document.activeElement)) return
    const answer = answerText()
    if (answer.trim()) emit('submit', answer)
  }, 0)
}

const correct = computed(() =>
  words.value.every(
    (word, index) =>
      (values.value[index] ?? '').toLowerCase() ===
      word.replace(/[^a-zA-Z0-9']/g, '').toLowerCase(),
  ),
)

watch(correct, (isCorrect) => {
  if (completeTimer) {
    clearTimeout(completeTimer)
    completeTimer = undefined
  }
  if (isCorrect && !props.submitted) {
    completeTimer = setTimeout(() => {
      emit('complete', answerText())
    }, 500)
  }
})

onBeforeUnmount(() => {
  if (completeTimer) clearTimeout(completeTimer)
  if (leaveTimer) clearTimeout(leaveTimer)
})
</script>

<template>
  <div>
    <div ref="root" class="sl-word-input" @focusout="submitIfLeaving">
      <label
        v-for="(word, wordIndex) in words"
        :key="`${word}-${wordIndex}`"
        class="sl-word-input__word"
        :style="{ '--letters': Math.max(2, word.replace(/[^a-zA-Z0-9']/g, '').length) }"
      >
        <span class="sl-word-input__cell" :style="{ width: `calc(${Math.max(2, word.replace(/[^a-zA-Z0-9']/g, '').length)} * 11px + 18px)` }">
          <span class="sl-word-input__mirror" aria-hidden="true">
            <span
              v-for="(state, letterIndex) in letterStates(word, wordIndex)"
              :key="letterIndex"
              :class="`is-${state}`"
            >
              {{ values[wordIndex]?.[letterIndex] || ' ' }}
            </span>
          </span>
          <input
            :ref="(element) => setInputRef(wordIndex, element)"
            :value="values[wordIndex]"
            :aria-label="`第 ${wordIndex + 1} 个单词`"
            :disabled="submitted"
            autocomplete="off"
            autocapitalize="off"
            inputmode="text"
            spellcheck="false"
            @input="setInput(wordIndex, $event)"
            @keydown="handleKeydown(wordIndex, $event)"
          />
        </span>
      </label>
    </div>
    <p v-if="submitted" class="dictation-feedback" :class="{ 'is-correct': correct }">
      {{ correct ? '这句写对了。' : '对照原句，再听一遍会记得更牢。' }}
    </p>
  </div>
</template>
