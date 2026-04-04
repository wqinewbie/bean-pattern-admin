<template>
  <div>
    <el-card shadow="never" style="margin-bottom:16px">
      <el-row :gutter="12">
        <el-col :span="7">
          <el-input v-model="q" placeholder="搜索任务ID/用户ID/昵称" clearable @input="onSearchInput">
            <template #prefix><el-icon><Search/></el-icon></template>
          </el-input>
        </el-col>
        <el-col :span="4">
          <el-select v-model="taskType" placeholder="任务类型" clearable @change="load">
            <el-option label="全部" value="" />
            <el-option label="图片转图纸" value="BEAD_LOCAL" />
            <el-option label="AI生成" value="BEAD_AI" />
          </el-select>
        </el-col>
        <el-col :span="4">
          <el-select v-model="status" placeholder="任务状态" clearable @change="load">
            <el-option label="全部" value="" />
            <el-option label="SUCCESS" value="SUCCESS" />
            <el-option label="CREATED" value="CREATED" />
            <el-option label="FAILED" value="FAILED" />
          </el-select>
        </el-col>
        <el-col :span="4">
          <el-select v-model="isSaved" placeholder="是否入图纸箱" clearable @change="load">
            <el-option label="全部" value="" />
            <el-option label="已保存" value="1" />
            <el-option label="未保存" value="0" />
          </el-select>
        </el-col>
      </el-row>
    </el-card>

    <el-card shadow="never">
      <el-table :data="list" v-loading="loading" stripe>
        <el-table-column label="任务" min-width="180">
          <template #default="{row}">
            <div style="display:flex;flex-direction:column;gap:4px">
              <div style="font-weight:700">#{{ row.id }}</div>
              <div style="font-size:12px;color:#8b90a7">用户：{{ row.userName || ('用户#' + row.userId) }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="类型" width="120">
          <template #default="{row}">
            <el-tag size="small" type="info">{{ typeText(row.taskType) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="110">
          <template #default="{row}">
            <el-tag size="small" :type="statusType(row.status)">{{ row.status || '-' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="图纸箱" width="110">
          <template #default="{row}">
            <el-tag size="small" :type="row.isSaved ? 'success' : 'info'">{{ row.isSaved ? '已保存' : '未保存' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="预览" width="100">
          <template #default="{row}">
            <el-image
              v-if="row.resultUrl || row.patternUrl"
              :src="row.resultUrl || row.patternUrl"
              style="width:46px;height:46px;border-radius:8px"
              fit="cover"
              :preview-src-list="[row.resultUrl || row.patternUrl]"
              preview-teleported
            />
            <span v-else style="color:#8b90a7">无</span>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="180" />
        <el-table-column prop="updatedAt" label="更新时间" width="180" />
      </el-table>

      <div style="margin-top:16px;display:flex;justify-content:flex-end">
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="pageSize"
          :total="total"
          layout="total, prev, pager, next"
          @change="load"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import request from '../utils/request'

const list = ref([])
const loading = ref(false)
const total = ref(0)
const page = ref(1)
const pageSize = ref(10)
const q = ref('')
const taskType = ref('')
const status = ref('')
const isSaved = ref('')
let timer = null

const typeText = (t) => ({ BEAD_LOCAL: '图片转图纸', BEAD_AI: 'AI生成' }[t] || t || '-')
const statusType = (s) => ({ SUCCESS: 'success', FAILED: 'danger', CREATED: 'warning' }[s] || 'info')

async function load() {
  loading.value = true
  try {
    const data = await request.get('/api/admin/user-patterns', {
      params: {
        page: page.value,
        pageSize: pageSize.value,
        q: q.value,
        taskType: taskType.value,
        status: status.value,
        isSaved: isSaved.value,
      }
    })
    list.value = data.list || []
    total.value = data.total || 0
  } finally {
    loading.value = false
  }
}

function onSearchInput() {
  clearTimeout(timer)
  timer = setTimeout(() => {
    page.value = 1
    load()
  }, 350)
}

onMounted(load)
</script>
