<script setup lang="ts">
import { onMounted, ref } from 'vue'

import { apiErrorMessage } from '@/api/http'
import { adminApi } from '@/api/services'
import type { AdminUser } from '@/api/types'
import SlDialog from '@/components/ui/SlDialog.vue'
import SlErrorState from '@/components/ui/SlErrorState.vue'
import SlTable from '@/components/ui/SlTable.vue'

const users = ref<AdminUser[]>([])
const query = ref('')
const error = ref('')
const loading = ref(false)
const resetTarget = ref<AdminUser | null>(null)
const resetToken = ref('')
const resetExpiresAt = ref('')

async function load() {
  loading.value = true
  try {
    users.value = (await adminApi.users(query.value.trim() || undefined)).content
  } catch (reason) {
    error.value = apiErrorMessage(reason)
  } finally {
    loading.value = false
  }
}

async function createResetToken(user: AdminUser) {
  try {
    const result = await adminApi.issuePasswordResetToken(user.id)
    resetTarget.value = user
    resetToken.value = result.token
    resetExpiresAt.value = result.expiresAt
  } catch (reason) {
    error.value = apiErrorMessage(reason)
  }
}

async function copyResetToken() {
  await navigator.clipboard?.writeText(resetToken.value)
}

async function toggle(user: AdminUser) {
  try {
    await adminApi.setUserStatus(user.id, user.status === 'ENABLED' ? 'DISABLED' : 'ENABLED')
    await load()
  } catch (reason) {
    error.value = apiErrorMessage(reason)
  }
}

onMounted(load)
</script>

<template>
  <section>
    <header class="admin-page-head">
      <div><p class="eyebrow">LEARNERS</p><h1>用户管理</h1></div>
    </header>
    <div class="admin-actions" style="margin-bottom: 16px">
      <input v-model="query" class="sl-field__control" style="width: min(340px, 100%)" placeholder="手机号或昵称" @keyup.enter="load" />
      <button class="sl-button sl-button--secondary" type="button" @click="load">搜索</button>
    </div>
    <SlErrorState v-if="error" :message="error" title="用户列表暂时不可用" @retry="load" />
    <div class="admin-card">
      <SlTable :loading="loading" :empty="!users.length" empty-title="暂无用户" empty-description="还没有注册用户">
        <template #head><tr><th>用户</th><th>角色</th><th>注册时间</th><th>最近登录</th><th>操作</th></tr></template>
        <tr v-for="user in users" :key="user.id">
          <td><strong>{{ user.nickname }}</strong><br /><small>{{ user.phone }}</small></td>
          <td>{{ user.role }}</td>
          <td>{{ new Date(user.createdAt).toLocaleDateString('zh-CN') }}</td>
          <td>{{ user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString('zh-CN') : '—' }}</td>
          <td>
            <span class="sl-badge" :class="user.status === 'ENABLED' ? 'sl-badge--success' : 'sl-badge--warning'" style="margin-right: 8px">
              {{ user.status === 'ENABLED' ? '正常' : '已禁用' }}
            </span>
            <button class="sl-button sl-button--ghost sl-button--sm" type="button" @click="toggle(user)">
              {{ user.status === 'ENABLED' ? '禁用' : '恢复' }}
            </button>
            <button class="sl-button sl-button--secondary sl-button--sm" type="button" @click="createResetToken(user)">重置密码</button>
          </td>
        </tr>
      </SlTable>
    </div>

    <SlDialog
      :open="!!resetTarget"
      title="一次性密码重置码"
      eyebrow="PASSWORD RECOVERY"
      :description="`请将重置码安全地交给 ${resetTarget?.nickname ?? ''}。重置码 30 分钟内有效，使用后立即失效。`"
      @close="resetTarget = null"
    >
      <code class="reset-token">{{ resetToken }}</code>
      <p>有效期至 {{ resetExpiresAt ? new Date(resetExpiresAt).toLocaleString('zh-CN') : '—' }}</p>
      <template #actions>
        <button class="sl-button sl-button--secondary" type="button" @click="resetTarget = null">关闭</button>
        <button class="sl-button sl-button--accent" type="button" @click="copyResetToken">复制重置码</button>
      </template>
    </SlDialog>
  </section>
</template>

<style scoped>
.reset-token {
  display: block;
  padding: 14px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface-muted);
  overflow-wrap: anywhere;
  font-size: 14px;
}
</style>
