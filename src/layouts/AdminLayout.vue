<template>
  <el-container class="layout">
    <el-aside width="220px" class="sidebar">
      <div class="logo">
        <span class="logo-icon">🪄</span>
        <span class="logo-text">拼豆魔法屋</span>
      </div>
      <el-menu
        :default-active="$route.path"
        router
        background-color="#1a1d27"
        text-color="#8b90a7"
        active-text-color="#f5a623"
      >
        <el-menu-item-group title="概览">
          <el-menu-item index="/dashboard"><el-icon><DataAnalysis/></el-icon>数据看板</el-menu-item>
        </el-menu-item-group>
        <el-menu-item-group title="内容管理">
          <el-menu-item index="/users"><el-icon><User/></el-icon>用户管理</el-menu-item>
          <el-menu-item index="/patterns"><el-icon><Picture/></el-icon>创作者图纸</el-menu-item>
          <el-menu-item index="/user-patterns"><el-icon><Tickets/></el-icon>用户图纸</el-menu-item>
          <el-menu-item index="/bead-library"><el-icon><Grid/></el-icon>品牌色盘色码</el-menu-item>
          <el-menu-item index="/banners"><el-icon><FocusRight/></el-icon>Banner管理</el-menu-item>
          <el-menu-item index="/popup"><el-icon><Bell/></el-icon>弹窗管理</el-menu-item>
          <el-menu-item index="/tutorials"><el-icon><MagicStick/></el-icon>魔法小课堂</el-menu-item>
          <el-menu-item index="/feedback"><el-icon><ChatDotRound/></el-icon>反馈管理</el-menu-item>
        </el-menu-item-group>
        <el-menu-item-group title="运营">
          <el-menu-item index="/orders"><el-icon><CreditCard/></el-icon>订单管理</el-menu-item>
          <el-menu-item index="/vip"><el-icon><Star/></el-icon>VIP套餐</el-menu-item>
          <el-menu-item index="/withdraw"><el-icon><Wallet/></el-icon>提现管理</el-menu-item>
        </el-menu-item-group>
        <el-menu-item-group title="系统">
          <el-menu-item index="/admins"><el-icon><Lock/></el-icon>管理员</el-menu-item>
        </el-menu-item-group>
      </el-menu>
    </el-aside>
    <el-container direction="vertical">
      <el-header class="header">
        <span class="page-title">{{ $route.meta.title }}</span>
        <div class="header-right">
          <el-dropdown @command="handleCommand">
            <span class="admin-info">
              <el-avatar size="small" style="background:#f5a623;color:#000">{{ adminInitial }}</el-avatar>
              <span style="margin-left:8px">{{ auth.adminInfo?.nickName || auth.adminInfo?.username }}</span>
              <el-icon><ArrowDown/></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="logout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>
      <el-main class="main">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const auth = useAuthStore()
const adminInitial = computed(() => {
  const name = auth.adminInfo?.nickName || auth.adminInfo?.username || 'A'
  return name[0].toUpperCase()
})

function handleCommand(cmd) {
  if (cmd === 'logout') {
    auth.logout()
    router.push('/login')
  }
}
</script>

<style scoped>
.layout { height: 100vh; }
.sidebar { background: #1a1d27; border-right: 1px solid #2a2d3e; overflow-y: auto; }
.logo { display: flex; align-items: center; gap: 10px; padding: 18px 20px; border-bottom: 1px solid #2a2d3e; }
.logo-icon { font-size: 22px; }
.logo-text { font-size: 15px; font-weight: 700; color: #e8eaf0; }
.header { display: flex; align-items: center; justify-content: space-between; background: #1a1d27; border-bottom: 1px solid #2a2d3e; }
.page-title { font-size: 16px; font-weight: 700; color: #e8eaf0; }
.header-right { display: flex; align-items: center; }
.admin-info { display: flex; align-items: center; cursor: pointer; color: #e8eaf0; }
.main { background: #0f1117; padding: 20px; overflow-y: auto; }
:deep(.el-menu) { border-right: none; }
:deep(.el-menu-item-group__title) { font-size: 10px; color: #555; text-transform: uppercase; letter-spacing: 1px; }
</style>
