<template>
  <div>
    <el-card shadow="never">
      <el-table :data="list" v-loading="loading" stripe>
        <el-table-column prop="userName" label="用户" width="130" />
        <el-table-column prop="coins" label="提现金币" width="100" />
        <el-table-column label="金额" width="100">
          <template #default="{row}">¥{{ row.amount }}</template>
        </el-table-column>
        <el-table-column label="状态" width="110">
          <template #default="{row}">
            <el-tag :type="{PENDING:'warning',APPROVED:'success',REJECTED:'danger',PAID:''}[row.status]" size="small">
              {{ {PENDING:'待审核',APPROVED:'已通过',REJECTED:'已拒绝',PAID:'已打款'}[row.status] }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="申请时间" width="160" />
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{row}">
            <template v-if="row.status==='PENDING'">
              <el-button size="small" type="success" @click="approve(row)">通过</el-button>
              <el-button size="small" type="danger" @click="reject(row)">拒绝</el-button>
            </template>
            <span v-else style="color:#8b90a7">—</span>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '../utils/request'

const list = ref([])
const loading = ref(false)

async function load() {
  loading.value = true
  try { list.value = await request.get('/admin/withdraws') || [] }
  catch {} finally { loading.value = false }
}

async function approve(row) {
  await ElMessageBox.confirm(`确定通过「${row.userName}」的提现申请 ¥${row.amount}？`, '确认', { type: 'warning' })
  await request.post(`/admin/withdraws/${row.id}/approve`)
  ElMessage.success('已通过')
  load()
}

async function reject(row) {
  const { value } = await ElMessageBox.prompt('请输入拒绝原因', '拒绝', { inputPlaceholder: '原因...' })
  await request.post(`/admin/withdraws/${row.id}/reject`, { reason: value })
  ElMessage.success('已拒绝')
  load()
}

onMounted(load)
</script>
