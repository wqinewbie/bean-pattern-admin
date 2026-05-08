<template>
  <div>
    <el-card shadow="never" style="margin-bottom:16px">
      <el-button type="primary" @click="openModal(null)"><el-icon><Plus/></el-icon> 新增任务</el-button>
    </el-card>
    <el-card shadow="never">
      <el-table :data="list" v-loading="loading" stripe>
        <el-table-column prop="taskCode" label="任务代码" width="150" />
        <el-table-column prop="taskName" label="任务名称" min-width="150" />
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
        <el-form-item label="额外配置">
          <el-input v-model="form.extraConfig" type="textarea" :rows="3" placeholder='JSON格式，例如：{"targetCount": 1}' />
          <div style="font-size:12px;color:#999;margin-top:4px">可选，用于存储任务的额外配置信息</div>
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
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import request from '../utils/request'

const list = ref([])
const loading = ref(false)
const dialogVisible = ref(false)
const form = ref({})

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

function openModal(row) {
  form.value = row ? { ...row } : {
    taskCode: '',
    taskName: '',
    taskType: 'DAILY',
    description: '',
    rewardType: 'AI_COUNT',
    rewardValue: 1,
    icon: '',
    sortOrder: 0,
    extraConfig: '',
    isActive: true
  }
  dialogVisible.value = true
}

async function save() {
  try {
    // 验证 extraConfig 是否为有效 JSON
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

onMounted(load)
</script>
