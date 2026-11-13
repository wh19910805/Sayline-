<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import BrandLogo from '@/components/BrandLogo.vue'
import { apiErrorMessage } from '@/api/http'
import { authApi } from '@/api/services'
import { setThemeColor, syncThemeColor } from '@/composables/useAmbient'
import { useAuthStore } from '@/stores/auth'
import { useCatalogStore } from '@/stores/catalog'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const catalog = useCatalogStore()

const adminMode = computed(() => route.meta.admin === true)
const registerMode = ref(false)
const resetMode = ref(false)
const demoLogin = import.meta.env.VITE_DEMO_LOGIN === 'true'
const phone = ref(demoLogin ? '13800138000' : '')
const password = ref(demoLogin ? 'Sayline123' : '')
const nickname = ref('')
const showPassword = ref(false)
const error = ref('')
const notice = ref('')
const resetToken = ref('')
const newPassword = ref('')

onMounted(() => setThemeColor('#171b16'))
onBeforeUnmount(syncThemeColor)

async function submit() {
  error.value = ''
  try {
    if (resetMode.value) {
      if (password.value !== newPassword.value) {
        error.value = '两次输入的新密码不一致'
        return
      }
      await authApi.resetPassword({
        phone: phone.value,
        token: resetToken.value,
        newPassword: password.value,
      })
      resetMode.value = false
      resetToken.value = ''
      newPassword.value = ''
      password.value = ''
      notice.value = '密码已重置，请重新登录'
      return
    }
    const user = registerMode.value
      ? await auth.register(phone.value, password.value, nickname.value)
      : await auth.login(phone.value, password.value)
    if (!user) return
    if (adminMode.value && user.role !== 'ADMIN') {
      await auth.logout()
      error.value = '该账号没有管理端权限'
      return
    }
    if (adminMode.value) {
      await router.replace('/admin')
      return
    }
    const interests = await catalog.loadInterests()
    await router.replace(interests.length ? '/' : '/interests')
  } catch (reason) {
    error.value = apiErrorMessage(reason)
  }
}

function toggleReset() {
  resetMode.value = !resetMode.value
  registerMode.value = false
  error.value = ''
  notice.value = ''
}
</script>

<template>
  <main class="app-screen login-screen" :data-screen="adminMode ? 'admin-login' : 'login'">
    <div class="login-ambient" aria-hidden="true">
      <span class="login-ambient__one" />
      <span class="login-ambient__two" />
      <span class="login-ambient__line" />
    </div>
    <header class="login-header">
      <BrandLogo light />
      <span class="sl-badge login-version">{{ adminMode ? '管理端 · SAYLINE STUDIO' : '成人英语 · 声音课程' }}</span>
    </header>

    <div class="login-copy">
      <p class="eyebrow">{{ adminMode ? 'SAYLINE STUDIO' : 'ONE LINE AT A TIME' }}</p>
      <h1 v-if="adminMode">把好内容，<br />一句句带进课堂。</h1>
      <h1 v-else>把英语，<br />听成自己的语言。</h1>
      <p>{{ adminMode ? '管理课程、媒体与学习者数据。' : '逐句听、读、写、说。今天只学一句，也算向前。' }}</p>
    </div>

    <form class="login-panel" @submit.prevent="submit">
      <div class="login-panel__head">
        <div>
          <p class="eyebrow">{{ resetMode ? 'ACCOUNT RECOVERY' : registerMode ? 'CREATE ACCOUNT' : 'WELCOME BACK' }}</p>
          <h2>{{ resetMode ? '重置登录密码' : registerMode ? '创建你的学习账号' : '继续你的学习' }}</h2>
        </div>
      </div>

      <label class="sl-field">
        <span class="sl-field__label">手机号</span>
        <input v-model="phone" class="sl-field__control" inputmode="tel" autocomplete="tel" placeholder="请输入手机号" />
      </label>
      <label v-if="registerMode" class="sl-field">
        <span class="sl-field__label">昵称</span>
        <input v-model="nickname" class="sl-field__control" autocomplete="nickname" placeholder="怎么称呼你" />
      </label>
      <label v-if="resetMode" class="sl-field">
        <span class="sl-field__label">管理员重置码</span>
        <input v-model="resetToken" class="sl-field__control" autocomplete="one-time-code" placeholder="输入管理员提供的重置码" />
      </label>
      <div class="password-field">
        <label class="sl-field">
          <span class="sl-field__label">{{ resetMode ? '新密码' : '密码' }}</span>
          <input
            v-model="password"
            class="sl-field__control"
            :type="showPassword ? 'text' : 'password'"
            :autocomplete="registerMode || resetMode ? 'new-password' : 'current-password'"
            :placeholder="resetMode ? '输入新密码，至少 8 个字符' : '至少 8 个字符'"
          />
        </label>
        <button
          class="password-field__toggle"
          type="button"
          :aria-label="showPassword ? '隐藏密码' : '显示密码'"
          :aria-pressed="showPassword"
          @click="showPassword = !showPassword"
        >
          {{ showPassword ? '隐藏' : '显示' }}
        </button>
      </div>
      <label v-if="resetMode" class="sl-field">
        <span class="sl-field__label">确认新密码</span>
        <input v-model="newPassword" class="sl-field__control" type="password" autocomplete="new-password" placeholder="再次输入新密码" />
      </label>
      <p v-if="error" class="inline-error">{{ error }}</p>
      <p v-if="notice" class="inline-success" aria-live="polite">{{ notice }}</p>
      <button
        class="sl-button sl-button--lg sl-button--full"
        :class="{ 'sl-button--accent': adminMode }"
        type="submit"
        :disabled="auth.loading"
      >
        {{ auth.loading ? '请稍候…' : resetMode ? '重置密码' : adminMode ? '进入管理端' : '进入 Sayline' }}
      </button>
      <button v-if="!adminMode && !resetMode" class="login-register" type="button" @click="registerMode = !registerMode">
        {{ registerMode ? '已有账号？' : '还没有账号？' }}
        <span>{{ registerMode ? '返回登录' : '创建一个' }}</span>
      </button>
      <button v-if="!adminMode" class="login-forgot" type="button" @click="toggleReset">
        {{ resetMode ? '返回登录' : '忘记密码？' }}
        <span>{{ resetMode ? '使用账号密码登录' : '使用管理员重置码' }}</span>
      </button>
      <RouterLink v-if="adminMode" class="login-register" to="/">
        不是管理员？
        <span>前往用户学习端</span>
      </RouterLink>
    </form>
    <p class="login-footnote">继续即表示你同意用户协议与隐私政策</p>
  </main>
</template>
