<template>
  <div>
    <el-card shadow="never" style="margin-bottom:16px">
      <el-button type="primary" @click="openModal(null)"><el-icon><Plus/></el-icon> 新增套餐</el-button>
    </el-card>
    <el-card shadow="never">
      <el-table :data="list" v-loading="loading" stripe>
        <el-table-column prop="name" label="套餐名" min-width="120" />
        <el-table-column label="价格" width="90">
          <template #default="{row}">¥{{ row.price }}</template>
        </el-table-column>
        <el-table-column label="原价" width="90">
          <template #default="{row}"><s>¥{{ row.originalPrice }}</s></template>
        </el-table-column>
        <el-table-column prop="coins" label="金币" width="80" />
        <el-table-column prop="aiQuota" label="AI次数" width="80" />
        <el-table-column prop="vipDays" label="VIP天" width="80" />
        <el-table-column prop="tag" label="标签" width="90" />
        <el-table-column label="状态" width="90">
          <template #default="{row}">
            <el-tag :type="row.status ? 'success' : 'info'" size="small">{{ row.status ? '上线' : '下线' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{row}">
            <el-button size="small" @click="openModal(row)">编辑</el-button>
            <el-button size="small" :type="row.status ? 'danger':'success'" @click="toggle(row)">{{ row.status?'下线':'上线' }}</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
    <el-dialog v-model="dialogVisible" :title="form.id ? '编辑套餐' : '新增套餐'" width="500px">
      <el-form :model="form" label-width="90px">
        <el-form-item label="套餐名"><el-input v-model="form.name" /></el-form-item>
        <el-form-item label="价格(元)"><el-input-number v-model="form.price" :min="0" :precision="2" /></el-form-item>
        <el-form-item label="原价(元)"><el-input-number v-model="form.originalPrice" :min="0" :precision="2" /></el-form-item>
        <el-form-item label="赠送金币"><el-input-number v-model="form.coins" :min="0" /></el-form-item>
        <el-form-item label="AI次数"><el-input-number v-model="form.aiQuota" :min="0" /></el-form-item>
        <el-form-item label="VIP天数"><el-input-number v-model="form.vipDays" :min="0" /></el-form-item>
        <el-form-item label="标签"><el-input v-model="form.tag" /></el-form-item>
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
  try { list.value = await request.get('/admin/vip-plans') || [] }
  catch {} finally { loading.value = false }
}

function openModal(row) {
  form.value = row ? { ...row } : { name:'', price:0, originalPrice:0, coins:0, aiQuota:0, vipDays:0, tag:'' }
  dialogVisible.value = true
}

async function save() {
  if (form.value.id) {
    await request.put(`/admin/vip-plans/${form.value.id}`, form.value)
  } else {
    await request.post('/admin/vip-plans', form.value)
  }
  ElMessage.success('保存成功')
  dialogVisible.value = false
  load()
}

async function toggle(row) {
  await request.post(`/admin/vip-plans/${row.id}/toggle`)
  ElMessage.success(row.status ? '已下线' : '已上线')
  load()
}

onMounted(load)
</script>
