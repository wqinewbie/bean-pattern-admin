<template>
  <div>
    <el-card shadow="never" style="margin-bottom:16px">
      <el-row :gutter="12">
        <el-col :span="7">
          <el-input v-model="q" placeholder="搜索用户ID/昵称/草稿名称" clearable @input="onSearchInput">
            <template #prefix><el-icon><Search/></el-icon></template>
          </el-input>
        </el-col>
      </el-row>
    </el-card>

    <el-card shadow="never">
      <el-table :data="list" v-loading="loading" stripe>
        <el-table-column label="草稿信息" min-width="200">
          <template #default="{row}">
            <div style="display:flex;flex-direction:column;gap:4px">
              <div style="font-weight:700">{{ row.name || '未命名草稿' }}</div>
              <div style="font-size:12px;color:#8b90a7">ID: {{ row.id }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="用户" width="150">
          <template #default="{row}">
            <div style="display:flex;flex-direction:column;gap:4px">
              <div>{{ row.userName }}</div>
              <div style="font-size:12px;color:#8b90a7">ID: {{ row.userId }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="来源" width="120">
          <template #default="{row}">
            <el-tag size="small" type="info">{{ getSourceTypeLabel(row.sourceType) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="品牌" width="100">
          <template #default="{row}">{{ row.brand || '-' }}</template>
        </el-table-column>
        <el-table-column label="规格" width="120">
          <template #default="{row}">
            <div style="font-size:12px">
              <div>{{ row.gridSize }}x{{ row.gridSize }}</div>
              <div style="color:#8b90a7">{{ row.colorCount }}色</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="180">
          <template #default="{row}">
            {{ formatTime(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column prop="updatedAt" label="更新时间" width="180">
          <template #default="{row}">
            {{ formatTime(row.updatedAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{row}">
            <el-button type="primary" size="small" link @click="handlePreview(row)">预览</el-button>
            <el-button type="danger" size="small" link @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
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

    <PreviewDialog v-model="previewVisible" :record-id="previewRecordId" type="draft" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessageBox, ElMessage } from 'element-plus'
import request from '../utils/request'
import { formatTime } from '../utils/format'
import PreviewDialog from '../components/PreviewDialog.vue'

const list = ref([])
const loading = ref(false)
const total = ref(0)
const page = ref(1)
const pageSize = ref(10)
const q = ref('')
let timer = null
const previewVisible = ref(false)
const previewRecordId = ref(null)

async function load() {
  loading.value = true
  try {
    const data = await request.get('/admin/user-drafts', {
      params: {
        page: page.value,
        pageSize: pageSize.value,
        q: q.value,
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

function getSourceTypeLabel(type) {
  const map = {
    'AI_GENERATE': 'AI生成',
    'IMAGE_CONVERT': '图片转换',
    'BLANK_CANVAS': '空白画板',
  }
  return map[type] || type || '未知'
}

function handlePreview(row) {
  previewRecordId.value = row.id
  previewVisible.value = true
}

async function handleDelete(row) {
  try {
    await ElMessageBox.confirm(`确定要删除草稿"${row.name || '未命名'}"吗？`, '提示', {
      type: 'warning'
    })
    await request.delete(`/admin/user-drafts/${row.id}`)
    ElMessage.success('删除成功')
    load()
  } catch (e) {
    if (e !== 'cancel') {
      ElMessage.error(e.message || '删除失败')
    }
  }
}

onMounted(load)
</script>
