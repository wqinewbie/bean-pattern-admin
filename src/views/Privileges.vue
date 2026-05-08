<template>
  <div>
    <el-card shadow="never">
      <div style="margin-bottom:16px;color:#666">
        权益配置用于控制免费用户和会员用户的不同权限，修改后立即生效。
      </div>
      <el-table :data="list" v-loading="loading" stripe>
        <el-table-column prop="configKey" label="配置键" width="200" />
        <el-table-column prop="configName" label="配置名称" min-width="150" />
        <el-table-column label="免费用户值" width="150">
          <template #default="{row}">
            <el-tag size="small">{{ formatValue(row.freeValue, row.valueType) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="会员用户值" width="150">
          <template #default="{row}">
            <el-tag type="success" size="small">{{ formatValue(row.vipValue, row.valueType) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="说明" min-width="200" show-overflow-tooltip />
        <el-table-column prop="sortOrder" label="排序" width="80" />
        <el-table-column label="状态" width="90">
          <template #default="{row}">
            <el-tag :type="row.isActive ? 'success' : 'info'" size="small">{{ row.isActive ? '启用' : '禁用' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{row}">
            <el-button size="small" @click="openModal(row)">编辑</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
    <el-dialog v-model="dialogVisible" title="编辑权益配置" width="600px">
      <el-form :model="form" label-width="120px">
        <el-form-item label="配置键">
          <el-input v-model="form.configKey" disabled />
        </el-form-item>
        <el-form-item label="配置名称">
          <el-input v-model="form.configName" disabled />
        </el-form-item>
        <el-form-item label="免费用户值">
          <el-input v-model="form.freeValue" v-if="form.valueType === 'string'" />
          <el-input-number v-model.number="form.freeValue" v-else-if="form.valueType === 'number'" :min="0" />
          <el-switch v-model="form.freeValue" v-else-if="form.valueType === 'boolean'"
                     active-value="true" inactive-value="false" />
        </el-form-item>
        <el-form-item label="会员用户值">
          <el-input v-model="form.vipValue" v-if="form.valueType === 'string'" />
          <el-input-number v-model.number="form.vipValue" v-else-if="form.valueType === 'number'" :min="0" />
          <el-switch v-model="form.vipValue" v-else-if="form.valueType === 'boolean'"
                     active-value="true" inactive-value="false" />
        </el-form-item>
        <el-form-item label="说明">
          <el-input v-model="form.description" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="form.sortOrder" :min="0" />
        </el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="form.isActive" />
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

const list = ref([])
const loading = ref(false)
const dialogVisible = ref(false)
const form = ref({})

async function load() {
  loading.value = true
  try {
    list.value = await request.get('/admin/privileges') || []
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

function openModal(row) {
  form.value = { ...row }
  dialogVisible.value = true
}

async function save() {
  try {
    // 确保数值类型正确
    if (form.value.valueType === 'number') {
      form.value.freeValue = String(form.value.freeValue)
      form.value.vipValue = String(form.value.vipValue)
    }
    await request.put(`/admin/privileges/${form.value.id}`, form.value)
    ElMessage.success('保存成功')
    dialogVisible.value = false
    load()
  } catch (e) {
    console.error(e)
  }
}

function formatValue(value, type) {
  if (type === 'boolean') {
    return value === 'true' ? '是' : '否'
  }
  return value
}

onMounted(load)
</script>
