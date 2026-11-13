<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

import { mountGlobalAudio } from '@/composables/useGlobalAudio'

const audio = ref<HTMLAudioElement | null>(null)

onMounted(() => mountGlobalAudio(audio.value))
onBeforeUnmount(() => mountGlobalAudio(null))
</script>

<template>
  <audio ref="audio" preload="metadata" />
</template>
