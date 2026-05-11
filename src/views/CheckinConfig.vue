<template>
  <div>
    <el-card shadow="never" style="margin-bottom:16px">
      <template #header>
        <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;">
          <div>
            <div style="font-size:16px;font-weight:700;">签到配置</div>
            <div style="font-size:12px;color:#909399;margin-top:4px;">当前小程序签到区域已简化为状态展示，不展示日历；这里只配置签到规则本身。</div>
          </div>
          <el-tag type="warning">前端展示：连续天数 / 剩余天数 / 累计签到</el-tag>
        </div>
      </template>

      <el-form :model="config" label-width="150px" style="max-width:720px;">
        <el-form-item label="签到功能状态">
          <el-switch v-model="config.isActive" active-text="启用" inactive-text="禁用" />
          <div class="form-help">关闭后，小程序签到按钮仍会显示，但用户签到时会提示“签到暂未开启”。</div>
        </el-form-item>

        <el-form-item label="连续签到天数">
          <el-input-number v-model="config.continuousDaysRequired" :min="1" :max="30" />
          <div class="form-help">达到该天数后，用户可点击领取奖励。</div>
        </el-form-item>

        <el-form-item label="奖励类型">
          <el-select v-model="config.rewardType" style="width:220px">
            <el-option label="AI次数" value="AI_COUNT" />
            <el-option label="会员天数" value="VIP_DAYS" />
          </el-select>
        </el-form-item>

        <el-form-item :label="config.rewardType === 'VIP_DAYS' ? '奖励天数' : '奖励数量'">
          <el-input-number v-model="config.rewardValue" :min="1" :max="100" />
          <div class="form-help">当前前端会在按钮上展示该数值，例如“领取奖励 +1次AI”。</div>
        </el-form-item>
      </el-form>

      <div class="preview-box">
        <div class="preview-title">效果说明</div>
        <div class="preview-line">1. 用户在任务中心看到：已连续签到 X 天、还差 Y 天、累计签到 Z 天</div>
        <div class="preview-line">2. 满足连续签到 {{ config.continuousDaysRequired || 0 }} 天后，可领取 1 次奖励</div>
        <div class="preview-line">3. 当前奖励：{{ getRewardLabel(config.rewardType) }} × {{ config.rewardValue || 0 }}</div>
      </div>

      <div style="margin-top: 16px; text-align: right;">
        <el-button type="primary" @click="saveConfig" :loading="saving">保存配置</el-button>
      </div>
    </el-card>

    <el-card shadow="never">
      <template #header>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span>签到统计</span>
          <el-tag type="info">统计与记录列表待接入真实数据</el-tag>
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
          <el-statistic :title="config.rewardType === 'VIP_DAYS' ? '累计发放会员天数' : '累计发放AI次数'" :value="statistics.totalRewardValue || 0">
            <template #suffix>{{ config.rewardType === 'VIP_DAYS' ? '天' : '次' }}</template>
          </el-statistic>
        </el-col>
      </el-row>

      <el-empty description="签到记录列表待接入" />
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
const statistics = ref({})

function getRewardLabel(type) {
  return type === 'VIP_DAYS' ? '会员天数' : 'AI次数'
}

async function loadConfig() {
  try {
    const data = await request.get('/admin/checkin/config')
    if (data) {
      config.value = {
        continuousDaysRequired: data.continuousDaysRequired || 3,
        rewardType: data.rewardType || 'AI_COUNT',
        rewardValue: data.rewardValue || 1,
        isActive: typeof data.isActive === 'boolean' ? data.isActive : true,
        id: data.id
      }
    }
  } catch (e) {
    console.error('加载配置失败', e)
  }
}

async function saveConfig() {
  saving.value = true
  try {
    const data = await request.post('/admin/checkin/config', config.value)
    if (data) {
      config.value = {
        ...config.value,
        ...data
      }
    }
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
    if (data) {
      statistics.value = data
    }
  } catch (e) {
    console.error('加载统计失败', e)
  }
}

onMounted(() => {
  loadConfig()
  loadStatistics()
})
</script>

<style scoped>
.el-statistic {
  text-align: center;
}

.form-help {
  font-size: 12px;
  color: #909399;
  line-height: 1.6;
  margin-top: 6px;
}

.preview-box {
  margin-top: 20px;
  padding: 16px 18px;
  border-radius: 10px;
  background: #faf6ef;
  border: 1px solid #f0e2c2;
}

.preview-title {
  font-size: 14px;
  font-weight: 700;
  margin-bottom: 10px;
  color: #8a5b20;
}

.preview-line {
  font-size: 13px;
  line-height: 1.8;
  color: #606266;
}
</style>
