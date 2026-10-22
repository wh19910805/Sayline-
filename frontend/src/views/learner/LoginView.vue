<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import BrandLogo from '@/components/BrandLogo.vue'
import { apiErrorMessage } from '@/api/http'
import { useAuthStore } from '@/stores/auth'
import { useCatalogStore } from '@/stores/catalog'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const catalog = useCatalogStore()

const adminMode = computed(() => route.meta.admin === true)
const registerMode = ref(false)
const phone = ref('13800138000')
const password = ref('Sayline123')
const nickname = ref('')
const showPassword = ref(false)
const error = ref('')

async function submit() {
  error.value = ''
  try {
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
          <p class="eyebrow">{{ registerMode ? 'CREATE ACCOUNT' : 'WELCOME BACK' }}</p>
          <h2>{{ registerMode ? '创建你的学习账号' : '继续你的学习' }}</h2>
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
      <div class="password-field">
        <label class="sl-field">
          <span class="sl-field__label">密码</span>
          <input
            v-model="password"
            class="sl-field__control"
            :type="showPassword ? 'text' : 'password'"
            autocomplete="current-password"
            placeholder="至少 8 个字符"
          />
        </label>
        <button class="password-field__toggle" type="button" @click="showPassword = !showPassword">
          {{ showPassword ? '隐藏' : '显示' }}
        </button>
      </div>
      <p v-if="error" class="inline-error">{{ error }}</p>
      <button class="sl-button sl-button--accent sl-button--lg sl-button--full" type="submit" :disabled="auth.loading">
        {{ auth.loading ? '请稍候…' : adminMode ? '进入管理端' : '进入 Sayline' }}
      </button>
      <button v-if="!adminMode" class="login-register" type="button" @click="registerMode = !registerMode">
        {{ registerMode ? '已有账号？' : '还没有账号？' }}
        <span>{{ registerMode ? '返回登录' : '创建一个' }}</span>
      </button>
    </form>
    <p class="login-footnote">继续即表示你同意用户协议与隐私政策</p>
  </main>
</template>
