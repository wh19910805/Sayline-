<script setup lang="ts">
import { onMounted, ref } from 'vue'
import SlIcon from '@/components/ui/SlIcon.vue'
import { useRouter } from 'vue-router'

import { apiErrorMessage } from '@/api/http'
import { learnerApi } from '@/api/services'
import type { Profile } from '@/api/types'
import { maskPhone } from '@/utils/format'

const router = useRouter()
const profile = ref<Profile | null>(null)
const nickname = ref('')
const avatarObjectKey = ref('')
const error = ref('')
const saved = ref(false)
const uploading = ref(false)

onMounted(async () => {
  try {
    profile.value = await learnerApi.profile()
    nickname.value = profile.value.nickname
    avatarObjectKey.value = profile.value.avatarUrl || ''
  } catch (reason) {
    error.value = apiErrorMessage(reason)
  }
})

async function save() {
  error.value = ''
  saved.value = false
  try {
    profile.value = await learnerApi.updateProfile({
      nickname: nickname.value.trim(),
      avatarObjectKey: avatarObjectKey.value.trim() || null,
    })
    saved.value = true
  } catch (reason) {
    error.value = apiErrorMessage(reason)
  }
}

async function uploadAvatar(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  uploading.value = true
  error.value = ''
  try {
    const presigned = await learnerApi.presignAvatar({
      fileName: file.name,
      contentType: file.type,
      sizeBytes: file.size,
    })
    const response = await fetch(presigned.uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': file.type },
      body: file,
    })
    if (!response.ok) throw new Error('头像上传失败')
    avatarObjectKey.value = presigned.objectKey
  } catch (reason) {
    error.value = apiErrorMessage(reason)
  } finally {
    uploading.value = false
  }
}
</script>

<template>
  <main class="app-screen settings-screen">
    <header class="settings-header">
      <button class="sl-icon-button" type="button" aria-label="返回" @click="router.back()"><SlIcon name="arrow-left" :size="21" /></button>
      <h1>个人资料</h1>
      <span />
    </header>
    <div class="settings-scroll">
      <form class="settings-form settings-form--profile" @submit.prevent="save">
        <div class="profile-identity">
          <span class="profile-identity__avatar">
            <img v-if="avatarObjectKey" :src="avatarObjectKey" alt="" />
            <template v-else>{{ nickname.slice(0, 1) || 'S' }}</template>
          </span>
          <span>{{ profile ? maskPhone(profile.phone) : '' }}</span>
          <label class="sl-button sl-button--secondary sl-button--sm">
            <SlIcon name="upload-2" :size="15" />
            {{ uploading ? '上传中…' : '更换头像' }}
            <input type="file" accept="image/jpeg,image/png,image/webp" hidden @change="uploadAvatar" />
          </label>
        </div>
        <section class="settings-section">
          <span class="eyebrow settings-section__eyebrow">个人资料</span>
          <h2>个人信息</h2>
          <label class="sl-field">
            <span class="sl-field__label">昵称</span>
            <input v-model="nickname" class="sl-field__control" maxlength="50" />
          </label>
          <label class="sl-field">
            <span class="sl-field__label">手机号</span>
            <input class="sl-field__control" :value="profile?.phone || ''" readonly />
          </label>
          <p>手机号用于登录，首版暂不支持修改。</p>
        </section>
        <p v-if="error" class="inline-error">{{ error }}</p>
        <p v-if="saved" class="inline-success">个人资料已保存</p>
        <button class="sl-button sl-button--lg sl-button--full profile-save" type="submit">保存资料</button>
      </form>
    </div>
  </main>
</template>

<style scoped>
.settings-screen {
  background: var(--app-bg);
}

.settings-form--profile {
  gap: 0;
  padding-top: 10px;
}

.settings-form--profile .profile-identity {
  padding-bottom: 28px;
  border-bottom: 1px solid var(--color-border);
}

.settings-form--profile .settings-section {
  padding: 25px 4px;
  border: 0;
  border-bottom: 1px solid var(--color-border);
  border-radius: 0;
  background: transparent;
}

.settings-section__eyebrow {
  margin-bottom: -4px;
}

.settings-form--profile .settings-section h2 {
  margin: 0 0 4px;
  font-family: var(--font-display);
  font-size: 30px;
  font-weight: var(--weight-regular);
  line-height: 1.05;
  letter-spacing: -.025em;
}

.profile-save {
  position: sticky;
  bottom: 12px;
  margin-top: 22px;
  background: var(--color-ink-900);
  color: var(--color-paper-50);
  box-shadow: var(--shadow-float);
}
</style>
