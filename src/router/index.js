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
      { path: 'patterns', component: () => import('../views/Patterns.vue'), meta: { title: '创作者图纸管理' } },
      { path: 'user-boxes', component: () => import('../views/UserBoxes.vue'), meta: { title: '用户图纸箱' } },
      { path: 'user-drafts', component: () => import('../views/UserDrafts.vue'), meta: { title: '用户草稿箱' } },
      { path: 'user-history', component: () => import('../views/UserHistory.vue'), meta: { title: '用户时光机' } },
      { path: 'bead-library', component: () => import('../views/BeadLibrary.vue'), meta: { title: '品牌色盘色码' } },
      { path: 'banners', component: () => import('../views/Banners.vue'), meta: { title: 'Banner管理' } },
      { path: 'tutorials', component: () => import('../views/Tutorials.vue'), meta: { title: '魔法小课堂' } },
      { path: 'feedback', component: () => import('../views/Feedback.vue'), meta: { title: '反馈管理' } },
      { path: 'orders', component: () => import('../views/Orders.vue'), meta: { title: '订单管理' } },
      { path: 'vip-packages', component: () => import('../views/VipPackages.vue'), meta: { title: '会员套餐配置' } },
      { path: 'card-packages', component: () => import('../views/CardPackages.vue'), meta: { title: '次卡套餐配置' } },
      { path: 'gift-types', component: () => import('../views/GiftTypes.vue'), meta: { title: '礼品类型管理' } },
      { path: 'gift-packages', component: () => import('../views/GiftPackages.vue'), meta: { title: '礼品包管理' } },
      { path: 'privileges', component: () => import('../views/Privileges.vue'), meta: { title: '权益配置' } },
      { path: 'task-center', component: () => import('../views/TaskCenter.vue'), meta: { title: '任务中心管理' } },
      { path: 'review-tasks', component: () => import('../views/ReviewTasks.vue'), meta: { title: '审核任务管理' } },
      { path: 'checkin-config', component: () => import('../views/CheckinConfig.vue'), meta: { title: '签到配置' } },
      { path: 'activity-center', component: () => import('../views/ActivityCenter.vue'), meta: { title: '活动中心管理' } },
      { path: 'admins', component: () => import('../views/Admins.vue'), meta: { title: '管理员' } },
      { path: 'dict-manage', component: () => import('../views/DictManage.vue'), meta: { title: '字典管理' } },
      { path: 'watermark', component: () => import('../views/Watermark.vue'), meta: { title: '水印配置' } },
      { path: 'popup', component: () => import('../views/Popup.vue'), meta: { title: '弹窗管理' } },
      { path: 'ai-magic-style', component: () => import('../views/AiMagicStyle.vue'), meta: { title: 'AI魔法风格' } },
      { path: 'notification-templates', component: () => import('../views/NotificationTemplates.vue'), meta: { title: '消息模板配置' } },
      { path: 'ai-size-presets', component: () => import('../views/AiSizePresets.vue'), meta: { title: 'AI图纸尺寸档位' } },
      { path: 'ai-prompt-test', component: () => import('../views/AiPromptTest.vue'), meta: { title: 'AI Prompt Test' } },
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
