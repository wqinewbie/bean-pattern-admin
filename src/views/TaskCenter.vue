<template>
  <div>
    <el-card shadow="never" style="margin-bottom:16px">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:16px;flex-wrap:wrap;">
        <div>
          <div style="font-size:16px;font-weight:700;">任务中心</div>
          <div style="font-size:12px;color:#909399;margin-top:4px;max-width:760px;line-height:1.6;">
            这里用于把已有业务能力接入到任务中心展示，不负责创造新的业务逻辑。签到在小程序里是独立模块，这里只控制是否展示该能力及其卡片文案、排序、礼包绑定等参数。
          </div>
          <div style="font-size:12px;color:#c77700;margin-top:6px;max-width:760px;line-height:1.6;">
            提示：邀请注册、邀请充值、注册礼包、首冲礼包必须绑定礼品包；签到规则请前往“签到配置”维护，不建议在这里把签到当普通任务使用。
          </div>
        </div>
        <el-button type="primary" @click="openModal(null)"><el-icon><Plus/></el-icon> 新增任务卡片</el-button>
      </div>
    </el-card>

    <el-card shadow="never">
      <el-table :data="list" v-loading="loading" stripe>
        <el-table-column prop="taskCode" label="任务代码" width="150" />
        <el-table-column prop="taskName" label="任务名称" min-width="160" />
        <el-table-column label="任务能力类型" width="140">
          <template #default="{row}">
            <el-tag size="small">{{ getHandlerLabel(row) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="任务类型" width="100">
          <template #default="{row}">
            <el-tag size="small" :type="getTaskTypeColor(row.taskType)">{{ getTaskTypeLabel(row.taskType) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="任务描述" min-width="220" show-overflow-tooltip />
        <el-table-column label="达标条件" width="140">
          <template #default="{row}">
            <span>{{ getTargetCountLabel(row) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="礼包绑定" width="220">
          <template #default="{row}">
            <span>{{ getGiftPackageLabel(row) }}</span>
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

    <el-dialog v-model="dialogVisible" :title="form.id ? '编辑任务卡片' : '新增任务卡片'" width="640px">
      <el-form :model="form" label-width="120px">
        <el-form-item label="任务能力类型">
          <el-select v-model="form.handlerType" placeholder="请选择任务能力类型">
            <el-option v-for="item in taskHandlerDict.options.value" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
          <div style="font-size:12px;color:#999;margin-top:4px">先选择已有能力，再配置这张任务卡片的展示信息。</div>
        </el-form-item>

        <el-alert
          :title="currentHandlerGuide.title"
          :description="currentHandlerGuide.description"
          type="info"
          :closable="false"
          show-icon
          style="margin-bottom:18px"
        >
          <template #default>
            <div style="font-size:13px;line-height:1.8;color:#606266;">
              <div><strong>触发方式：</strong>{{ currentHandlerGuide.trigger }}</div>
              <div><strong>奖励去向：</strong>{{ currentHandlerGuide.rewardFlow }}</div>
              <div><strong>配置要求：</strong>{{ currentHandlerGuide.requirements }}</div>
            </div>
          </template>
        </el-alert>

        <el-form-item label="任务代码">
          <el-input v-model="form.taskCode" placeholder="系统会按能力类型自动带出推荐代码" :disabled="!!form.id" />
          <div style="font-size:12px;color:#999;margin-top:4px">任务唯一标识，创建后不可修改；新建时会根据能力类型自动给出推荐代码。</div>
        </el-form-item>

        <el-form-item label="任务名称">
          <el-input v-model="form.taskName" placeholder="例如：邀请好友注册" />
        </el-form-item>

        <el-form-item label="任务描述">
          <el-input v-model="form.description" type="textarea" :rows="3" placeholder="例如：邀请 3 位好友注册后可领取礼包" />
        </el-form-item>

        <el-form-item label="任务类型">
          <el-select v-model="form.taskType" placeholder="请选择任务类型">
            <el-option v-for="item in availableTaskTypes" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>

        <el-form-item label="任务图标">
          <el-input v-model="form.icon" placeholder="图标URL（可选）" />
        </el-form-item>

        <el-form-item label="排序">
          <el-input-number v-model="form.sortOrder" :min="0" />
          <div style="font-size:12px;color:#999;margin-top:4px">数字越小越靠前。</div>
        </el-form-item>

        <el-form-item label="达标次数" v-if="showTargetCount">
          <el-input-number v-model="form.targetCount" :min="1" />
        </el-form-item>

        <el-form-item label="奖励礼包" v-if="requiresGiftPackage">
          <el-select v-model="form.giftPackageCode" filterable placeholder="请选择礼品包">
            <el-option v-for="item in giftPackageOptions" :key="item.packageCode" :label="`${item.name}（${item.packageCode}）`" :value="item.packageCode" />
          </el-select>
          <div style="font-size:12px;color:#999;margin-top:4px">礼包会进入用户的“我的礼品包”，由用户自行兑换；除签到入口外，所有奖励型任务必须绑定礼包。</div>
        </el-form-item>

        <el-form-item label="奖励展示" v-if="showRewardDisplay">
          <el-select v-model="form.rewardType" placeholder="请选择奖励展示类型">
            <el-option v-for="item in taskRewardDisplayDict.options.value" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
          <div style="font-size:12px;color:#999;margin-top:4px">仅用于任务卡片展示，不代表最终发奖一定直接到账。</div>
        </el-form-item>

        <el-form-item label="展示数量" v-if="showRewardDisplay">
          <el-input-number v-model="form.rewardValue" :min="1" />
        </el-form-item>

        <el-form-item label="状态">
          <el-switch v-model="form.isActive" active-text="启用" inactive-text="禁用" />
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
import { ref, onMounted, computed, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import request from '../utils/request'
import { DICT_TYPE } from '../constants/dict'
import { useDict } from '../composables/useDict'

const list = ref([])
const loading = ref(false)
const dialogVisible = ref(false)
const form = ref({})
const giftPackageOptions = ref([])

const taskHandlerDict = useDict(DICT_TYPE.TASK_HANDLER_TYPE)
const taskCenterTaskTypeDict = useDict(DICT_TYPE.TASK_CENTER_TASK_TYPE)
const taskRewardDisplayDict = useDict(DICT_TYPE.TASK_REWARD_DISPLAY_TYPE)

const handlerDefaults = {
  CHECKIN: {
    taskCode: 'daily_checkin',
    taskName: '每日签到',
    description: '完成每日签到并累计连续签到天数，可领取签到奖励。',
    taskType: 'DAILY'
  },
  INVITE_REGISTER: {
    taskCode: 'invite_register_task',
    taskName: '邀请好友注册',
    description: '每邀请指定数量好友注册，即可重复领取邀请注册礼包。',
    taskType: 'UNLIMITED'
  },
  INVITE_RECHARGE: {
    taskCode: 'invite_recharge_task',
    taskName: '邀请好友充值',
    description: '每邀请指定数量好友完成首充，即可重复领取邀请充值礼包。',
    taskType: 'UNLIMITED'
  },
  REGISTER_GIFT: {
    taskCode: 'register_gift_task',
    taskName: '注册礼包',
    description: '注册成功后即可领取一次新手礼包。',
    taskType: 'ONCE'
  },
  FIRST_RECHARGE_GIFT: {
    taskCode: 'first_recharge_gift_task',
    taskName: '首冲礼包',
    description: '完成首次充值后即可领取一次礼包。',
    taskType: 'ONCE'
  },
  REVIEW_TASK: {
    taskCode: 'review_task',
    taskName: '社交平台发帖',
    description: '按要求上传凭证截图，审核通过后发放奖励。',
    taskType: 'ONCE'
  },
  GENERIC_PROGRESS: {
    taskCode: 'generic_progress_task',
    taskName: '通用进度任务',
    description: '完成指定次数后领取奖励。',
    taskType: 'DAILY'
  },
  EVENT_TASK: {
    taskCode: 'event_task',
    taskName: '事件任务',
    description: '由业务事件触发完成或达标。',
    taskType: 'ONCE'
  }
}

const giftPackageHandlers = ['INVITE_REGISTER', 'INVITE_RECHARGE', 'REGISTER_GIFT', 'FIRST_RECHARGE_GIFT', 'REVIEW_TASK', 'GENERIC_PROGRESS', 'EVENT_TASK']
const targetCountHandlers = ['GENERIC_PROGRESS', 'EVENT_TASK', 'INVITE_REGISTER', 'INVITE_RECHARGE']
const fixedModuleHandlers = ['CHECKIN']
const taskTypeOptionsByHandler = {
  CHECKIN: ['DAILY'],
  INVITE_REGISTER: ['UNLIMITED'],
  INVITE_RECHARGE: ['UNLIMITED'],
  REGISTER_GIFT: ['ONCE'],
  FIRST_RECHARGE_GIFT: ['ONCE'],
  REVIEW_TASK: ['ONCE'],
  GENERIC_PROGRESS: ['DAILY', 'ONCE', 'UNLIMITED'],
  EVENT_TASK: ['DAILY', 'ONCE', 'UNLIMITED']
}
const requiresGiftPackage = computed(() => giftPackageHandlers.includes(form.value.handlerType))
const showTargetCount = computed(() => targetCountHandlers.includes(form.value.handlerType))
const showRewardDisplay = computed(() => !fixedModuleHandlers.includes(form.value.handlerType))
const availableTaskTypes = computed(() => {
  const handler = form.value.handlerType || 'GENERIC_PROGRESS'
  const keys = taskTypeOptionsByHandler[handler] || ['DAILY', 'ONCE', 'UNLIMITED']
  return keys.map(key => {
    const label = taskCenterTaskTypeDict.label(key)
    return { value: key, label: label !== '-' ? label : key }
  })
})
const currentHandlerGuide = computed(() => {
  const type = form.value.handlerType || 'GENERIC_PROGRESS'
  const map = {
    CHECKIN: {
      title: '签到模块入口',
      description: '签到在小程序中是独立展示模块，这里主要控制任务中心是否展示该入口卡片。',
      trigger: '用户通过签到系统完成签到、累计连续天数并领取奖励。',
      rewardFlow: '奖励由签到系统直接处理，不建议在这里当普通任务卡片配置。',
      requirements: '签到规则请前往“签到配置”维护；这里只建议配置名称、描述、排序和启用状态，任务类型固定为“每日任务”。'
    },
    INVITE_REGISTER: {
      title: '邀请好友注册',
      description: '统计被邀请好友完成注册的人数，每满一档即可重复领取礼包。',
      trigger: '好友通过邀请码完成注册，累计人数每达到一个 targetCount 就新增 1 次可领取次数。',
      rewardFlow: '点击领取后，奖励礼包进入“我的礼品包”，后续继续邀请达到下一档还可再次领取。',
      requirements: '必须配置达标次数 targetCount 和奖励礼包 giftPackageCode；任务类型固定为“无限制任务”。'
    },
    INVITE_RECHARGE: {
      title: '邀请好友充值',
      description: '统计被邀请好友完成首次充值的人数，每满一档即可重复领取礼包。',
      trigger: '好友通过邀请码注册并完成首充，累计人数每达到一个 targetCount 就新增 1 次可领取次数。',
      rewardFlow: '点击领取后，奖励礼包进入“我的礼品包”，后续继续邀请达到下一档还可再次领取。',
      requirements: '必须配置达标次数 targetCount 和奖励礼包 giftPackageCode；任务类型固定为“无限制任务”。'
    },
    REGISTER_GIFT: {
      title: '注册礼包',
      description: '用户注册后即可领取一次礼包。',
      trigger: '用户注册成功后，任务直接变为可领取。',
      rewardFlow: '点击领取后，礼包进入“我的礼品包”。',
      requirements: '必须配置奖励礼包 giftPackageCode。'
    },
    FIRST_RECHARGE_GIFT: {
      title: '首冲礼包',
      description: '用户完成首次支付后即可领取一次礼包。',
      trigger: '用户出现首笔已支付订单后，任务直接变为可领取。',
      rewardFlow: '点击领取后，礼包进入“我的礼品包”。',
      requirements: '必须配置奖励礼包 giftPackageCode。'
    },
    REVIEW_TASK: {
      title: '审核型任务',
      description: '用户上传凭证后进入后台审核，审核通过后再发放奖励。',
      trigger: '用户在独立提交页上传截图，后台审核通过后生效。',
      rewardFlow: '审核通过后，奖励礼品包进入“我的礼品包”，用户自行兑换。',
      requirements: '必须配置奖励礼包 giftPackageCode；建议配置清晰的任务描述与审核说明，便于用户理解上传要求。'
    },
    EVENT_TASK: {
      title: '事件任务入口',
      description: '用于接入已有事件型能力的任务卡片。',
      trigger: '由对应业务能力在后端更新进度或资格。',
      rewardFlow: '达标领取后，奖励礼品包进入“我的礼品包”，用户自行兑换。',
      requirements: '必须配置 targetCount 和奖励礼包 giftPackageCode；具体逻辑需有后端能力承接。'
    },
    GENERIC_PROGRESS: {
      title: '通用进度任务',
      description: '适合简单的计数型任务，由统一进度接口累计次数。',
      trigger: '通过通用任务完成接口累计 currentCount，达到 targetCount 后可领取。',
      rewardFlow: '达标领取后，奖励礼品包进入“我的礼品包”，用户自行兑换。',
      requirements: '必须配置 targetCount 和奖励礼包 giftPackageCode；适合简单任务，不适合复杂业务系统。'
    }
  }
  return map[type] || map.GENERIC_PROGRESS
})

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

function parseExtraConfig(extraConfig) {
  if (!extraConfig || !extraConfig.trim()) return {}
  try {
    return JSON.parse(extraConfig)
  } catch {
    return {}
  }
}

function openModal(row) {
  const extra = parseExtraConfig(row?.extraConfig)
  form.value = row ? {
    ...row,
    handlerType: extra.handlerType || 'GENERIC_PROGRESS',
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
    handlerType: 'GENERIC_PROGRESS',
    targetCount: 1,
    giftPackageCode: '',
    isActive: true
  }
  dialogVisible.value = true
}

function resolveBizCategory(handlerType) {
  if (handlerType === 'CHECKIN') return 'PLAY_SYSTEM'
  if (handlerType === 'REVIEW_TASK') return 'REVIEW_TASK'
  if (giftPackageHandlers.includes(handlerType)) return 'BENEFIT'
  return 'EVENT_TASK'
}

function buildExtraConfig() {
  const extra = {}
  extra.handlerType = form.value.handlerType || 'GENERIC_PROGRESS'
  extra.bizCategory = resolveBizCategory(form.value.handlerType)
  if (showTargetCount.value) extra.targetCount = form.value.targetCount || 1
  if (requiresGiftPackage.value) extra.giftPackageCode = (form.value.giftPackageCode || '').trim()
  form.value.extraConfig = JSON.stringify(extra)
}

async function save() {
  try {
    if (!form.value.handlerType) {
      ElMessage.error('请选择任务能力类型')
      return
    }
    if (!form.value.taskCode || !form.value.taskCode.trim()) {
      ElMessage.error('任务代码不能为空')
      return
    }
    if (!form.value.taskName || !form.value.taskName.trim()) {
      ElMessage.error('任务名称不能为空')
      return
    }
    if (requiresGiftPackage.value && !(form.value.giftPackageCode || '').trim()) {
      ElMessage.error('当前任务能力必须绑定奖励礼包')
      return
    }
    if (showTargetCount.value && (!form.value.targetCount || form.value.targetCount < 1)) {
      ElMessage.error('当前任务能力必须配置大于 0 的达标次数')
      return
    }
    if (showRewardDisplay.value && (!form.value.rewardValue || form.value.rewardValue < 1)) {
      ElMessage.error('展示数量必须大于 0')
      return
    }

    buildExtraConfig()

    const payload = {
      ...form.value,
      taskCode: form.value.taskCode.trim(),
      taskName: form.value.taskName.trim(),
      description: form.value.description || '',
      icon: form.value.icon || ''
    }

    if (payload.id) {
      await request.put(`/admin/tasks/${payload.id}`, payload)
    } else {
      await request.post('/admin/tasks', payload)
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
    await ElMessageBox.confirm('确定要删除该任务卡片吗？删除后用户将无法在任务中心看到它。', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await request.delete(`/admin/tasks/${row.id}`)
    ElMessage.success('删除成功')
    load()
  } catch (e) {
    if (e !== 'cancel') console.error(e)
  }
}

function getHandlerLabel(row) {
  const extra = parseExtraConfig(row.extraConfig)
  const type = extra.handlerType || 'GENERIC_PROGRESS'
  const label = taskHandlerDict.label(type)
  return label !== '-' ? label : type
}

function getGiftPackageLabel(row) {
  const extra = parseExtraConfig(row.extraConfig)
  const code = extra.giftPackageCode || ''
  if (!code) return '—'
  const matched = giftPackageOptions.value.find(item => item.packageCode === code)
  return matched ? `${matched.name}（${matched.packageCode}）` : code
}

function getTargetCountLabel(row) {
  const extra = parseExtraConfig(row.extraConfig)
  const type = extra.handlerType || 'GENERIC_PROGRESS'
  const targetCount = extra.targetCount
  if (type === 'CHECKIN') return '签到系统规则'
  if (targetCount) {
    if (type === 'INVITE_REGISTER') return `邀请 ${targetCount} 人注册`
    if (type === 'INVITE_RECHARGE') return `邀请 ${targetCount} 人首充`
    return `完成 ${targetCount} 次`
  }
  if (giftPackageHandlers.includes(type)) return '满足资格即可领取'
  if (type === 'REVIEW_TASK') return '提交后人工审核'
  return '按业务能力判定'
}

function getTaskTypeLabel(type) {
  if (!type) return '-'
  const label = taskCenterTaskTypeDict.label(type)
  return label !== '-' ? label : type
}

function getTaskTypeColor(type) {
  return taskCenterTaskTypeDict.tagType(type)
}

watch(() => form.value.handlerType, (next, prev) => {
  if (!next) return
  const defaults = handlerDefaults[next] || {}
  if (!form.value.id || !prev) {
    if (!form.value.taskCode || form.value.taskCode === (handlerDefaults[prev]?.taskCode || '')) {
      form.value.taskCode = defaults.taskCode || form.value.taskCode
    }
    if (!form.value.taskName || form.value.taskName === (handlerDefaults[prev]?.taskName || '')) {
      form.value.taskName = defaults.taskName || form.value.taskName
    }
    if (!form.value.description || form.value.description === (handlerDefaults[prev]?.description || '')) {
      form.value.description = defaults.description || form.value.description
    }
    if (!form.value.taskType || form.value.taskType === (handlerDefaults[prev]?.taskType || '')) {
      form.value.taskType = defaults.taskType || form.value.taskType
    }
  }

  const allowedTypes = taskTypeOptionsByHandler[next] || ['DAILY', 'ONCE', 'UNLIMITED']
  if (!allowedTypes.includes(form.value.taskType)) {
    form.value.taskType = defaults.taskType || allowedTypes[0]
  }
})

onMounted(() => {
  load()
  loadGiftPackages()
})
</script>
