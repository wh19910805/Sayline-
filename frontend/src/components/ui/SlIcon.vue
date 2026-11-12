<script setup lang="ts">
import { computed, type Component } from 'vue'
import {
  RiAddLine,
  RiArrowDownLine,
  RiArrowDownSLine,
  RiArrowLeftLine,
  RiArrowRightSLine,
  RiArrowUpLine,
  RiBook2Fill,
  RiBook2Line,
  RiBookOpenLine,
  RiBookReadLine,
  RiChat3Line,
  RiCheckLine,
  RiCloseLine,
  RiClosedCaptioningLine,
  RiDashboardLine,
  RiDeleteBinLine,
  RiForward15Line,
  RiGitBranchLine,
  RiGraduationCapLine,
  RiGroupLine,
  RiHeadphoneLine,
  RiHeartFill,
  RiHeartLine,
  RiHistoryLine,
  RiLineChartLine,
  RiLogoutBoxLine,
  RiMicLine,
  RiPauseFill,
  RiPenNibLine,
  RiPencilLine,
  RiPlayFill,
  RiRefreshFill,
  RiRefreshLine,
  RiRepeatFill,
  RiRepeatLine,
  RiReplay15Line,
  RiSearchLine,
  RiSettings3Line,
  RiSkipBackFill,
  RiSkipBackLine,
  RiSkipForwardFill,
  RiSkipForwardLine,
  RiStopLine,
  RiTaskLine,
  RiTimeLine,
  RiUpload2Line,
  RiUserFill,
  RiUserLine,
} from '@remixicon/vue'

const props = withDefaults(
  defineProps<{
    name: string
    size?: number
    weight?: 'line' | 'fill'
  }>(),
  { size: 20, weight: 'line' },
)

const icons: Record<string, Component> = {
  'add-line': RiAddLine,
  'arrow-down-line': RiArrowDownLine,
  'arrow-down-s-line': RiArrowDownSLine,
  'arrow-left-line': RiArrowLeftLine,
  'arrow-right-s-line': RiArrowRightSLine,
  'arrow-up-line': RiArrowUpLine,
  'book-2-line': RiBook2Line,
  'book-2-fill': RiBook2Fill,
  'book-open-line': RiBookOpenLine,
  'book-read-line': RiBookReadLine,
  'chat-3-line': RiChat3Line,
  'check-line': RiCheckLine,
  'close-line': RiCloseLine,
  'closed-captioning-line': RiClosedCaptioningLine,
  'dashboard-line': RiDashboardLine,
  'delete-bin-line': RiDeleteBinLine,
  'forward-15-line': RiForward15Line,
  'git-branch-line': RiGitBranchLine,
  'graduation-cap-line': RiGraduationCapLine,
  'group-line': RiGroupLine,
  'headphone-line': RiHeadphoneLine,
  'heart-line': RiHeartLine,
  'heart-fill': RiHeartFill,
  'history-line': RiHistoryLine,
  'line-chart-line': RiLineChartLine,
  'logout-box-line': RiLogoutBoxLine,
  'mic-line': RiMicLine,
  'pause-fill': RiPauseFill,
  'pen-nib-line': RiPenNibLine,
  'pencil-line': RiPencilLine,
  'play-fill': RiPlayFill,
  'refresh-line': RiRefreshLine,
  'refresh-fill': RiRefreshFill,
  'repeat-line': RiRepeatLine,
  'repeat-fill': RiRepeatFill,
  'replay-15-line': RiReplay15Line,
  'search-line': RiSearchLine,
  'settings-3-line': RiSettings3Line,
  'skip-back-line': RiSkipBackLine,
  'skip-back-fill': RiSkipBackFill,
  'skip-forward-line': RiSkipForwardLine,
  'skip-forward-fill': RiSkipForwardFill,
  'stop-line': RiStopLine,
  'task-line': RiTaskLine,
  'time-line': RiTimeLine,
  'upload-2-line': RiUpload2Line,
  'user-line': RiUserLine,
  'user-fill': RiUserFill,
}

const icon = computed(
  () =>
    icons[`${props.name}-${props.weight}`] ??
    icons[`${props.name}-line`] ??
    null,
)
</script>

<template>
  <span
    class="sl-icon"
    :style="{ fontSize: `${size}px` }"
    aria-hidden="true"
  >
    <component :is="icon" v-if="icon" />
  </span>
</template>

<style scoped>
.sl-icon {
  width: 1em;
  height: 1em;
  display: inline-grid;
  place-items: center;
  flex: 0 0 auto;
  line-height: 1;
}

.sl-icon :deep(svg) {
  width: 1em;
  height: 1em;
  display: block;
}
</style>
