<template>
  <div>
    <el-card shadow="never" style="margin-bottom:16px">
      <el-row :gutter="12">
        <el-col :span="4">
          <el-select v-model="filterStatus" placeholder="审核状态" clearable @change="load">
            <el-option
              v-for="item in patternStatusDict.optionsWithAll.value"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-col>
      </el-row>
    </el-card>
    <el-card shadow="never">
      <el-table :data="list" v-loading="loading" stripe>
        <el-table-column label="图纸" min-width="150">
          <template #default="{row}">
            <div style="display:flex;align-items:center;gap:8px">
              <el-image v-if="row.coverUrl" :src="row.coverUrl" style="width:40px;height:40px;border-radius:6px" fit="cover"/>
              <span style="font-weight:600">{{ row.title }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="category" label="分类" width="90" />
        <el-table-column label="售价" width="90">
          <template #default="{row}">{{ row.priceCoins ? row.priceCoins+'金币' : '免费' }}</template>
        </el-table-column>
        <el-table-column prop="downloadCount" label="下载数" width="80" />
        <el-table-column label="状态" width="100">
          <template #default="{row}">
            <el-tag :type="patternStatusDict.tagType(row.status)" size="small">
              {{ patternStatusDict.label(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="时间" width="160">
          <template #default="{row}">
            {{ formatTime(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{row}">
            <template v-if="row.status === 0">
              <el-button size="small" type="success" @click="approve(row)">通过</el-button>
              <el-button size="small" type="danger" @click="reject(row)">拒绝</el-button>
            </template>
            <template v-else>
              <el-button size="small" @click="toggleOnline(row)">{{ row.status===1?'下线':'上线' }}</el-button>
            </template>
          </template>
        </el-table-column>
      </el-table>
      <div style="margin-top:16px;display:flex;justify-content:flex-end">
        <el-pagination v-model:current-page="page" v-model:page-size="pageSize" :total="total" layout="total, prev, pager, next" @change="load" />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { DICT_TYPE } from '../constants/dict'
import { useDict } from '../composables/useDict'
import request from '../utils/request'
import { formatTime } from '../utils/format'

const list = ref([])
const loading = ref(false)
const total = ref(0)
const page = ref(1)
const pageSize = ref(10)
const filterStatus = ref('')
const patternStatusDict = useDict(DICT_TYPE.PATTERN_STATUS)

async function load() {
  loading.value = true
  try {
    const data = await request.get('/admin/patterns', { params: { page: page.value, pageSize: pageSize.value, status: filterStatus.value } })
    list.value = data.list || []
    total.value = data.total || 0
  } catch {} finally { loading.value = false }
}

async function approve(row) {
  await request.post(`/admin/patterns/${row.id}/approve`)
  ElMessage.success('已通过')
  load()
}

async function reject(row) {
  const { value } = await ElMessageBox.prompt('请输入拒绝原因', '拒绝', { inputPlaceholder: '原因...' })
  await request.post(`/admin/patterns/${row.id}/reject`, { reason: value })
  ElMessage.success('已拒绝')
  load()
}

async function toggleOnline(row) {
  await request.post(`/admin/patterns/${row.id}/toggle-online`)
  ElMessage.success(row.status === 1 ? '已下线' : '已上线')
  load()
}

onMounted(load)
</script>
