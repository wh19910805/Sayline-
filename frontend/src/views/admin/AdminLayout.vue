<script setup lang="ts">
import SlIcon from '@/components/ui/SlIcon.vue'
import { useRouter } from 'vue-router'

import BrandLogo from '@/components/BrandLogo.vue'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const auth = useAuthStore()

const navItems = [
  { to: '/admin', label: '数据看板', icon: 'dashboard' },
  { to: '/admin/categories', label: '分类管理', icon: 'git-branch' },
  { to: '/admin/books', label: '课程管理', icon: 'book-open' },
  { to: '/admin/courses', label: '课时管理', icon: 'task' },
  { to: '/admin/users', label: '用户管理', icon: 'group' },
]

async function logout() {
  await auth.logout()
  await router.replace('/admin/login')
}
</script>

<template>
  <div class="admin-shell">
    <div class="admin-layout">
      <aside class="admin-sidebar">
        <BrandLogo light compact />
        <nav class="admin-nav">
          <RouterLink v-for="item in navItems" :key="item.to" :to="item.to">
            <SlIcon :name="item.icon" :size="18" />
            {{ item.label }}
          </RouterLink>
        </nav>
        <RouterLink class="admin-learn-link" to="/">
          <SlIcon name="graduation-cap" :size="18" />
          进入学习端
        </RouterLink>
        <div style="margin-top: auto; display: grid; gap: 10px">
          <span style="font-size: 12px; color: rgba(255,250,240,.52)">{{ auth.user?.nickname }}</span>
          <button class="sl-button sl-button--ghost sl-button--sm" type="button" @click="logout">
            <SlIcon name="logout-box" :size="16" />
            退出管理端
          </button>
        </div>
      </aside>
      <main class="admin-main">
        <RouterView />
      </main>
    </div>
    <nav class="admin-mobile-nav" aria-label="管理端导航">
      <RouterLink v-for="item in navItems" :key="item.to" :to="item.to">
        <SlIcon :name="item.icon" :size="19" />
        {{ item.label.slice(0, 2) }}
      </RouterLink>
    </nav>
  </div>
</template>
