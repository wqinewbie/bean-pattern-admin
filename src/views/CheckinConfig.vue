<template>
  <div>
    <el-card shadow="never" style="margin-bottom:16px">
      <el-descriptions title="签到配置" :column="2" border>
        <el-descriptions-item label="连续签到天数要求">
          <el-input-number v-model="config.continuousDaysRequired" :min="1" :max="30" size="small" />
        </el-descriptions-item>
        <el-descriptions-item label="奖励类型">
          <el-select v-model="config.rewardType" size="small">
            <el-option label="AI次数" value="AI_COUNT" />
            <el-option label="会员天数" value="VIP_DAYS" />
          </el-select>
        </el-descriptions-item>
        <el-descriptions-item label="奖励数量">
          <el-input-number v-model="config.rewardValue" :min="1" :max="100" size="small" />
        </el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-switch v-model="config.isActive" active-text="启用" inactive-text="禁用" />
        </el-descriptions-item>
      </el-descriptions>
      <div style="margin-top: 16px; text-align: right;">
        <el-button type="primary" @click="saveConfig" :loading="saving">保存配置</el-button>
      </div>
    </el-card>

    <el-card shadow="never">
      <template #header>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span>签到统计</span>
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            size="small"
            @change="loadStatistics"
          />
        </div>
      </template>

      <el-row :gutter="16" style="margin-bottom: 24px;">
        <el-col :span="6">
          <el-statistic title="今日签到人数" :value="statistics.todayCheckinCount || 0">
            <template #suffix>人</template>
          </el-statistic>
        </el-col>
        <el-col :span="6">
          <el-statistic title="累计签到人数" :value="statistics.totalCheckinUsers || 0">
            <template #suffix>人</template>
          </el-statistic>
        </el-col>
        <el-col :span="6">
          <el-statistic title="今日领取奖励" :value="statistics.todayClaimCount || 0">
            <template #suffix>次</template>
          </el-statistic>
        </el-col>
        <el-col :span="6">
          <el-statistic title="累计发放奖励" :value="statistics.totalRewardValue || 0">
            <template #suffix>次AI</template>
          </el-statistic>
        </el-col>
      </el-row>

      <el-table :data="recentCheckins" v-loading="loading" stripe>
        <el-table-column prop="userId" label="用户ID" width="100" />
        <el-table-column prop="nickName" label="用户昵称" min-width="120" />
        <el-table-column prop="checkinDate" label="签到日期" width="120" />
        <el-table-column prop="continuousDays" label="连续天数" width="100" align="center">
          <template #default="{row}">
            <el-tag size="small" type="warning">{{ row.continuousDays }}天</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="totalDays" label="累计天数" width="100" align="center" />
        <el-table-column prop="canClaim" label="可领取" width="100" align="center">
          <template #default="{row}">
            <el-tag size="small" :type="row.canClaim ? 'success' : 'info'">
              {{ row.canClaim ? '是' : '否' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="签到时间" width="180" />
      </el-table>

      <el-pagination
        v-if="total > 0"
        style="margin-top: 16px; text-align: right;"
        :current-page="page"
        :page-size="pageSize"
        :total="total"
        layout="total, prev, pager, next"
        @current-change="handlePageChange"
      />
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import request from '../utils/request'

const config = ref({
  continuousDaysRequired: 3,
  rewardType: 'AI_COUNT',
  rewardValue: 1,
  isActive: true
})

const saving = ref(false)
const loading = ref(false)
const dateRange = ref([])
const statistics = ref({})
const recentCheckins = ref([])
const page = ref(1)
const pageSize = ref(20)
const total = ref(0)

async function loadConfig() {
  try {
    const data = await request.get('/admin/checkin/config')
    if (data) {
      config.value = data
    }
  } catch (e) {
    console.error('加载配置失败', e)
  }
}

async function saveConfig() {
  saving.value = true
  try {
    await request.post('/admin/checkin/config', config.value)
    ElMessage.success('保存成功')
  } catch (e) {
    ElMessage.error('保存失败：' + (e.message || '未知错误'))
  } finally {
    saving.value = false
  }
}

async function loadStatistics() {
  try {
    const params = {}
    if (dateRange.value && dateRange.value.length === 2) {
      params.startDate = dateRange.value[0]
      params.endDate = dateRange.value[1]
    }
    const data = await request.get('/admin/checkin/statistics', { params })
    if (data) {
      statistics.value = data
    }
  } catch (e) {
    console.error('加载统计失败', e)
  }
}

async function loadRecentCheckins() {
  loading.value = true
  try {
    const params = {
      page: page.value,
      pageSize: pageSize.value
    }
    const data = await request.get('/admin/checkin/recent', { params })
    if (data) {
      recentCheckins.value = data.list || []
      total.value = data.total || 0
    }
  } catch (e) {
    console.error('加载签到记录失败', e)
  } finally {
    loading.value = false
  }
}

function handlePageChange(newPage) {
  page.value = newPage
  loadRecentCheckins()
}

onMounted(() => {
  loadConfig()
  loadStatistics()
  loadRecentCheckins()
})
</script>

<style scoped>
.el-statistic {
  text-align: center;
}
</style>
