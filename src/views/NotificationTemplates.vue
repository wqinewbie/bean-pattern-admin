<template>
  <div>
    <el-card shadow="never" style="margin-bottom:16px">
      <div class="page-toolbar">
        <div class="page-tip">配置小程序消息中心的消息模板，支持变量替换和操作按钮配置。</div>
        <el-button type="primary" @click="openModal(null)">新增模板</el-button>
      </div>
    </el-card>

    <el-card shadow="never">
      <el-table :data="list" v-loading="loading" stripe>
        <el-table-column prop="code" label="模板编码" width="160" />
        <el-table-column prop="name" label="模板名称" width="180" />
        <el-table-column label="消息类型" width="120">
          <template #default="{ row }">{{ formatNotificationType(row.type) }}</template>
        </el-table-column>
        <el-table-column prop="title" label="标题模板" width="200" show-overflow-tooltip />
        <el-table-column prop="content" label="内容模板" min-width="250" show-overflow-tooltip />
        <el-table-column prop="icon" label="图标" width="80" align="center" />
        <el-table-column label="操作类型" width="120">
          <template #default="{ row }">{{ formatActionType(row.actionType) }}</template>
        </el-table-column>
        <el-table-column label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="row.isActive ? 'success' : 'info'" size="small">{{ row.isActive ? '启用' : '禁用' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="openModal(row)">编辑</el-button>
            <el-button size="small" :type="row.isActive ? 'danger' : 'success'" @click="toggle(row)">{{ row.isActive ? '禁用' : '启用' }}</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="form.id ? '编辑消息模板' : '新增消息模板'" width="720px">
      <el-form :model="form" label-width="120px">
        <el-form-item label="模板编码">
          <el-input v-model="form.code" :disabled="!!form.id" placeholder="如：vip_expire" />
        </el-form-item>
        <el-form-item label="模板名称">
          <el-input v-model="form.name" placeholder="如：VIP到期提醒" />
        </el-form-item>
        <el-form-item label="消息类型">
          <el-select v-model="form.type" style="width:100%">
            <el-option v-for="item in notificationTypeDict.options.value" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="标题模板">
          <el-input v-model="form.title" placeholder="支持变量：{expireDate}、{giftName} 等" />
        </el-form-item>
        <el-form-item label="内容模板">
          <el-input v-model="form.content" type="textarea" :rows="3" placeholder="支持变量替换，如：您的VIP会员将于 {expireDate} 到期" />
        </el-form-item>
        <el-form-item label="消息图标">
          <el-input v-model="form.icon" placeholder="如：🔔 👑 🎁 🪄" style="width:200px" />
        </el-form-item>
        <el-form-item label="操作类型">
          <el-select v-model="form.actionType" style="width:100%">
            <el-option v-for="item in actionTypeDict.options.value" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="操作值" v-if="form.actionType !== 'NONE'">
          <el-input v-model="form.actionValue" placeholder="页面路径、URL或礼品ID" />
        </el-form-item>
        <el-form-item label="操作按钮文案" v-if="form.actionType !== 'NONE'">
          <el-input v-model="form.actionText" placeholder="如：立即续费、查看礼品" />
        </el-form-item>
        <el-form-item label="变量说明">
          <el-input v-model="form.variables" type="textarea" :rows="2" placeholder='JSON格式：[{"key":"expireDate","desc":"到期日期"}]' />
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
import { ElMessage } from 'element-plus'
import request from '../utils/request'
import { DICT_TYPE } from '../constants/dict'
import { useDict } from '../composables/useDict'

const list = ref([])
const loading = ref(false)
const dialogVisible = ref(false)
const form = ref({})
const notificationTypeDict = useDict(DICT_TYPE.NOTIFICATION_TYPE)
const actionTypeDict = useDict(DICT_TYPE.NOTIFICATION_ACTION_TYPE)

async function load() {
  loading.value = true
  try {
    list.value = await request.get('/admin/notification-templates') || []
  } finally {
    loading.value = false
  }
}

function openModal(row) {
  form.value = row ? { ...row } : {
    code: '',
    name: '',
    type: 'system',
    title: '',
    content: '',
    icon: '🔔',
    actionType: 'NONE',
    actionValue: '',
    actionText: '',
    variables: '',
    isActive: true
  }
  dialogVisible.value = true
}

function formatNotificationType(type) {
  return notificationTypeDict.label(type)
}

function formatActionType(type) {
  return actionTypeDict.label(type)
}

async function save() {
  try {
    if (form.value.id) {
      await request.put(`/admin/notification-templates/${form.value.id}`, form.value)
    } else {
      await request.post('/admin/notification-templates', form.value)
    }
    ElMessage.success('保存成功')
    dialogVisible.value = false
    load()
  } catch (e) {
    ElMessage.error(e.message || '保存失败')
  }
}

async function toggle(row) {
  try {
    await request.put(`/admin/notification-templates/${row.id}/status?isActive=${!row.isActive}`)
    ElMessage.success(row.isActive ? '已禁用' : '已启用')
    load()
  } catch (e) {
    ElMessage.error(e.message || '操作失败')
  }
}

onMounted(load)
</script>

<style scoped>
.page-toolbar { display:flex; align-items:center; justify-content:space-between; gap:16px; }
.page-tip { color:#909399; font-size:13px; }
</style>
