import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const routes = [
  {
    path: '/login',
    component: () => import('../views/Login.vue'),
    meta: { public: true }
  },
  {
    path: '/',
    component: () => import('../layouts/AdminLayout.vue'),
    redirect: '/dashboard',
    children: [
      { path: 'dashboard', component: () => import('../views/Dashboard.vue'), meta: { title: '数据看板' } },
      { path: 'users', component: () => import('../views/Users.vue'), meta: { title: '用户管理' } },
      { path: 'patterns', component: () => import('../views/Patterns.vue'), meta: { title: '图纸管理' } },
      { path: 'banners', component: () => import('../views/Banners.vue'), meta: { title: 'Banner管理' } },
      { path: 'feedback', component: () => import('../views/Feedback.vue'), meta: { title: '反馈管理' } },
      { path: 'orders', component: () => import('../views/Orders.vue'), meta: { title: '订单管理' } },
      { path: 'vip', component: () => import('../views/VipPlans.vue'), meta: { title: 'VIP套餐' } },
      { path: 'withdraw', component: () => import('../views/Withdraw.vue'), meta: { title: '提现管理' } },
      { path: 'admins', component: () => import('../views/Admins.vue'), meta: { title: '管理员' } },
    ]
  },
  { path: '/:pathMatch(.*)*', redirect: '/' }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to) => {
  const auth = useAuthStore()
  if (!to.meta.public && !auth.isLoggedIn) {
    return '/login'
  }
  if (to.path === '/login' && auth.isLoggedIn) {
    return '/'
  }
})

export default router
