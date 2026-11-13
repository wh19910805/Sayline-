<script setup lang="ts">
import { onMounted, ref } from 'vue'
import SlIcon from '@/components/ui/SlIcon.vue'
import { useRouter } from 'vue-router'

import { apiErrorMessage } from '@/api/http'
import { learnerApi } from '@/api/services'
import type { Profile, SessionInfo } from '@/api/types'
import SlDialog from '@/components/ui/SlDialog.vue'
import { useAuthStore } from '@/stores/auth'
import { maskPhone } from '@/utils/format'

const router = useRouter()
const auth = useAuthStore()
const profile = ref<Profile | null>(null)
const nickname = ref('')
const avatarObjectKey = ref('')
const error = ref('')
const saved = ref(false)
const uploading = ref(false)
const sessions = ref<SessionInfo[]>([])
const newPhone = ref('')
const phonePassword = ref('')
const accountPassword = ref('')
const deleteOpen = ref(false)
const securityBusy = ref(false)

onMounted(async () => {
  try {
    profile.value = await learnerApi.profile()
    nickname.value = profile.value.nickname
    avatarObjectKey.value = profile.value.avatarUrl || ''
    sessions.value = await learnerApi.sessions()
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

async function changePhone() {
  securityBusy.value = true
  error.value = ''
  try {
    profile.value = await learnerApi.changePhone({
      currentPassword: phonePassword.value,
      newPhone: newPhone.value,
    })
    phonePassword.value = ''
    newPhone.value = ''
    saved.value = true
  } catch (reason) {
    error.value = apiErrorMessage(reason)
  } finally {
    securityBusy.value = false
  }
}

async function revokeSession(session: SessionInfo) {
  try {
    await learnerApi.revokeSession(session.id)
    sessions.value = sessions.value.filter((item) => item.id !== session.id)
  } catch (reason) {
    error.value = apiErrorMessage(reason)
  }
}

async function deleteAccount() {
  securityBusy.value = true
  error.value = ''
  try {
    await learnerApi.deleteAccount(accountPassword.value)
    await auth.logout()
    await router.replace('/login')
  } catch (reason) {
    error.value = apiErrorMessage(reason)
  } finally {
    securityBusy.value = false
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
          <p>手机号用于登录。修改前需要验证当前密码。</p>
          <div class="security-form">
            <label class="sl-field">
              <span class="sl-field__label">新手机号</span>
              <input v-model="newPhone" class="sl-field__control" inputmode="tel" autocomplete="tel" />
            </label>
            <label class="sl-field">
              <span class="sl-field__label">当前密码</span>
              <input v-model="phonePassword" class="sl-field__control" type="password" autocomplete="current-password" />
            </label>
            <button class="sl-button sl-button--secondary" type="button" :disabled="securityBusy" @click="changePhone">
              更新手机号
            </button>
          </div>
        </section>

        <section class="settings-section">
          <span class="eyebrow settings-section__eyebrow">SESSIONS</span>
          <h2>登录设备</h2>
          <div class="session-list">
            <article v-for="session in sessions" :key="session.id">
              <div>
                <strong>{{ session.current ? '当前设备' : '其他设备' }}</strong>
                <small>{{ session.userAgent || '未知浏览器' }} · {{ session.ipAddress || '未知 IP' }}</small>
                <small>最近使用：{{ new Date(session.lastUsedAt || session.createdAt).toLocaleString('zh-CN') }}</small>
              </div>
              <button class="sl-button sl-button--ghost sl-button--sm" type="button" @click="revokeSession(session)">
                退出该设备
              </button>
            </article>
            <p v-if="!sessions.length">当前没有可管理的登录会话。</p>
          </div>
        </section>
        <p v-if="error" class="inline-error">{{ error }}</p>
        <p v-if="saved" class="inline-success">个人资料已保存</p>
        <button class="sl-button sl-button--lg sl-button--full profile-save" type="submit">保存资料</button>
        <section class="danger-zone">
          <div><strong>注销账号</strong><p>注销后会清除登录身份并停用账号，学习统计以匿名形式保留。</p></div>
          <button class="sl-button sl-button--danger" type="button" @click="deleteOpen = true">注销账号</button>
        </section>
      </form>
    </div>

    <SlDialog
      :open="deleteOpen"
      title="确认注销账号？"
      eyebrow="DELETE ACCOUNT"
      description="账号会立即停用且无法恢复。请输入当前密码确认。"
      @close="deleteOpen = false"
    >
      <label class="sl-field">
        <span class="sl-field__label">当前密码</span>
        <input v-model="accountPassword" class="sl-field__control" type="password" autocomplete="current-password" />
      </label>
      <template #actions>
        <button class="sl-button sl-button--secondary" type="button" @click="deleteOpen = false">取消</button>
        <button class="sl-button sl-button--danger" type="button" :disabled="securityBusy" @click="deleteAccount">确认注销</button>
      </template>
    </SlDialog>
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

.security-form {
  display: grid;
  gap: 10px;
  margin-top: 12px;
}

.session-list {
  display: grid;
  gap: 8px;
}

.session-list article {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 11px 0;
  border-top: 1px solid var(--color-border);
}

.session-list article > div {
  min-width: 0;
  display: grid;
  gap: 3px;
}

.session-list small,
.session-list p {
  color: var(--color-text-secondary);
  font-size: 12px;
}

.danger-zone {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-top: 14px;
  padding: 16px;
  border: 1px solid color-mix(in srgb, var(--color-danger) 30%, var(--color-border));
  border-radius: var(--radius-md);
  background: var(--color-danger-soft);
}

.danger-zone p {
  max-width: 48ch;
  margin: 4px 0 0;
  color: var(--color-text-secondary);
  font-size: 12px;
  line-height: 1.5;
}
</style>
