<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'

import { dictationWords, getLetterStates } from '@/utils/dictation'

const props = defineProps<{
  sentence: string
  submitted: boolean
}>()

const emit = defineEmits<{
  submit: [answer: string]
}>()

const values = ref<string[]>([])
const root = ref<HTMLElement | null>(null)
const words = computed(() => dictationWords(props.sentence))

function ensureValues() {
  if (values.value.length !== words.value.length) {
    values.value = words.value.map((_, index) => values.value[index] ?? '')
  }
}
ensureValues()

function setInput(index: number, event: Event) {
  const value = (event.target as HTMLInputElement).value.replace(/\s+/g, '')
  values.value[index] = value
  ;(event.target as HTMLInputElement).value = value
}

function letterStates(word: string, index: number) {
  return getLetterStates(values.value[index] ?? '', word)
}

function submitIfLeaving() {
  nextTick(() => {
    setTimeout(() => {
      if (root.value?.contains(document.activeElement)) return
      const answer = words.value.map((_, index) => values.value[index] ?? '').join(' ')
      if (answer.trim()) emit('submit', answer)
    }, 0)
  })
}

const correct = computed(() =>
  words.value.every(
    (word, index) =>
      (values.value[index] ?? '').toLowerCase() ===
      word.replace(/[^a-zA-Z0-9']/g, '').toLowerCase(),
  ),
)
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
            :value="values[wordIndex]"
            :aria-label="`第 ${wordIndex + 1} 个单词`"
            :disabled="submitted"
            autocomplete="off"
            autocapitalize="off"
            inputmode="text"
            spellcheck="false"
            @input="setInput(wordIndex, $event)"
          />
        </span>
      </label>
    </div>
    <p v-if="submitted" class="dictation-feedback" :class="{ 'is-correct': correct }">
      {{ correct ? '这句写对了。' : '对照原句，再听一遍会记得更牢。' }}
    </p>
  </div>
</template>
