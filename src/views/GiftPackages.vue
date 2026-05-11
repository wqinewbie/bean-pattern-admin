<template>
  <div>
    <el-card shadow="never" style="margin-bottom: 16px">
      <el-button type="primary" @click="openModal(null)">新增礼品包</el-button>
    </el-card>

    <el-card shadow="never">
      <el-table :data="list" v-loading="loading" stripe>
        <el-table-column prop="sortOrder" label="排序" width="80" />
        <el-table-column prop="packageCode" label="礼品包编码" width="180" />
        <el-table-column prop="name" label="名称" min-width="180" />
        <el-table-column prop="description" label="描述" min-width="220" show-overflow-tooltip />
        <el-table-column label="礼品明细" min-width="260">
          <template #default="{ row }">
            <div v-for="(item, idx) in parseItems(row.itemsJson)" :key="idx" style="font-size: 12px; line-height: 1.8;">
              {{ item.type || item.gift_type }} × {{ item.value || item.gift_value }}
            </div>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="row.status ? 'success' : 'info'">{{ row.status ? '启用' : '停用' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="openModal(row)">编辑</el-button>
            <el-button size="small" :type="row.status ? 'danger' : 'success'" @click="toggle(row)">
              {{ row.status ? '停用' : '启用' }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="form.id ? '编辑礼品包' : '新增礼品包'" width="760px">
      <el-form :model="form" label-width="110px">
        <el-form-item label="礼品包编码">
          <el-input v-model="form.packageCode" placeholder="例如：new_user_gift_pack" :disabled="!!form.id" />
        </el-form-item>
        <el-form-item label="名称">
          <el-input v-model="form.name" placeholder="例如：新人礼包" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="form.description" type="textarea" :rows="2" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="form.sortOrder" :min="0" />
        </el-form-item>
        <el-form-item label="礼品明细JSON">
          <el-input
            v-model="form.itemsJson"
            type="textarea"
            :rows="8"
            placeholder='[{"type":"AI_QUOTA","value":10},{"type":"VIP_DAYS","value":7}]'
          />
          <div style="color:#909399;font-size:12px;margin-top:8px;">
            支持类型：AI_QUOTA、VIP_DAYS、MAGIC_COINS
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="save" :loading="saving">保存</el-button>
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
const saving = ref(false)
const form = ref({})

function parseItems(itemsJson) {
  try {
    const arr = JSON.parse(itemsJson || '[]')
    return Array.isArray(arr) ? arr : []
  } catch {
    return []
  }
}

async function load() {
  loading.value = true
  try {
    list.value = await request.get('/admin/gift-packages') || []
  } finally {
    loading.value = false
  }
}

function openModal(row) {
  form.value = row ? { ...row } : {
    packageCode: '',
    name: '',
    description: '',
    itemsJson: '[{"type":"AI_QUOTA","value":10}]',
    sortOrder: 0,
    status: 1
  }
  dialogVisible.value = true
}

async function save() {
  saving.value = true
  try {
    const parsed = JSON.parse(form.value.itemsJson || '[]')
    if (!Array.isArray(parsed) || !parsed.length) {
      throw new Error('礼品明细必须是非空数组')
    }
    if (form.value.id) {
      await request.put(`/admin/gift-packages/${form.value.id}`, form.value)
    } else {
      await request.post('/admin/gift-packages', form.value)
    }
    ElMessage.success('保存成功')
    dialogVisible.value = false
    load()
  } catch (e) {
    ElMessage.error(e.message || '保存失败')
  } finally {
    saving.value = false
  }
}

async function toggle(row) {
  await request.post(`/admin/gift-packages/${row.id}/toggle`)
  ElMessage.success(row.status ? '已停用' : '已启用')
  load()
}

onMounted(load)
</script>
