<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'

import type { BookSummary } from '@/api/types'
import SlIcon from '@/components/ui/SlIcon.vue'

const props = defineProps<{ books: BookSummary[] }>()
const emit = defineEmits<{
  open: [book: BookSummary]
}>()

const scrollEl = ref<HTMLElement | null>(null)
const activeBookId = ref<number | null>(props.books[0]?.id ?? null)
const activeBook = computed(
  () => props.books.find((book) => book.id === activeBookId.value) ?? props.books[0] ?? null,
)
const failedCardCovers = ref<string[]>([])
const activeBookCoverUrl = computed(() => {
  const book = activeBook.value
  if (!book) return null
  return [book.coverThumbnailUrl, book.coverUrl]
    .find((url): url is string => typeof url === 'string' && !failedCardCovers.value.includes(url)) ?? null
})

const MAX_TILT = 20
const TILT_FACTOR = 0.1
let raf = 0
let snapTimer: ReturnType<typeof setTimeout> | undefined
let scrollContainer: HTMLElement | null = null

function getScrollContainer(element: HTMLElement | null) {
  let current = element?.parentElement ?? null
  while (current) {
    const overflowY = getComputedStyle(current).overflowY
    if (overflowY === 'auto' || overflowY === 'scroll') return current
    current = current.parentElement
  }
  return document.scrollingElement as HTMLElement | null
}

function selectionAnchor() {
  return Math.min(190, Math.max(132, window.innerHeight * 0.17))
}

function updateBooks() {
  const container = scrollEl.value
  if (!container) return
  const eye = selectionAnchor()
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const els = container.querySelectorAll<HTMLElement>('.book3d')
  const measurements: Array<{
    el: HTMLElement
    slot: HTMLElement | null
    shadow: HTMLElement | null
    tilt: number
    distance: number
    scale: number
  }> = []

  for (const el of els) {
    const rect = el.getBoundingClientRect()
    const center = rect.top + rect.height / 2
    const y = center - eye
    const tilt = Math.max(-MAX_TILT, Math.min(MAX_TILT, -(y * TILT_FACTOR)))
    const distance = Math.abs(y) / eye
    const scale = Math.max(0.85, 1 - distance * 0.15)
    const slot = el.parentElement
    measurements.push({
      el,
      slot,
      shadow: slot?.querySelector<HTMLElement>('.book-shadow') ?? null,
      tilt,
      distance,
      scale,
    })
  }

  for (const { el, slot, shadow, tilt, distance, scale } of measurements) {
    el.style.transform = reduceMotion ? 'rotateX(14deg)' : `rotateX(${tilt}deg) scale(${scale})`
    if (slot) {
      slot.style.zIndex = String(Math.max(0, Math.round((1 - distance) * 100)))
      if (shadow) {
        shadow.style.opacity = String(Math.max(0.15, 0.55 - distance * 0.4))
        shadow.style.transform = `scaleX(${Math.max(0.5, 1 - distance * 0.35)})`
      }
    }
  }
  const nearest = measurements.reduce<(typeof measurements)[number] | null>(
    (current, item) => !current || item.distance < current.distance ? item : current,
    null,
  )
  if (nearest) activeBookId.value = Number(nearest.el.dataset.bookId)
}

function onBookKeydown(event: KeyboardEvent, book: BookSummary) {
  if (event.key !== 'Enter' && event.key !== ' ') return
  event.preventDefault()
  emit('open', book)
}

function onScroll() {
  if (raf) return
  raf = requestAnimationFrame(() => {
    raf = 0
    updateBooks()
    scheduleSnap()
  })
}

function scheduleSnap() {
  if (snapTimer) clearTimeout(snapTimer)
  snapTimer = setTimeout(() => {
    snapTimer = undefined
    snapToNearest()
  }, 120)
}

function snapToNearest() {
  const container = scrollContainer
  const shelf = scrollEl.value
  if (!container || !shelf) return
  const eye = selectionAnchor()
  const els = shelf.querySelectorAll<HTMLElement>('.book3d')
  let nearest: { el: HTMLElement; distance: number } | null = null
  for (const el of els) {
    const rect = el.getBoundingClientRect()
    const center = rect.top + rect.height / 2
    const distance = Math.abs(center - eye)
    if (!nearest || distance < nearest.distance) {
      nearest = { el, distance }
    }
  }
  if (!nearest) return
  const rect = nearest.el.getBoundingClientRect()
  const target = rect.top + rect.height / 2 - eye
  const snapThreshold = Math.min(110, Math.max(56, eye * 0.5))
  if (nearest.distance > snapThreshold) return
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  container.scrollBy({ top: target, behavior: reduceMotion ? 'auto' : 'smooth' })
}

function bookStyle(book: BookSummary) {
  const primary = book.themeColorPrimary || '#53634e'
  const spine = book.spineColor ? spinePalette(book.spineColor) : null
  return {
    '--book-a': primary,
    '--book-b': book.themeColorSecondary || '#263128',
    '--spine-color': spine?.color ?? primary,
    '--spine-dark': spine?.dark ?? shade(primary, 0.32),
    '--spine-text': spine ? '#fffaf0' : textColorFor(primary),
  }
}

/** 从封面主色提取书脊色：提饱和 + 压暗，得到深邃且贴合封面的颜色。 */
function spinePalette(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)))
  const mean = (r + g + b) / 3
  const sr = clamp(mean + (r - mean) * 1.8)
  const sg = clamp(mean + (g - mean) * 1.8)
  const sb = clamp(mean + (b - mean) * 1.8)
  return {
    color: `rgb(${clamp(sr * 0.5)}, ${clamp(sg * 0.5)}, ${clamp(sb * 0.5)})`,
    dark: `rgb(${clamp(sr * 0.34)}, ${clamp(sg * 0.34)}, ${clamp(sb * 0.34)})`,
  }
}

function shade(hex: string, amount: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  const f = (v: number) => Math.max(0, Math.min(255, Math.round(v * (1 - amount))))
  return `rgb(${f(r)}, ${f(g)}, ${f(b)})`
}

function textColorFor(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return 0.299 * r + 0.587 * g + 0.114 * b > 150 ? '#171a16' : '#fffaf0'
}

function coverImageStyle(book: BookSummary) {
  const cover = book.coverThumbnailUrl || book.coverUrl
  if (!cover) return undefined
  return {
    backgroundImage: `url("${cover}"), linear-gradient(150deg, var(--book-a), var(--book-b))`,
    backgroundPosition: 'center, center',
    backgroundSize: 'cover, cover',
  }
}

function onCardCoverError(url: string) {
  failedCardCovers.value = [...new Set([...failedCardCovers.value, url])]
}

function selectionStyle(book: BookSummary) {
  return {
    '--selection-accent': book.themeColorPrimary || '#53634e',
  }
}

onMounted(() => {
  updateBooks()
  scrollContainer = getScrollContainer(scrollEl.value)
  scrollContainer?.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('resize', onScroll, { passive: true })
})

watch(
  () => props.books.map((book) => book.id).join(','),
  () => {
    if (!props.books.some((book) => book.id === activeBookId.value)) {
      activeBookId.value = props.books[0]?.id ?? null
    }
    nextTick(updateBooks)
  },
)

onBeforeUnmount(() => {
  if (raf) cancelAnimationFrame(raf)
  if (snapTimer) clearTimeout(snapTimer)
  scrollContainer?.removeEventListener('scroll', onScroll)
  window.removeEventListener('resize', onScroll)
})
</script>

<template>
  <div ref="scrollEl" class="book-shelf" @scroll.passive="onScroll">
    <div class="book-shelf__stage" :class="{ 'is-single': props.books.length === 1 }">
      <button
        v-for="book in props.books"
        :key="book.id"
        class="book-slot"
        :class="{ 'is-active': activeBookId === book.id }"
        type="button"
        :aria-label="`${book.title}，${book.lessonCount} 课时，进度 ${book.progress}%`"
        @click="emit('open', book)"
        @keydown="onBookKeydown($event, book)"
      >
        <span
          class="book3d"
          :style="bookStyle(book)"
          :data-book-id="book.id"
        >
          <span class="book3d__face book3d__top" :style="coverImageStyle(book)">
            <span v-if="!book.coverUrl" class="book3d__cover-mark">EN</span>
          </span>
          <span class="book3d__face book3d__spine">
            <span class="book3d__title">{{ book.title }}</span>
          </span>
          <span class="book3d__face book3d__bottom" :style="coverImageStyle(book)" />
          <span class="book3d__face book3d__side" />
          <span class="book3d__face book3d__side-left" />
          <span class="book3d__face book3d__back" />
        </span>
        <span class="book-shadow" />
      </button>
    </div>

    <Transition name="book-selection" mode="out-in">
      <section
        v-if="activeBook"
        :key="activeBook.id"
        class="book-selection-card"
        :style="selectionStyle(activeBook)"
        aria-live="polite"
      >
        <span class="book-selection-card__cover-frame" aria-hidden="true">
          <span class="book-selection-card__cover-fallback">
            <SlIcon name="book-open" :size="20" />
          </span>
          <img
            v-if="activeBookCoverUrl"
            :key="activeBookCoverUrl"
            :src="activeBookCoverUrl"
            alt=""
            @error="onCardCoverError(activeBookCoverUrl)"
          />
        </span>
        <span class="book-selection-card__copy">
          <strong>{{ activeBook.title }}</strong>
          <small>{{ activeBook.lessonCount }} 课时</small>
        </span>
        <button
          class="book-selection-card__action"
          :class="{ 'is-disabled': activeBook.lessonCount === 0 }"
          type="button"
          :disabled="activeBook.lessonCount === 0"
          :aria-label="activeBook.lessonCount === 0
            ? `内容准备中：${activeBook.title}`
            : `${activeBook.progress > 0 ? '继续学习' : '开始学习'}：${activeBook.title}`"
          @click="emit('open', activeBook)"
        >
          {{ activeBook.lessonCount === 0 ? '准备中' : activeBook.progress > 0 ? '继续' : '开始' }}
          <SlIcon :name="activeBook.lessonCount === 0 ? 'time' : 'arrow-right-s'" :size="15" />
        </button>
      </section>
    </Transition>
  </div>
</template>

<style scoped>
.book-shelf {
  position: relative;
  padding: 10px 20px 30px;
  scrollbar-width: none;
}

.book-shelf::-webkit-scrollbar {
  display: none;
}

.book-shelf__stage {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding-top: clamp(24px, 4dvh, 40px);
  padding-bottom: calc(72dvh + 96px);
}

.book-shelf__stage.is-single {
  min-height: 0;
  justify-content: flex-start;
  padding-top: clamp(24px, 4dvh, 40px);
  padding-bottom: 40px;
}

.book-slot {
  --bw: clamp(280px, calc(100vw - 96px), 450px);
  --bd: calc(var(--bw) * 240 / 340);
  --bh: 24px;
  position: relative;
  flex: 0 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  perspective: 800px;
  width: var(--bw);
  min-height: 84px;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--color-text);
  text-align: left;
  cursor: pointer;
}

.book-shadow {
  width: var(--bw);
  height: 26px;
  margin-top: -4px;
  border-radius: 50%;
  background: radial-gradient(ellipse, rgba(26, 26, 24, .45) 0%, rgba(26, 26, 24, 0) 70%);
  filter: blur(4px);
  transition: opacity .2s ease, transform .2s ease;
}

/* 真实 3D 书 */
.book3d {
  position: relative;
  width: var(--bw);
  height: var(--bh);
  transform-style: preserve-3d;
  transform: rotateX(14deg);
  will-change: transform;
  cursor: pointer;
  transition: filter var(--duration-fast) var(--ease-out);
}

.book3d:active {
  filter: brightness(.94) saturate(.96);
}

.book-slot:focus-visible {
  outline: 2px solid var(--color-action);
  outline-offset: 12px;
  border-radius: 14px;
}

.book3d__face {
  position: absolute;
  left: 50%;
  top: 50%;
  backface-visibility: hidden;
  border: 1px solid transparent;
}

.book3d__spine {
  width: var(--bw);
  height: var(--bh);
  transform: translate(-50%, -50%) translateZ(calc(var(--bd) / 2));
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 14px;
  background: linear-gradient(
    90deg,
    var(--spine-dark, var(--book-a)),
    var(--spine-color, var(--book-a)),
    var(--spine-dark, var(--book-a))
  );
  color: var(--spine-text, #fffaf0);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, .28), inset 0 -1px 0 rgba(0, 0, 0, .35);
  white-space: nowrap;
  overflow: hidden;
  border-radius: 0;
  background-clip: padding-box;
}

.book3d__title {
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 14px;
  font-weight: 400;
  letter-spacing: .05em;
  text-shadow: 0 1px 1px rgba(0, 0, 0, .22);
}

.book3d__top {
  width: var(--bw);
  height: var(--bd);
  transform: translate(-50%, -50%) rotateX(90deg) translateZ(calc(var(--bh) / 2));
  background: linear-gradient(150deg, var(--book-a), var(--book-b));
  display: flex;
  align-items: center;
  justify-content: center;
}

.book3d__cover-mark {
  font-size: 34px;
  font-weight: 800;
  letter-spacing: .06em;
  color: rgba(255, 250, 240, .85);
  text-shadow: 0 2px 8px rgba(0, 0, 0, .3);
}

.book3d__bottom {
  width: var(--bw);
  height: var(--bd);
  transform: translate(-50%, -50%) rotateX(-90deg) translateZ(calc(var(--bh) / 2));
  background: linear-gradient(150deg, var(--book-a), var(--book-b));
}

.book3d__side {
  width: var(--bd);
  height: var(--bh);
  transform: translate(-50%, -50%) rotateY(90deg) translateZ(calc(var(--bw) / 2));
  background: #f1ece0;
}

.book3d__side-left {
  width: var(--bd);
  height: var(--bh);
  transform: translate(-50%, -50%) rotateY(-90deg) translateZ(calc(var(--bw) / 2));
  background: #f1ece0;
}

.book3d__back {
  width: var(--bw);
  height: var(--bh);
  transform: translate(-50%, -50%) translateZ(calc(-1 * var(--bd) / 2));
  background: #ece5d6;
}

.book-slot.is-active .book3d__spine {
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, .38),
    inset 0 -1px 0 rgba(0, 0, 0, .38),
    0 0 0 1px rgba(255, 250, 240, .2);
}

.book-selection-card {
  position: fixed;
  z-index: 200;
  left: 50%;
  bottom: calc(84px + var(--safe-bottom));
  width: min(calc(100% - 40px), 450px);
  display: grid;
  grid-template-columns: 76px minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px;
  min-height: 78px;
  padding: 10px 11px 10px 10px;
  border: 1px solid var(--color-border);
  border-radius: 999px;
  background-color: color-mix(in srgb, var(--color-bg-elevated) 80%, transparent);
  background-image: linear-gradient(
    118deg,
    color-mix(in srgb, var(--selection-accent, var(--color-action)) 6%, transparent),
    transparent 42%
  );
  box-shadow:
    0 14px 30px rgba(26, 26, 24, .12),
    inset 0 1px 0 rgba(255, 255, 255, .72);
  -webkit-backdrop-filter: blur(22px) saturate(1.12);
  backdrop-filter: blur(22px) saturate(1.12);
  transform: translateX(-50%);
}

.book-selection-card__cover-frame {
  position: relative;
  width: 76px;
  aspect-ratio: 7 / 5;
  overflow: hidden;
  border: 1px solid color-mix(in srgb, var(--selection-accent, var(--color-action)) 24%, white);
  border-radius: 999px;
  background-color: var(--selection-accent, var(--color-action));
  box-shadow:
    0 7px 14px color-mix(in srgb, var(--selection-accent, var(--color-action)) 18%, transparent),
    inset 0 0 0 1px rgba(255, 255, 255, .16);
}

.book-selection-card__cover-frame img,
.book-selection-card__cover-fallback {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
}

.book-selection-card__cover-fallback {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  color: rgba(255, 250, 240, .86);
}

.book-selection-card__copy {
  min-width: 0;
  display: grid;
  gap: 3px;
}

.book-selection-card__copy > strong {
  overflow: hidden;
  color: var(--color-text);
  font-size: 17px;
  font-weight: var(--weight-semibold);
  line-height: 1.3;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.book-selection-card__copy > small {
  color: var(--color-text-tertiary);
  font-size: 11px;
  font-weight: var(--weight-medium);
  line-height: 1.35;
}

.book-selection-card__action {
  min-width: 68px;
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 2px;
  padding: 0 11px;
  border: 0;
  border-radius: 999px;
  background: var(--color-text);
  color: var(--color-bg-elevated);
  font-size: 12px;
  font-weight: var(--weight-semibold);
  cursor: pointer;
  box-shadow: 0 5px 14px rgba(26, 26, 24, .18);
  transition:
    transform var(--duration-fast) var(--ease-out),
    box-shadow var(--duration-fast) var(--ease-out);
}

.book-selection-card__action:active {
  transform: scale(.96);
  box-shadow: 0 2px 7px rgba(26, 26, 24, .14);
}

.book-selection-card__action.is-disabled {
  background: var(--color-surface-muted);
  color: var(--color-text-tertiary);
  box-shadow: none;
  cursor: default;
}

.book-selection-card__action:disabled {
  opacity: 1;
}

.book-selection-card__action.is-disabled:active {
  transform: none;
}

.book-selection-enter-active,
.book-selection-leave-active {
  transition:
    opacity var(--duration-fast) var(--ease-out),
    transform var(--duration-fast) var(--ease-out);
}

.book-selection-enter-from,
.book-selection-leave-to {
  opacity: 0;
  transform: translate(-50%, 6px);
}

@media (min-width: 768px) {
  .book-selection-card {
    bottom: calc(96px + var(--safe-bottom));
  }
}

@media (prefers-reduced-motion: reduce) {
  .book3d {
    transition: none;
  }

  .book-shadow {
    transition: none;
  }

  .book-selection-enter-active,
  .book-selection-leave-active {
    transition: none;
  }
}
</style>
