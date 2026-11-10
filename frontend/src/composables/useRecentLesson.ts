import { reactive } from 'vue'

import { learnerApi } from '@/api/services'
import type { RecentLesson } from '@/api/types'

// 模块级状态：跨页面/组件实例共享，避免每次切页重新从 null 加载导致闪烁
const state = reactive({ lesson: null as RecentLesson | null })

let inflight: Promise<void> | null = null

export function useRecentLesson() {
  function load() {
    if (inflight) return inflight
    inflight = learnerApi
      .recentLessons()
      .then((list) => {
        state.lesson = list[0] ?? null
      })
      .catch(() => {
        // 失败保留已有值，不闪
      })
      .finally(() => {
        inflight = null
      })
    return inflight
  }

  return { state, load }
}
