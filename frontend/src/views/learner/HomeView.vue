<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import SlIcon from '@/components/ui/SlIcon.vue'
import { useRouter } from 'vue-router'

import AppBottomNav from '@/components/AppBottomNav.vue'
import BookShelf from '@/components/course/BookShelf.vue'
import SlEmpty from '@/components/ui/SlEmpty.vue'
import SlErrorState from '@/components/ui/SlErrorState.vue'
import SlSkeleton from '@/components/ui/SlSkeleton.vue'
import { apiErrorMessage } from '@/api/http'
import { learnerApi } from '@/api/services'
import type { BookSummary, CueSearchResult, CourseSummary, SearchResponse } from '@/api/types'
import { useScrollMemory } from '@/composables/useScrollMemory'
import { useCatalogStore } from '@/stores/catalog'
import { useBookEnter } from '@/composables/useBookEnter'

const router = useRouter()
const catalog = useCatalogStore()
const { enter } = useBookEnter()
const homeScroll = ref<HTMLElement | null>(null)
const savedSearch = sessionStorage.getItem('sayline:home-search') ?? ''
const searchOpen = ref(Boolean(savedSearch.trim()))
const searchTerm = ref(savedSearch)
const searchResponse = ref<SearchResponse | null>(null)
const searchLoading = ref(false)
const searchError = ref('')
const error = ref('')
let searchTimer: ReturnType<typeof setTimeout> | undefined
let searchController: AbortController | undefined

const searchActive = computed(() => searchTerm.value.trim().length > 0)
const searchCount = computed(() => {
  const result = searchResponse.value
  return result ? result.books.length + result.lessons.length + result.cues.length : 0
})
const scrollMemory = useScrollMemory(
  homeScroll,
  () => `home:${String(catalog.selectedCategoryId)}`,
)

const emptyState = computed(() => {
  if (catalog.selectedCategoryId === 'favorite') {
    return { title: '还没有收藏的书', description: '点亮书上的爱心，喜欢的书会留在这里。' }
  }
  return { title: '这个分类还在准备中', description: '管理员发布书籍后会出现在这里。' }
})

async function loadCatalog() {
  error.value = ''
  try {
    await catalog.loadInterests()
    await catalog.loadBooks()
    await scrollMemory.restore()
    scrollMemory.attach()
  } catch (reason) {
    error.value = apiErrorMessage(reason)
  }
}

onMounted(loadCatalog)
onBeforeUnmount(() => searchController?.abort())

watch(searchTerm, (value) => {
  if (searchTimer) clearTimeout(searchTimer)
  searchController?.abort()
  searchResponse.value = null
  searchError.value = ''
  if (!value.trim()) {
    searchLoading.value = false
    sessionStorage.removeItem('sayline:home-search')
    return
  }
  sessionStorage.setItem('sayline:home-search', value.trim())
  searchLoading.value = true
  searchTimer = setTimeout(async () => {
    const controller = new AbortController()
    searchController = controller
    try {
      const response = await learnerApi.search(value.trim(), controller.signal)
      if (!controller.signal.aborted) searchResponse.value = response
    } catch (reason) {
      if (!controller.signal.aborted) searchError.value = apiErrorMessage(reason)
    } finally {
      if (!controller.signal.aborted) searchLoading.value = false
    }
  }, 250)
}, { immediate: true })

function toggleSearch() {
  searchOpen.value = !searchOpen.value
  if (!searchOpen.value) {
    searchController?.abort()
    searchTerm.value = ''
    sessionStorage.removeItem('sayline:home-search')
    searchResponse.value = null
    searchLoading.value = false
  }
}

function openBook(book: BookSummary) {
  enter(
    {
      coverUrl: book.coverUrl || null,
      primary: book.themeColorPrimary || '#53634e',
      secondary: book.themeColorSecondary || '#263128',
    },
    () => router.push(`/learn/${book.id}`),
  )
}

function openLesson(lesson: CourseSummary) {
  router.push(`/learn/${lesson.bookId}/${lesson.id}`)
}

function openCue(cue: CueSearchResult) {
  router.push(`/learn/${cue.bookId}/${cue.courseId}?cue=${cue.cueId}&mode=WRITE`)
}

function retrySearch() {
  const value = searchTerm.value
  searchTerm.value = ''
  Promise.resolve().then(() => {
    searchTerm.value = value
  })
}

function goTab(value: 'home' | 'me') {
  router.push(value === 'home' ? '/' : '/me')
}

function bookStyle(book: BookSummary) {
  return {
    '--book-a': book.themeColorPrimary || '#53634e',
    '--book-b': book.themeColorSecondary || '#263128',
  }
}

function coverImageStyle(book: BookSummary) {
  const cover = book.coverThumbnailUrl || book.coverUrl
  return cover
    ? { backgroundImage: `url("${cover}")`, backgroundPosition: 'center', backgroundSize: 'cover' }
    : undefined
}

function searchCoverStyle(book: BookSummary) {
  const cover = book.coverThumbnailUrl || book.coverUrl
  return {
    backgroundImage: cover
      ? `url("${cover}")`
      : `linear-gradient(135deg, ${book.themeColorPrimary || '#53634e'}, ${book.themeColorSecondary || '#263128'})`,
  }
}

function tabLabel(name: string) {
  return name.replace(/日常|英语|训练/g, '') || name
}
</script>

<template>
  <main class="app-screen home-screen">
    <div ref="homeScroll" class="home-scroll learner-home-scroll">
      <div class="home-tabs-row">
        <div class="sl-tabs home-tabs" role="tablist" aria-label="课程分类">
          <button
            v-for="category in catalog.interests"
            :key="category.id"
            class="sl-tab"
            type="button"
            role="tab"
            data-test="category-tab"
            :aria-selected="catalog.selectedCategoryId === category.id"
            @click="catalog.selectCategory(category.id)"
          >
            {{ tabLabel(category.name) }}
          </button>
          <button
            class="sl-tab"
            type="button"
            role="tab"
            :aria-selected="catalog.selectedCategoryId === 'favorite'"
            @click="catalog.selectCategory('favorite')"
          >
            我喜欢
          </button>
        </div>
        <button class="sl-icon-button home-search-toggle" type="button" :aria-label="searchOpen ? '关闭搜索' : '搜索课程'" @click="toggleSearch">
          <SlIcon v-if="searchOpen" name="close" :size="20" />
          <SlIcon name="search" v-else :size="20" />
        </button>
      </div>

      <label v-if="searchOpen" class="home-search-bar">
        <SlIcon name="search" :size="18" />
        <input
          v-model="searchTerm"
          autofocus
          type="search"
          aria-label="搜索书籍、课时和字幕"
          placeholder="搜索书籍、课时和字幕"
        />
        <span>{{ searchLoading ? '搜索中' : searchResponse ? `${searchCount} 条` : '键入关键词' }}</span>
      </label>

      <div v-if="searchActive" class="search-results" aria-live="polite">
        <SlSkeleton v-if="searchLoading" :rows="5" />
        <SlErrorState
          v-else-if="searchError"
          :message="searchError"
          title="搜索暂时不可用"
          @retry="retrySearch"
        />
        <SlEmpty
          v-else-if="searchResponse && searchCount === 0"
          title="没有找到相关内容"
          description="试试课程名、分类或字幕里的英文单词。"
        />
        <template v-else-if="searchResponse">
          <section v-if="searchResponse.books.length" class="search-group">
            <h2>书籍</h2>
            <button
              v-for="book in searchResponse.books"
              :key="`book-${book.id}`"
              class="search-result"
              type="button"
              @click="openBook(book)"
            >
              <span class="search-result__cover" :style="searchCoverStyle(book)" />
              <span class="search-result__copy">
                <strong>{{ book.title }}</strong>
                <small>{{ book.categoryName }} · {{ book.lessonCount }} 课时</small>
              </span>
              <SlIcon name="arrow-right-s" :size="18" />
            </button>
          </section>
          <section v-if="searchResponse.lessons.length" class="search-group">
            <h2>课时</h2>
            <button
              v-for="lesson in searchResponse.lessons"
              :key="`lesson-${lesson.id}`"
              class="search-result"
              type="button"
              @click="openLesson(lesson)"
            >
              <span class="search-result__kind"><SlIcon name="headphone" :size="19" /></span>
              <span class="search-result__copy">
                <strong>{{ lesson.title }}</strong>
                <small>{{ lesson.categoryName }}</small>
              </span>
              <SlIcon name="arrow-right-s" :size="18" />
            </button>
          </section>
          <section v-if="searchResponse.cues.length" class="search-group">
            <h2>字幕</h2>
            <button
              v-for="cue in searchResponse.cues"
              :key="`cue-${cue.cueId}`"
              class="search-result search-result--cue"
              type="button"
              @click="openCue(cue)"
            >
              <span class="search-result__kind"><SlIcon name="closed-captioning" :size="19" /></span>
              <span class="search-result__copy">
                <strong lang="en">{{ cue.englishText }}</strong>
                <small>{{ cue.bookTitle }} · {{ cue.courseTitle }}</small>
                <span lang="zh">{{ cue.chineseText }}</span>
              </span>
              <SlIcon name="arrow-right-s" :size="18" />
            </button>
          </section>
        </template>
      </div>

      <SlErrorState
        v-else-if="error"
        :message="error"
        title="书架暂时没有加载出来"
        @retry="loadCatalog"
      />

      <SlSkeleton v-else-if="catalog.loading" :rows="6" />

      <BookShelf v-else-if="catalog.books.length" :books="catalog.books" @open="openBook" />

      <div v-else>
        <SlEmpty :title="emptyState.title" :description="emptyState.description">
          <template #icon><SlIcon name="heart" :size="24" /></template>
        </SlEmpty>
      </div>
    </div>

    <AppBottomNav value="home" @navigate="goTab" />
  </main>
</template>

<style scoped>
.home-tabs-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 0 -20px;
  padding: calc(18px + var(--safe-top)) 20px 0;
  z-index: 1000;
}

/* 透明顶栏 + 封面滚动时，给 Tab 文字铺一层很淡的暖白渐变遮罩，保证可读又不破坏沉浸感 */
.home-tabs-row::before {
  content: "";
  position: absolute;
  inset: 0 0 -32px;
  z-index: -1;
  background: linear-gradient(to bottom, var(--app-bg) 0, var(--app-bg) 62%, transparent);
  pointer-events: none;
}

.home-tabs {
  min-width: 0;
  flex: 1;
}

.home-search-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
  padding: 10px 12px;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  background: var(--color-bg-elevated);
}

.home-search-bar input {
  flex: 1;
  min-width: 0;
  border: 0;
  background: transparent;
  color: var(--color-text);
  font-size: 14px;
  outline: none;
}

.home-search-bar span {
  color: var(--color-text-tertiary);
  font-size: 11px;
}

.search-results {
  min-height: 240px;
  padding-top: 18px;
}

.search-group {
  display: grid;
  gap: 8px;
  margin-bottom: 24px;
}

.search-group h2 {
  margin: 0 0 2px;
  color: var(--color-text-tertiary);
  font-size: var(--text-caption);
  font-weight: var(--weight-semibold);
  letter-spacing: .08em;
}

.search-result {
  width: 100%;
  min-height: 68px;
  display: grid;
  grid-template-columns: 44px minmax(0, 1fr) 24px;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-bg-elevated);
  color: var(--color-text);
  text-align: left;
  cursor: pointer;
}

.search-result--cue {
  align-items: start;
}

.search-result__cover,
.search-result__kind {
  width: 44px;
  height: 44px;
  border-radius: 9px;
  background-position: center;
  background-size: cover;
}

.search-result__kind {
  display: grid;
  place-items: center;
  background: var(--color-surface-muted);
  color: var(--color-action);
}

.search-result__copy {
  min-width: 0;
  display: grid;
  gap: 4px;
}

.search-result__copy strong {
  font-size: 14px;
  line-height: 1.4;
}

.search-result__copy small,
.search-result__copy span {
  overflow: hidden;
  color: var(--color-text-tertiary);
  font-size: var(--text-caption);
  line-height: 1.45;
  text-overflow: ellipsis;
}

.search-result:active {
  transform: scale(.99);
}

.book-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 14px;
  padding-top: 18px;
}

.book-card {
  position: relative;
  display: grid;
  gap: 10px;
  padding: 0 0 12px;
  border: 0;
  border-radius: 12px;
  background: var(--color-bg-elevated);
  text-align: left;
  cursor: pointer;
  box-shadow: var(--shadow-float);
}

.book-card__cover {
  display: grid;
  place-items: center;
  aspect-ratio: 3 / 4;
  border-radius: 12px 12px 0 0;
  background: linear-gradient(135deg, var(--book-a), var(--book-b));
  color: rgba(255, 250, 240, .7);
}

.book-card__body {
  display: grid;
  gap: 5px;
  padding: 0 12px;
}

.book-card__title {
  font-size: 14px;
  font-weight: var(--weight-semibold);
  line-height: 1.3;
}

.book-card__meta {
  color: var(--color-text-secondary);
  font-size: 11px;
}

.book-card__progress {
  margin-top: 2px;
}

.book-card__heart {
  position: absolute;
  top: 8px;
  right: 8px;
  color: rgba(255, 250, 240, .9);
  filter: drop-shadow(0 1px 3px rgba(0, 0, 0, .4));
}

@media (min-width: 768px) {
  .home-tabs-row {
    margin-inline: 0;
    padding-inline: 0;
  }

  .book-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

@media (min-width: 1200px) {
  .home-tabs-row {
    width: min(calc(100% - 96px), 1180px);
    margin-inline: auto;
    padding-inline: 0;
  }
}
</style>
