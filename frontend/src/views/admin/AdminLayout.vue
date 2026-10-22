<script setup lang="ts">
import { BookOpen, FolderTree, LayoutDashboard, LogOut, UsersRound } from 'lucide-vue-next'
import { useRouter } from 'vue-router'

import BrandLogo from '@/components/BrandLogo.vue'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const auth = useAuthStore()

const navItems = [
  { to: '/admin', label: '数据看板', icon: LayoutDashboard },
  { to: '/admin/categories', label: '分类管理', icon: FolderTree },
  { to: '/admin/courses', label: '课程管理', icon: BookOpen },
  { to: '/admin/users', label: '用户管理', icon: UsersRound },
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
            <component :is="item.icon" :size="18" />
            {{ item.label }}
          </RouterLink>
        </nav>
        <div style="margin-top: auto; display: grid; gap: 10px">
          <span style="font-size: 12px; color: rgba(255,250,240,.52)">{{ auth.user?.nickname }}</span>
          <button class="sl-button sl-button--ghost sl-button--sm" type="button" @click="logout">
            <LogOut :size="16" />
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
        <component :is="item.icon" :size="19" />
        {{ item.label.slice(0, 2) }}
      </RouterLink>
    </nav>
  </div>
</template>
