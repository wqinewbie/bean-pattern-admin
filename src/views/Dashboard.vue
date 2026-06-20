<template>
  <div class="analytics-page">
    <div class="toolbar">
      <el-date-picker
        v-model="dateRange"
        type="daterange"
        range-separator="至"
        start-placeholder="开始日期"
        end-placeholder="结束日期"
        value-format="YYYY-MM-DD"
        :clearable="false"
        @change="loadAll"
      />
      <el-button :loading="loading" @click="loadAll">刷新</el-button>
    </div>

    <div class="metrics">
      <div v-for="item in metricCards" :key="item.key" class="metric">
        <div class="metric-label">{{ item.label }}</div>
        <div class="metric-value">{{ item.value }}</div>
      </div>
    </div>

    <div class="grid">
      <section class="panel panel-wide">
        <div class="panel-title">事件趋势</div>
        <div class="line-chart">
          <svg viewBox="0 0 640 220" preserveAspectRatio="none">
            <polyline :points="linePoints" fill="none" stroke="#f5a623" stroke-width="3" />
            <circle v-for="p in lineDots" :key="p.key" :cx="p.x" :cy="p.y" r="4" fill="#f5a623" />
          </svg>
          <div class="axis">
            <span v-for="label in trendLabels" :key="label">{{ label }}</span>
          </div>
        </div>
      </section>

      <section class="panel">
        <div class="panel-title">页面访问排行</div>
        <BarList :items="pageRank" />
      </section>

      <section v-for="funnel in funnels" :key="funnel.chartKey" class="panel">
        <div class="panel-title">{{ funnel.title }}</div>
        <div class="funnel">
          <div v-for="step in funnel.series" :key="step.name" class="funnel-row">
            <span>{{ step.name }}</span>
            <strong>{{ step.value }}</strong>
            <div class="funnel-bar"><i :style="{ width: percent(step.rate) }"></i></div>
          </div>
        </div>
      </section>

      <section class="panel">
        <div class="panel-title">图纸来源占比</div>
        <BarList :items="sourceDistribution" />
      </section>

      <section class="panel">
        <div class="panel-title">失败原因排行</div>
        <BarList :items="failureRank" />
      </section>
    </div>
  </div>
</template>

<script setup>
import { computed, defineComponent, h, onMounted, ref } from 'vue'
import request from '../utils/request'

const today = new Date()
const weekAgo = new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000)
const fmt = (d) => d.toISOString().slice(0, 10)

const loading = ref(false)
const dateRange = ref([fmt(weekAgo), fmt(today)])
const summary = ref({})
const trend = ref({ xAxis: [], series: [] })
const pageRank = ref([])
const sourceDistribution = ref([])
const failureRank = ref([])
const funnels = ref([])

const BarList = defineComponent({
  props: { items: { type: Array, default: () => [] } },
  setup(props) {
    return () => {
      const max = Math.max(...props.items.map(i => Number(i.value || 0)), 1)
      return h('div', { class: 'bar-list' }, props.items.map(item => {
        const value = Number(item.value || 0)
        return h('div', { class: 'bar-item', key: item.name }, [
          h('div', { class: 'bar-head' }, [
            h('span', item.name || item.label || '-'),
            h('strong', String(value))
          ]),
          h('div', { class: 'bar-track' }, [
            h('i', { style: { width: `${Math.max(value / max * 100, value > 0 ? 3 : 0)}%` } })
          ])
        ])
      }))
    }
  }
})

const metricCards = computed(() => [
  { key: 'events', label: '事件总量', value: summary.value.eventCount ?? 0 },
  { key: 'users', label: '活跃用户', value: summary.value.userCount ?? 0 },
  { key: 'sessions', label: '会话数', value: summary.value.sessionCount ?? 0 },
  { key: 'ai', label: 'AI成功', value: summary.value.aiGenerateSuccess ?? 0 },
  { key: 'pay', label: '支付成功', value: summary.value.paymentSuccess ?? 0 },
  { key: 'share', label: '分享访问', value: summary.value.shareVisit ?? 0 },
])

const trendLabels = computed(() => trend.value.xAxis || [])
const trendValues = computed(() => (trend.value.series && trend.value.series[0] && trend.value.series[0].data) || [])
const lineDots = computed(() => {
  const values = trendValues.value.map(v => Number(v || 0))
  const max = Math.max(...values, 1)
  const count = Math.max(values.length - 1, 1)
  return values.map((v, i) => ({
    key: i,
    x: 20 + i * (600 / count),
    y: 200 - (v / max) * 170
  }))
})
const linePoints = computed(() => lineDots.value.map(p => `${p.x},${p.y}`).join(' '))

function params() {
  return {
    startDate: dateRange.value[0],
    endDate: dateRange.value[1]
  }
}

function normalizeSeries(chart) {
  return (chart.series || []).map(item => ({
    name: item.name || item.label || '-',
    value: Number(item.value || 0),
    rate: Number(item.rate || 0)
  }))
}

function percent(rate) {
  return `${Math.max(Math.min(Number(rate || 0) * 100, 100), 0)}%`
}

async function loadChart(chartKey, extra = {}) {
  return request.get('/admin/analytics/charts', { chartKey, ...params(), ...extra })
}

async function loadAll() {
  loading.value = true
  try {
    const [
      summaryData,
      trendData,
      pageRankData,
      freeFunnel,
      aiFunnel,
      payFunnel,
      inviteFunnel,
      focusFunnel,
      sourceData,
      failureData
    ] = await Promise.all([
      request.get('/admin/analytics/summary', params()),
      loadChart('event_trend', { eventName: 'page_home_view' }),
      loadChart('page_view_rank'),
      loadChart('free_convert_funnel'),
      loadChart('ai_generate_funnel'),
      loadChart('ai_payment_funnel'),
      loadChart('invite_funnel'),
      loadChart('focus_retention'),
      loadChart('source_distribution'),
      loadChart('failure_reason_rank'),
    ])
    summary.value = summaryData || {}
    trend.value = trendData || { xAxis: [], series: [] }
    pageRank.value = normalizeSeries(pageRankData)
    funnels.value = [freeFunnel, aiFunnel, payFunnel, inviteFunnel, focusFunnel].filter(Boolean)
    sourceDistribution.value = normalizeSeries(sourceData)
    failureRank.value = normalizeSeries(failureData)
  } finally {
    loading.value = false
  }
}

onMounted(loadAll)
</script>

<style scoped>
.analytics-page { display: flex; flex-direction: column; gap: 16px; }
.toolbar { display: flex; justify-content: flex-end; gap: 10px; }
.metrics { display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 12px; }
.metric { background: #1a1d27; border: 1px solid #2a2d3e; border-radius: 8px; padding: 14px; }
.metric-label { color: #8b90a7; font-size: 12px; }
.metric-value { color: #e8eaf0; font-size: 26px; font-weight: 800; margin-top: 6px; }
.grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
.panel { background: #1a1d27; border: 1px solid #2a2d3e; border-radius: 8px; padding: 16px; min-height: 260px; }
.panel-wide { grid-column: span 2; }
.panel-title { color: #e8eaf0; font-weight: 700; margin-bottom: 14px; }
.line-chart { height: 240px; }
.line-chart svg { width: 100%; height: 210px; background: #11141d; border-radius: 6px; }
.axis { display: flex; justify-content: space-between; color: #8b90a7; font-size: 11px; margin-top: 8px; }
.bar-list { display: flex; flex-direction: column; gap: 12px; }
.bar-head { display: flex; justify-content: space-between; color: #cfd3df; font-size: 13px; margin-bottom: 6px; }
.bar-head strong { color: #f5a623; }
.bar-track, .funnel-bar { height: 8px; background: #11141d; border-radius: 999px; overflow: hidden; }
.bar-track i, .funnel-bar i { display: block; height: 100%; background: #f5a623; border-radius: inherit; }
.funnel { display: flex; flex-direction: column; gap: 12px; }
.funnel-row { display: grid; grid-template-columns: 1fr auto; gap: 8px; color: #cfd3df; font-size: 13px; }
.funnel-row strong { color: #f5a623; }
.funnel-bar { grid-column: span 2; }
:deep(.el-input__wrapper) { background: #1a1d27; box-shadow: 0 0 0 1px #2a2d3e inset; }
@media (max-width: 1280px) {
  .metrics { grid-template-columns: repeat(3, minmax(0, 1fr)); }
}
</style>
