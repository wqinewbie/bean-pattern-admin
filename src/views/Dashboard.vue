<template>
  <div>
    <el-row :gutter="16" style="margin-bottom:20px">
      <el-col :span="6" v-for="s in stats" :key="s.label">
        <el-card class="stat-card" shadow="never">
          <div class="stat-inner">
            <div class="stat-icon" :style="{background: s.bg}">{{ s.icon }}</div>
            <div>
              <div class="stat-num">{{ s.num }}</div>
              <div class="stat-label">{{ s.label }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
    <el-row :gutter="16">
      <el-col :span="14">
        <el-card shadow="never">
          <template #header><span>📈 近7日新增用户</span></template>
          <div class="chart-wrap">
            <div class="chart-bars">
              <div v-for="(v,i) in chartData" :key="i" class="bar-col">
                <div class="bar" :style="{height: (v/maxChart*100)+'%'}"></div>
                <span class="bar-label">{{ chartDays[i] }}</span>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="10">
        <el-card shadow="never">
          <template #header><span>⚡ 最近动态</span></template>
          <el-timeline>
            <el-timeline-item v-for="t in timeline" :key="t.t" :timestamp="t.s" placement="top">
              {{ t.t }}
            </el-timeline-item>
          </el-timeline>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import request from '../utils/request'

const stats = ref([
  { icon: '👥', bg: '#1a2744', label: '总用户数', num: '-' },
  { icon: '💰', bg: '#1a3322', label: '今日收入', num: '-' },
  { icon: '🖼', bg: '#2d1a44', label: '图纸任务', num: '-' },
  { icon: '💬', bg: '#3a1a1a', label: '待处理反馈', num: '-' },
])
const chartData = ref([12,28,19,34,41,27,38])
const chartDays = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']
const maxChart = computed(() => Math.max(...chartData.value))
const timeline = ref([
  { t: '新用户注册：魔法师小豆', s: '2分钟前' },
  { t: '图纸审核通过：像素勇者', s: '15分钟前' },
  { t: '收到反馈：AI生成速度慢', s: '1小时前' },
  { t: '订单支付：年度特惠 ¥69.9', s: '2小时前' },
])

onMounted(async () => {
  try {
    const data = await request.get('/admin/dashboard')
    if (data) {
      stats.value[0].num = data.totalUsers ?? '-'
      stats.value[1].num = data.todayIncome ? '¥' + data.todayIncome : '-'
      stats.value[2].num = data.totalTasks ?? '-'
      stats.value[3].num = data.pendingFeedback ?? '-'
    }
  } catch (e) { console.error('Dashboard load failed:', e) }
})
</script>

<style scoped>
.stat-card { background: #1a1d27; border-color: #2a2d3e; }
.stat-inner { display: flex; align-items: center; gap: 14px; }
.stat-icon { width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 20px; flex-shrink: 0; }
.stat-num { font-size: 26px; font-weight: 800; color: #e8eaf0; }
.stat-label { font-size: 12px; color: #8b90a7; margin-top: 2px; }
.chart-wrap { height: 200px; padding: 10px 0; }
.chart-bars { display: flex; align-items: flex-end; gap: 8px; height: 100%; }
.bar-col { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: flex-end; height: 100%; gap: 4px; }
.bar { width: 100%; background: linear-gradient(to top, #f5a623, rgba(245,166,35,.2)); border-radius: 4px 4px 0 0; min-height: 4px; transition: height .5s; }
.bar-label { font-size: 10px; color: #8b90a7; }
:deep(.el-card) { background: #1a1d27; border-color: #2a2d3e; }
:deep(.el-card__header) { border-color: #2a2d3e; color: #e8eaf0; font-weight: 600; }
</style>
