<template>
  <div>
    <el-card shadow="never">
      <el-table :data="list" v-loading="loading" stripe>
        <el-table-column prop="user" label="用户" width="120" />
        <el-table-column prop="content" label="内容" min-width="200" show-overflow-tooltip />
        <el-table-column prop="category" label="类型" width="90">
          <template #default="{row}">
            <el-tag size="small" :type="row.category==='BUG'?'danger':''">{{ row.category==='BUG'?'Bug':'建议' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{row}">
            <el-tag :type="['warning','','success','info'][row.status]" size="small">{{ ['待处理','处理中','已回复','已关闭'][row.status] }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="时间" width="160" />
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{row}">
            <el-button size="small" type="danger" @click="close(row)" :disabled="row.status===3">关闭</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import request from '../utils/request'

const list = ref([])
const loading = ref(false)

async function load() {
  loading.value = true
  try { list.value = await request.get('/admin/feedback') || [] }
  catch {} finally { loading.value = false }
}

async function close(row) {
  await request.post(`/admin/feedback/${row.id}/close`)
  ElMessage.success('已关闭')
  load()
}

onMounted(load)
</script>
