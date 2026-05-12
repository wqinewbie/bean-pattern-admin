<template>
  <div>
    <el-card shadow="never" style="margin-bottom:16px">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:16px;flex-wrap:wrap;">
        <div>
          <div style="font-size:16px;font-weight:700;">任务中心</div>
          <div style="font-size:12px;color:#909399;margin-top:4px;max-width:720px;line-height:1.6;">
            这里现在定位为任务中心“聚合展示配置”，不再承载所有业务规则本身。像签到应走独立签到配置，礼包应走礼品包/活动配置；这里只配置任务卡片、奖励展示及接入的处理器类型。
          </div>
          <div style="font-size:12px;color:#c77700;margin-top:6px;max-width:720px;line-height:1.6;">
            提示：邀请注册、邀请充值、注册礼包、首冲礼包这几类任务，必须配置礼包编码 giftPackageCode；否则用户无法领取礼包。
          </div>
        </div>
        <el-button type="primary" @click="openModal(null)"><el-icon><Plus/></el-icon> 新增任务</el-button>
      </div>
    </el-card>
    <el-card shadow="never">
      <el-table :data="list" v-loading="loading" stripe>
        <el-table-column prop="taskCode" label="任务代码" width="150" />
        <el-table-column prop="taskName" label="任务名称" min-width="150" />
        <el-table-column label="接入能力" width="130">
          <template #default="{row}">
            <el-tag size="small">{{ getHandlerLabel(row) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="任务类型" width="100">
          <template #default="{row}">
            <el-tag size="small" :type="getTaskTypeColor(row.taskType)">{{ getTaskTypeLabel(row.taskType) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="任务描述" min-width="200" show-overflow-tooltip />
        <el-table-column label="奖励" width="180">
          <template #default="{row}">
            <span>{{ getRewardLabel(row.rewardType) }} x{{ row.rewardValue }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="sortOrder" label="排序" width="80" />
        <el-table-column label="状态" width="90">
          <template #default="{row}">
            <el-tag :type="row.isActive ? 'success' : 'info'" size="small">{{ row.isActive ? '启用' : '禁用' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{row}">
            <el-button size="small" @click="openModal(row)">编辑</el-button>
            <el-button size="small" :type="row.isActive ? 'danger':'success'" @click="toggleStatus(row)">
              {{ row.isActive ? '禁用' : '启用' }}
            </el-button>
            <el-button size="small" type="danger" @click="deleteItem(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="form.id ? '编辑任务' : '新增任务'" width="600px">
      <el-form :model="form" label-width="120px">
        <el-form-item label="任务代码">
          <el-input v-model="form.taskCode" placeholder="例如：daily_checkin, daily_share" :disabled="!!form.id" />
          <div style="font-size:12px;color:#999;margin-top:4px">任务唯一标识，创建后不可修改</div>
        </el-form-item>
        <el-form-item label="任务名称">
          <el-input v-model="form.taskName" placeholder="例如：每日签到" />
        </el-form-item>
        <el-form-item label="任务类型">
          <el-select v-model="form.taskType" placeholder="请选择任务类型">
            <el-option label="每日任务" value="DAILY" />
            <el-option label="一次性任务" value="ONCE" />
            <el-option label="无限制任务" value="UNLIMITED" />
          </el-select>
        </el-form-item>
        <el-form-item label="任务描述">
          <el-input v-model="form.description" type="textarea" :rows="3" placeholder="任务的详细说明" />
        </el-form-item>
        <el-form-item label="奖励类型">
          <el-select v-model="form.rewardType" placeholder="请选择奖励类型">
            <el-option label="AI生成次数" value="AI_COUNT" />
            <el-option label="会员天数" value="VIP_DAYS" />
            <el-option label="优惠券" value="COUPON" />
          </el-select>
        </el-form-item>
        <el-form-item label="奖励数量">
          <el-input-number v-model="form.rewardValue" :min="1" />
        </el-form-item>
        <el-form-item label="任务图标">
          <el-input v-model="form.icon" placeholder="图标URL（可选）" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="form.sortOrder" :min="0" />
          <div style="font-size:12px;color:#999;margin-top:4px">数字越小越靠前</div>
        </el-form-item>
        <el-form-item label="接入能力">
          <el-select v-model="form.handlerType" placeholder="请选择接入能力">
            <el-option label="通用进度任务" value="GENERIC_PROGRESS" />
            <el-option label="签到系统入口" value="CHECKIN" />
            <el-option label="邀请好友注册" value="INVITE_REGISTER" />
            <el-option label="邀请好友充值" value="INVITE_RECHARGE" />
            <el-option label="注册礼包" value="REGISTER_GIFT" />
            <el-option label="首冲礼包" value="FIRST_RECHARGE_GIFT" />
            <el-option label="事件型任务" value="EVENT_TASK" />
            <el-option label="审核型任务（预留）" value="REVIEW_TASK" />
            <el-option label="礼包/权益入口（预留）" value="BENEFIT" />
          </el-select>
          <div style="font-size:12px;color:#999;margin-top:4px">新增真正的新能力仍需要后端 handler 接入；这里不是无代码万能任务引擎。</div>
        </el-form-item>
        <el-form-item label="业务分类">
          <el-select v-model="form.bizCategory" placeholder="请选择业务分类">
            <el-option label="事件型任务" value="EVENT_TASK" />
            <el-option label="独立玩法系统" value="PLAY_SYSTEM" />
            <el-option label="资格礼包/权益" value="BENEFIT" />
            <el-option label="审核型任务" value="REVIEW_TASK" />
          </el-select>
        </el-form-item>
        <el-form-item label="目标次数" v-if="showTargetCount">
          <el-input-number v-model="form.targetCount" :min="1" />
        </el-form-item>
        <el-form-item label="礼包编码" v-if="requiresGiftPackage">
          <el-select v-model="form.giftPackageCode" filterable placeholder="请选择礼品包">
            <el-option v-for="item in giftPackageOptions" :key="item.packageCode" :label="`${item.name}（${item.packageCode}）`" :value="item.packageCode" />
          </el-select>
          <div style="font-size:12px;color:#999;margin-top:4px">邀请注册、邀请充值、注册礼包、首冲礼包都必须配置 giftPackageCode。</div>
        </el-form-item>
        <el-form-item label="额外配置">
          <el-input v-model="form.extraConfig" type="textarea" :rows="4" placeholder='JSON格式，例如：{"handlerType":"GENERIC_PROGRESS","bizCategory":"EVENT_TASK","targetCount":1}' />
          <div style="font-size:12px;color:#999;margin-top:4px">保存时会自动合并接入能力、业务分类和目标次数。</div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible=false">取消</el-button>
        <el-button type="primary" @click="save">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import request from '../utils/request'

const list = ref([])
const loading = ref(false)
const dialogVisible = ref(false)
const form = ref({})
const giftPackageOptions = ref([])

const giftPackageHandlers = ['INVITE_REGISTER', 'INVITE_RECHARGE', 'REGISTER_GIFT', 'FIRST_RECHARGE_GIFT']
const targetCountHandlers = ['GENERIC_PROGRESS', 'EVENT_TASK', 'INVITE_REGISTER', 'INVITE_RECHARGE']
const requiresGiftPackage = computed(() => giftPackageHandlers.includes(form.value.handlerType))
const showTargetCount = computed(() => targetCountHandlers.includes(form.value.handlerType))

async function load() {
  loading.value = true
  try {
    list.value = await request.get('/admin/tasks') || []
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

async function loadGiftPackages() {
  try {
    giftPackageOptions.value = await request.get('/admin/gift-packages?activeOnly=true') || []
  } catch (e) {
    console.error(e)
    giftPackageOptions.value = []
  }
}

function openModal(row) {
  const extra = parseExtraConfig(row?.extraConfig)
  form.value = row ? {
    ...row,
    handlerType: extra.handlerType || 'GENERIC_PROGRESS',
    bizCategory: extra.bizCategory || 'EVENT_TASK',
    targetCount: extra.targetCount || 1,
    giftPackageCode: extra.giftPackageCode || ''
  } : {
    taskCode: '',
    taskName: '',
    taskType: 'DAILY',
    description: '',
    rewardType: 'AI_COUNT',
    rewardValue: 1,
    icon: '',
    sortOrder: 0,
    extraConfig: '',
    handlerType: 'GENERIC_PROGRESS',
    bizCategory: 'EVENT_TASK',
    targetCount: 1,
    giftPackageCode: '',
    isActive: true
  }
  dialogVisible.value = true
}

function parseExtraConfig(extraConfig) {
  if (!extraConfig || !extraConfig.trim()) return {}
  try {
    return JSON.parse(extraConfig)
  } catch {
    return {}
  }
}

function buildExtraConfig() {
  const extra = parseExtraConfig(form.value.extraConfig)
  extra.handlerType = form.value.handlerType || 'GENERIC_PROGRESS'
  extra.bizCategory = form.value.bizCategory || 'EVENT_TASK'
  if (showTargetCount.value) {
    extra.targetCount = form.value.targetCount || 1
  } else {
    delete extra.targetCount
  }
  if (requiresGiftPackage.value) {
    extra.giftPackageCode = (form.value.giftPackageCode || '').trim()
  } else {
    delete extra.giftPackageCode
  }
  form.value.extraConfig = JSON.stringify(extra)
}

async function save() {
  try {
    if (requiresGiftPackage.value && !(form.value.giftPackageCode || '').trim()) {
      ElMessage.error('当前接入能力必须填写礼包编码 giftPackageCode')
      return
    }
    if (showTargetCount.value && (!form.value.targetCount || form.value.targetCount < 1)) {
      ElMessage.error('当前接入能力必须配置大于 0 的目标次数')
      return
    }

    buildExtraConfig()
    if (form.value.extraConfig && form.value.extraConfig.trim()) {
      try {
        JSON.parse(form.value.extraConfig)
      } catch (e) {
        ElMessage.error('额外配置必须是有效的JSON格式')
        return
      }
    }

    if (form.value.id) {
      await request.put(`/admin/tasks/${form.value.id}`, form.value)
    } else {
      await request.post('/admin/tasks', form.value)
    }
    ElMessage.success('保存成功')
    dialogVisible.value = false
    load()
  } catch (e) {
    console.error(e)
  }
}

async function toggleStatus(row) {
  try {
    await request.put(`/admin/tasks/${row.id}/status?isActive=${!row.isActive}`)
    ElMessage.success(row.isActive ? '已禁用' : '已启用')
    load()
  } catch (e) {
    console.error(e)
  }
}

async function deleteItem(row) {
  try {
    await ElMessageBox.confirm('确定要删除该任务吗？删除后用户将无法看到此任务。', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await request.delete(`/admin/tasks/${row.id}`)
    ElMessage.success('删除成功')
    load()
  } catch (e) {
    if (e !== 'cancel') {
      console.error(e)
    }
  }
}

function getHandlerLabel(row) {
  const extra = parseExtraConfig(row.extraConfig)
  const type = extra.handlerType || 'GENERIC_PROGRESS'
  const map = {
    'GENERIC_PROGRESS': '通用进度',
    'EVENT_TASK': '事件任务',
    'CHECKIN': '签到入口',
    'INVITE_REGISTER': '邀请注册',
    'INVITE_RECHARGE': '邀请充值',
    'REGISTER_GIFT': '注册礼包',
    'FIRST_RECHARGE_GIFT': '首冲礼包',
    'REVIEW_TASK': '审核任务',
    'BENEFIT': '礼包权益'
  }
  return map[type] || type
}

function getTaskTypeLabel(type) {
  const map = {
    'DAILY': '每日',
    'ONCE': '一次性',
    'UNLIMITED': '无限制'
  }
  return map[type] || type
}

function getTaskTypeColor(type) {
  const map = {
    'DAILY': 'primary',
    'ONCE': 'success',
    'UNLIMITED': 'warning'
  }
  return map[type] || ''
}

function getRewardLabel(type) {
  const map = {
    'AI_COUNT': 'AI次数',
    'VIP_DAYS': '会员天数',
    'COUPON': '优惠券'
  }
  return map[type] || type
}

onMounted(() => {
  load()
  loadGiftPackages()
})
</script>
