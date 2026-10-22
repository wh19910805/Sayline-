import { createRouter, createWebHistory } from 'vue-router'

import { pinia } from '@/stores'
import { useAuthStore } from '@/stores/auth'

const routes = [
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/learner/LoginView.vue'),
    meta: { public: true },
  },
  {
    path: '/interests',
    name: 'interests',
    component: () => import('@/views/learner/InterestSetupView.vue'),
  },
  {
    path: '/',
    name: 'home',
    component: () => import('@/views/learner/HomeView.vue'),
  },
  {
    path: '/learn/:courseId',
    name: 'player',
    component: () => import('@/views/learner/PlayerView.vue'),
  },
  {
    path: '/me',
    name: 'me',
    component: () => import('@/views/learner/MyView.vue'),
  },
  {
    path: '/me/profile',
    name: 'profile-settings',
    component: () => import('@/views/learner/ProfileSettingsView.vue'),
  },
  {
    path: '/me/learning',
    name: 'learning-settings',
    component: () => import('@/views/learner/LearningSettingsView.vue'),
  },
  {
    path: '/preferences',
    name: 'preferences',
    component: () => import('@/views/learner/PreferencesView.vue'),
  },
  {
    path: '/admin/login',
    name: 'admin-login',
    component: () => import('@/views/learner/LoginView.vue'),
    meta: { public: true, admin: true },
  },
  {
    path: '/admin',
    component: () => import('@/views/admin/AdminLayout.vue'),
    meta: { admin: true },
    children: [
      {
        path: '',
        name: 'admin-dashboard',
        component: () => import('@/views/admin/DashboardView.vue'),
      },
      {
        path: 'categories',
        name: 'admin-categories',
        component: () => import('@/views/admin/CategoriesView.vue'),
      },
      {
        path: 'courses',
        name: 'admin-courses',
        component: () => import('@/views/admin/CoursesView.vue'),
      },
      {
        path: 'courses/new',
        name: 'admin-course-new',
        component: () => import('@/views/admin/CourseEditorView.vue'),
      },
      {
        path: 'courses/:id/edit',
        name: 'admin-course-edit',
        component: () => import('@/views/admin/CourseEditorView.vue'),
      },
      {
        path: 'users',
        name: 'admin-users',
        component: () => import('@/views/admin/UsersView.vue'),
      },
    ],
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/',
  },
]

export const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 }),
})

router.beforeEach(async (to) => {
  const auth = useAuthStore(pinia)
  const user = await auth.restore()

  if (to.meta.public) {
    if (!user) return true
    if (to.meta.admin) {
      return user.role === 'ADMIN' ? '/admin' : true
    }
    return user.role === 'ADMIN' ? '/admin' : '/'
  }

  if (!user) {
    return to.meta.admin ? '/admin/login' : '/login'
  }
  if (to.meta.admin && user.role !== 'ADMIN') return '/'
  if (!to.meta.admin && user.role === 'ADMIN' && !to.path.startsWith('/admin')) return '/admin'
  return true
})
