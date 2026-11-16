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
  retry: []
}>()

const values = ref<string[]>([])
const root = ref<HTMLElement | null>(null)
const inputs = ref<Record<number, HTMLInputElement>>({})
const words = computed(() => dictationWords(props.sentence))
let completeTimer: ReturnType<typeof setTimeout> | undefined
let leaveTimer: ReturnType<typeof setTimeout> | undefined
let validationTimer: ReturnType<typeof setTimeout> | undefined
const reviewed = ref(false)
const attemptCount = ref(0)

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
  if (event.key === 'Enter') {
    event.preventDefault()
    validateAnswer()
    return
  }
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

const allWordsFilled = computed(() =>
  values.value.length === words.value.length &&
  values.value.every((value) => value.trim().length > 0),
)

function wordState(word: string, index: number) {
  const value = (values.value[index] ?? '').trim()
  const target = word.replace(/[^a-zA-Z0-9']/g, '')
  if (!value) return 'empty'
  if (value.toLowerCase() === target.toLowerCase()) return 'correct'
  if (value.length >= target.length || reviewed.value || props.submitted) return 'incorrect'
  return 'filling'
}

function wordStateLabel(word: string, index: number) {
  const state = wordState(word, index)
  if (state === 'correct') return `第 ${index + 1} 个单词，正确`
  if (state === 'incorrect') return `第 ${index + 1} 个单词，需要修改`
  if (state === 'filling') return `第 ${index + 1} 个单词，正在填写`
  return `第 ${index + 1} 个单词，未填写`
}

function submitAnswer() {
  if (!allWordsFilled.value || props.submitted) return
  attemptCount.value += 1
  reviewed.value = true
  emit('submit', answerText())
}

function validateAnswer() {
  if (!allWordsFilled.value || props.submitted) return
  if (correct.value) {
    emit('complete', answerText())
  } else {
    submitAnswer()
  }
}

function retry() {
  reviewed.value = false
  values.value = words.value.map(() => '')
  emit('retry')
  requestAnimationFrame(() => inputs.value[0]?.focus())
}

function submitIfLeaving() {
  if (leaveTimer) clearTimeout(leaveTimer)
  leaveTimer = setTimeout(() => {
    if (root.value?.contains(document.activeElement)) return
    const answer = answerText()
    if (allWordsFilled.value && answer.trim() && !props.submitted) {
      submitAnswer()
    }
  }, 0)
}

const correct = computed(() =>
  words.value.every(
    (word, index) =>
      (values.value[index] ?? '').toLowerCase() ===
      word.replace(/[^a-zA-Z0-9']/g, '').toLowerCase(),
  ),
)

const incorrectWordNumbers = computed(() =>
  words.value.flatMap((word, index) =>
    wordState(word, index) === 'incorrect' ? [index + 1] : [],
  ),
)

const feedbackText = computed(() => {
  if (correct.value) return '这句写对了。'
  const positions = incorrectWordNumbers.value
  if (!positions.length) return '有单词需要修改，请重新填写后再检查。'
  if (attemptCount.value >= 3) return `正确答案：${words.value.join(' ')}`
  if (attemptCount.value >= 2) {
    const hints = positions.map((position) => {
      const target = words.value[position - 1]?.replace(/[^a-zA-Z0-9']/g, '') ?? ''
      return `第 ${position} 个单词首字母 ${target.slice(0, 1)}，共 ${target.length} 个字母`
    })
    return `还需要修改：${hints.join('；')}。`
  }
  return `第 ${positions.join('、')} 个单词需要修改，请重新填写后再检查。`
})

watch([allWordsFilled, correct, () => props.submitted], ([filled, isCorrect, submitted]) => {
  if (completeTimer) {
    clearTimeout(completeTimer)
    completeTimer = undefined
  }
  if (validationTimer) {
    clearTimeout(validationTimer)
    validationTimer = undefined
  }
  if (!filled || submitted) return
  if (isCorrect) {
    completeTimer = setTimeout(() => {
      emit('complete', answerText())
    }, 500)
  } else {
    validationTimer = setTimeout(submitAnswer, 300)
  }
})

onBeforeUnmount(() => {
  if (completeTimer) clearTimeout(completeTimer)
  if (leaveTimer) clearTimeout(leaveTimer)
  if (validationTimer) clearTimeout(validationTimer)
})
</script>

<template>
  <div class="dictation">
    <div ref="root" class="sl-word-input" @focusout="submitIfLeaving">
      <label
        v-for="(word, wordIndex) in words"
        :key="`${word}-${wordIndex}`"
        class="sl-word-input__word"
        :class="`is-${wordState(word, wordIndex)}`"
        :data-word-state="wordState(word, wordIndex)"
        :style="{ '--letters': Math.max(2, word.replace(/[^a-zA-Z0-9']/g, '').length) }"
      >
        <span
          class="sl-word-input__cell"
          :style="{ width: `calc(${Math.max(2, word.replace(/[^a-zA-Z0-9']/g, '').length)} * 10px + 14px)` }"
        >
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
            :aria-invalid="wordState(word, wordIndex) === 'incorrect'"
            :disabled="submitted"
            autocomplete="off"
            autocapitalize="off"
            inputmode="text"
            spellcheck="false"
            @input="setInput(wordIndex, $event)"
            @keydown="handleKeydown(wordIndex, $event)"
          />
          <span
            v-if="wordState(word, wordIndex) === 'correct'"
            class="sl-word-input__status is-correct"
            aria-hidden="true"
          >✓</span>
          <span
            v-else-if="wordState(word, wordIndex) === 'incorrect'"
            class="sl-word-input__status is-wrong"
            aria-hidden="true"
          >×</span>
        </span>
        <span class="visually-hidden">{{ wordStateLabel(word, wordIndex) }}</span>
      </label>
    </div>
    <div v-if="submitted && !correct" class="dictation-actions">
      <button
        class="sl-button sl-button--secondary sl-button--sm"
        type="button"
        @click="retry"
      >
        重新填写
      </button>
    </div>
    <p
      v-if="submitted"
      class="dictation-feedback"
      :class="correct ? 'is-correct' : 'is-wrong'"
      role="status"
    >
      {{ feedbackText }}
    </p>
  </div>
</template>
