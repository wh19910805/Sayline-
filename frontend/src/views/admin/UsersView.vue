<script setup lang="ts">
import { onMounted, ref } from 'vue'

import { apiErrorMessage } from '@/api/http'
import { adminApi } from '@/api/services'
import type { AdminUser } from '@/api/types'

const users = ref<AdminUser[]>([])
const query = ref('')
const error = ref('')

async function load() {
  try {
    users.value = (await adminApi.users(query.value.trim() || undefined)).content
  } catch (reason) {
    error.value = apiErrorMessage(reason)
  }
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
    <p v-if="error" class="inline-error">{{ error }}</p>
    <div class="admin-card">
      <table class="admin-table">
        <thead><tr><th>用户</th><th>角色</th><th>注册时间</th><th>最近登录</th><th>操作</th></tr></thead>
        <tbody>
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
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
