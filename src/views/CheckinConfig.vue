<template>
  <div>
    <el-card shadow="never" style="margin-bottom:16px">
      <template #header>
        <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;">
          <div>
            <div style="font-size:16px;font-weight:700;">签到配置</div>
            <div style="font-size:12px;color:#909399;margin-top:4px;">签到只负责达标和发放礼品包，具体 AI 次数/会员天数由礼品包兑换到账。</div>
          </div>
          <el-tag type="success">奖励统一通过礼品包</el-tag>
        </div>
      </template>

      <el-form :model="config" label-width="150px" style="max-width:720px;">
        <el-form-item label="签到功能状态">
          <el-switch v-model="config.isActive" active-text="启用" inactive-text="禁用" />
        </el-form-item>

        <el-form-item label="连续签到天数">
          <el-input-number v-model="config.continuousDaysRequired" :min="1" :max="30" />
          <div class="form-help">达到该天数后，用户可领取配置的礼品包。</div>
        </el-form-item>

        <el-form-item label="奖励礼品包" required>
          <el-select v-model="config.giftPackageCode" filterable placeholder="请选择礼品包" style="width:360px">
            <el-option v-for="item in giftPackages" :key="item.packageCode" :label="`${item.name}（${item.packageCode}）`" :value="item.packageCode" />
          </el-select>
          <div class="form-help">用户领取后进入“我的礼品包”，再由用户自行兑换。</div>
        </el-form-item>
      </el-form>

      <div class="preview-box">
        <div class="preview-title">效果说明</div>
        <div class="preview-line">1. 用户连续签到 {{ config.continuousDaysRequired || 0 }} 天后可领取奖励。</div>
        <div class="preview-line">2. 当前奖励礼品包：{{ giftPackageLabel(config.giftPackageCode) }}</div>
        <div class="preview-line">3. 礼品包兑换后，内部配置的 AI 次数/会员天数等权益才会到账。</div>
      </div>

      <div style="margin-top: 16px; text-align: right;">
        <el-button type="primary" @click="saveConfig" :loading="saving">保存配置</el-button>
      </div>
    </el-card>

    <el-card shadow="never">
      <template #header>
        <div style="display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap;">
          <span>签到统计</span>
          <el-button size="small" @click="refreshRecords" :loading="recordLoading">刷新数据</el-button>
        </div>
      </template>

      <el-row :gutter="16" style="margin-bottom: 24px;">
        <el-col :span="6"><el-statistic title="今日签到人数" :value="statistics.todayCheckinCount || 0"><template #suffix>人</template></el-statistic></el-col>
        <el-col :span="6"><el-statistic title="累计签到人数" :value="statistics.totalCheckinUsers || 0"><template #suffix>人</template></el-statistic></el-col>
        <el-col :span="6"><el-statistic title="今日领取礼包" :value="statistics.todayClaimCount || 0"><template #suffix>份</template></el-statistic></el-col>
        <el-col :span="6"><el-statistic title="累计发放礼包" :value="statistics.totalRewardValue || 0"><template #suffix>份</template></el-statistic></el-col>
      </el-row>

      <div class="filter-bar">
        <el-input
          v-model="query.keyword"
          placeholder="搜索用户ID、昵称、手机号或 openId"
          clearable
          style="width: 280px;"
          @keyup.enter="searchRecords"
          @clear="searchRecords"
        />
        <el-date-picker
          v-model="query.dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          value-format="YYYY-MM-DD"
          style="width: 260px;"
          @change="searchRecords"
        />
        <el-button type="primary" @click="searchRecords">查询</el-button>
        <el-button @click="resetSearch">重置</el-button>
      </div>

      <el-table :data="records" border stripe v-loading="recordLoading" empty-text="暂无签到记录">
        <el-table-column prop="id" label="记录ID" width="90" />
        <el-table-column label="用户" min-width="220">
          <template #default="{ row }">
            <div class="user-cell">
              <el-avatar :size="36" :src="row.avatarUrl || ''">{{ userInitial(row) }}</el-avatar>
              <div class="user-info">
                <div class="user-name">{{ row.nickName || '未设置昵称' }}</div>
                <div class="user-meta">ID：{{ row.userId }}</div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="phone" label="手机号" min-width="130">
          <template #default="{ row }">{{ row.phone || '-' }}</template>
        </el-table-column>
        <el-table-column prop="checkinDate" label="签到日期" min-width="120" />
        <el-table-column prop="continuousDays" label="连续天数" width="110">
          <template #default="{ row }">
            <el-tag type="success">{{ row.continuousDays || 0 }} 天</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="签到时间" min-width="170">
          <template #default="{ row }">
            {{ formatTime(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column prop="openId" label="OpenID" min-width="220" show-overflow-tooltip />
      </el-table>

      <div class="pagination-wrap">
        <el-pagination
          v-model:current-page="query.page"
          v-model:page-size="query.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="loadRecords"
          @current-change="loadRecords"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import request from '../utils/request'
import { formatTime } from '../utils/format'

const config = ref({ continuousDaysRequired: 3, giftPackageCode: '', isActive: true })
const saving = ref(false)
const statistics = ref({})
const giftPackages = ref([])
const records = ref([])
const total = ref(0)
const recordLoading = ref(false)
const query = ref({ page: 1, pageSize: 20, keyword: '', dateRange: [] })

function giftPackageLabel(code) {
  if (!code) return '未配置'
  const matched = giftPackages.value.find(item => item.packageCode === code)
  return matched ? `${matched.name}（${matched.packageCode}）` : code
}

function userInitial(row) {
  const name = row.nickName || row.userId || '?'
  return String(name).slice(0, 1)
}

async function loadConfig() {
  try {
    const data = await request.get('/admin/checkin/config')
    if (data) {
      config.value = {
        continuousDaysRequired: data.continuousDaysRequired || 3,
        giftPackageCode: data.giftPackageCode || '',
        isActive: typeof data.isActive === 'boolean' ? data.isActive : true,
        id: data.id
      }
    }
  } catch (e) {
    console.error('加载配置失败', e)
  }
}

async function loadGiftPackages() {
  giftPackages.value = await request.get('/admin/gift-packages?activeOnly=true') || []
}

async function saveConfig() {
  if (!config.value.giftPackageCode) {
    ElMessage.error('请选择奖励礼品包')
    return
  }
  saving.value = true
  try {
    const data = await request.post('/admin/checkin/config', config.value)
    if (data) config.value = { ...config.value, ...data }
    ElMessage.success('保存成功')
  } catch (e) {
    ElMessage.error('保存失败：' + (e.message || '未知错误'))
  } finally {
    saving.value = false
  }
}

async function loadStatistics() {
  try {
    const data = await request.get('/admin/checkin/statistics')
    if (data) statistics.value = data
  } catch (e) {
    console.error('加载统计失败', e)
  }
}

async function loadRecords() {
  recordLoading.value = true
  try {
    const params = new URLSearchParams()
    params.set('page', query.value.page)
    params.set('pageSize', query.value.pageSize)
    if (query.value.keyword) params.set('keyword', query.value.keyword.trim())
    if (query.value.dateRange && query.value.dateRange.length === 2) {
      params.set('startDate', query.value.dateRange[0])
      params.set('endDate', query.value.dateRange[1])
    }
    const data = await request.get(`/admin/checkin/recent?${params.toString()}`)
    records.value = data?.list || []
    total.value = data?.total || 0
  } catch (e) {
    ElMessage.error('加载签到记录失败：' + (e.message || '未知错误'))
  } finally {
    recordLoading.value = false
  }
}

function searchRecords() {
  query.value.page = 1
  loadRecords()
}

function resetSearch() {
  query.value.keyword = ''
  query.value.dateRange = []
  query.value.page = 1
  loadRecords()
}

async function refreshRecords() {
  await Promise.all([loadStatistics(), loadRecords()])
}

onMounted(async () => {
  await loadGiftPackages()
  await loadConfig()
  refreshRecords()
})
</script>

<style scoped>
.el-statistic { text-align: center; }
.form-help { font-size: 12px; color: #909399; line-height: 1.6; margin-top: 6px; }
.preview-box { margin-top: 20px; padding: 16px 18px; border-radius: 10px; background: #faf6ef; border: 1px solid #f0e2c2; }
.preview-title { font-size: 14px; font-weight: 700; margin-bottom: 10px; color: #8a5b20; }
.preview-line { font-size: 13px; line-height: 1.8; color: #606266; }
.filter-bar { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; margin-bottom: 16px; }
.user-cell { display: flex; align-items: center; gap: 10px; }
.user-info { min-width: 0; }
.user-name { font-size: 14px; font-weight: 600; color: #303133; }
.user-meta { font-size: 12px; color: #909399; margin-top: 2px; }
.pagination-wrap { display: flex; justify-content: flex-end; margin-top: 16px; }
</style>
