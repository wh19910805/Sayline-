<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'

import type { BookSummary } from '@/api/types'

const props = defineProps<{ books: BookSummary[] }>()
const emit = defineEmits<{
  open: [book: BookSummary]
}>()

const scrollEl = ref<HTMLElement | null>(null)

const MAX_TILT = 20
const TILT_FACTOR = 0.1
let raf = 0
let snapTimer: ReturnType<typeof setTimeout> | undefined

function updateBooks() {
  const container = scrollEl.value
  if (!container) return
  const eye = window.innerHeight / 2
  const els = container.querySelectorAll<HTMLElement>('.book3d')
  for (const el of els) {
    const rect = el.getBoundingClientRect()
    const center = rect.top + rect.height / 2
    const y = center - eye
    const tilt = Math.max(-MAX_TILT, Math.min(MAX_TILT, -(y * TILT_FACTOR)))
    const distance = Math.abs(y) / eye
    const scale = Math.max(0.85, 1 - distance * 0.15)
    el.style.transform = `rotateX(${tilt}deg) scale(${scale})`
    const slot = el.parentElement
    if (slot) {
      slot.style.zIndex = String(Math.max(0, Math.round((1 - distance) * 100)))
      const shadow = slot.querySelector<HTMLElement>('.book-shadow')
      if (shadow) {
        shadow.style.opacity = String(Math.max(0.15, 0.55 - distance * 0.4))
        shadow.style.transform = `scaleX(${Math.max(0.5, 1 - distance * 0.35)})`
      }
    }
  }
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
  const container = scrollEl.value
  if (!container) return
  const eye = window.innerHeight / 2
  const els = container.querySelectorAll<HTMLElement>('.book3d')
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
  container.scrollBy({ top: target, behavior: 'smooth' })
}

function bookStyle(book: BookSummary) {
  const primary = book.themeColorPrimary || '#53634e'
  const spineColor = book.spineColor || primary
  return {
    '--book-a': primary,
    '--book-b': book.themeColorSecondary || '#263128',
    '--spine-color': spineColor,
    '--spine-dark': shade(spineColor, 0.25),
    '--spine-text': textColorFor(spineColor),
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
  if (!book.coverUrl) return undefined
  return {
    backgroundImage: `url("${book.coverUrl}"), linear-gradient(150deg, var(--book-a), var(--book-b))`,
    backgroundPosition: 'center, center',
    backgroundSize: 'cover, cover',
  }
}

onMounted(() => {
  updateBooks()
  window.addEventListener('scroll', onScroll, { capture: true, passive: true })
  window.addEventListener('resize', onScroll, { passive: true })
})

watch(
  () => props.books.length,
  () => nextTick(updateBooks),
)

onBeforeUnmount(() => {
  if (raf) cancelAnimationFrame(raf)
  if (snapTimer) clearTimeout(snapTimer)
  window.removeEventListener('scroll', onScroll, { capture: true })
  window.removeEventListener('resize', onScroll)
})
</script>

<template>
  <div ref="scrollEl" class="book-shelf" @scroll.passive="onScroll">
    <div class="book-shelf__stage">
      <div v-for="book in props.books" :key="book.id" class="book-slot">
        <div
          class="book3d"
          :style="bookStyle(book)"
          role="button"
          tabindex="0"
          :aria-label="book.title"
          @click="emit('open', book)"
          @keydown.enter="emit('open', book)"
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
        </div>
        <span class="book-shadow" />
      </div>
    </div>
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
  gap: 40px;
  padding-top: 12vh;
  padding-bottom: 32vh;
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
}

.book-shadow {
  width: var(--bw);
  height: 26px;
  margin-top: -4px;
  border-radius: 50%;
  background: radial-gradient(ellipse, rgba(23, 26, 22, .45) 0%, rgba(23, 26, 22, 0) 70%);
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
}

.book3d__title {
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 15px;
  font-weight: normal;
  letter-spacing: normal;
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

@media (prefers-reduced-motion: reduce) {
  .book3d {
    transition: none;
  }
}
</style>
