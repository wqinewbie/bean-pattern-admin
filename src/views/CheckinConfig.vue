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
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span>签到统计</span>
          <el-tag type="info">统计与记录列表待接入真实数据</el-tag>
        </div>
      </template>

      <el-row :gutter="16" style="margin-bottom: 24px;">
        <el-col :span="6"><el-statistic title="今日签到人数" :value="statistics.todayCheckinCount || 0"><template #suffix>人</template></el-statistic></el-col>
        <el-col :span="6"><el-statistic title="累计签到人数" :value="statistics.totalCheckinUsers || 0"><template #suffix>人</template></el-statistic></el-col>
        <el-col :span="6"><el-statistic title="今日领取礼包" :value="statistics.todayClaimCount || 0"><template #suffix>份</template></el-statistic></el-col>
        <el-col :span="6"><el-statistic title="累计发放礼包" :value="statistics.totalRewardValue || 0"><template #suffix>份</template></el-statistic></el-col>
      </el-row>

      <el-empty description="签到记录列表待接入" />
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import request from '../utils/request'

const config = ref({ continuousDaysRequired: 3, giftPackageCode: '', isActive: true })
const saving = ref(false)
const statistics = ref({})
const giftPackages = ref([])

function giftPackageLabel(code) {
  if (!code) return '未配置'
  const matched = giftPackages.value.find(item => item.packageCode === code)
  return matched ? `${matched.name}（${matched.packageCode}）` : code
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

onMounted(async () => {
  await loadGiftPackages()
  await loadConfig()
  loadStatistics()
})
</script>

<style scoped>
.el-statistic { text-align: center; }
.form-help { font-size: 12px; color: #909399; line-height: 1.6; margin-top: 6px; }
.preview-box { margin-top: 20px; padding: 16px 18px; border-radius: 10px; background: #faf6ef; border: 1px solid #f0e2c2; }
.preview-title { font-size: 14px; font-weight: 700; margin-bottom: 10px; color: #8a5b20; }
.preview-line { font-size: 13px; line-height: 1.8; color: #606266; }
</style>
