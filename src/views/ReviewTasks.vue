<template>
  <div>
    <el-card shadow="never" style="margin-bottom:16px">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;">
        <div>
          <div style="font-size:16px;font-weight:700;">审核任务管理</div>
          <div style="font-size:12px;color:#909399;margin-top:4px;">查看用户提交的社交发帖等审核型任务，支持通过或驳回。</div>
        </div>
        <el-button @click="load">刷新</el-button>
      </div>
    </el-card>

    <el-card shadow="never">
      <el-table :data="list" v-loading="loading" stripe>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="taskCode" label="任务编码" width="180" />
        <el-table-column prop="userId" label="用户ID" width="100" />
        <el-table-column prop="submissionText" label="提交说明" min-width="220" show-overflow-tooltip />
        <el-table-column label="凭证图片" min-width="220">
          <template #default="{ row }">
            <div style="display:flex;gap:8px;flex-wrap:wrap;">
              <el-image
                v-for="(img, idx) in parseImages(row.proofImages)"
                :key="idx"
                :src="img"
                fit="cover"
                style="width:72px;height:72px;border-radius:8px"
                :preview-src-list="parseImages(row.proofImages)"
              />
            </div>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="tagType(row.status)">{{ statusLabel(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="reviewRemark" label="审核备注" min-width="180" show-overflow-tooltip />
        <el-table-column prop="createdAt" label="提交时间" width="180" />
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button size="small" type="success" :disabled="row.status !== 0" @click="approve(row)">通过</el-button>
            <el-button size="small" type="danger" :disabled="row.status !== 0" @click="openReject(row)">驳回</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="rejectDialogVisible" title="驳回任务" width="520px">
      <el-form :model="rejectForm" label-width="90px">
        <el-form-item label="驳回原因">
          <el-input v-model="rejectForm.reviewRemark" type="textarea" :rows="4" placeholder="请输入驳回原因" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="rejectDialogVisible = false">取消</el-button>
        <el-button type="danger" @click="reject">确认驳回</el-button>
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
const rejectDialogVisible = ref(false)
const rejectForm = ref({ id: null, reviewRemark: '' })
const reviewStatusDict = useDict(DICT_TYPE.REVIEW_SUBMISSION_STATUS)

function parseImages(images) {
  try {
    const arr = JSON.parse(images || '[]')
    return Array.isArray(arr) ? arr : []
  } catch {
    return []
  }
}

function statusLabel(status) {
  const label = reviewStatusDict.label(status)
  return label !== '-' ? label : '待审核'
}

function tagType(status) {
  return reviewStatusDict.tagType(status)
}

async function load() {
  loading.value = true
  try {
    list.value = await request.get('/admin/review-tasks/submissions?limit=200') || []
  } finally {
    loading.value = false
  }
}

async function approve(row) {
  await request.post(`/admin/review-tasks/submissions/${row.id}/approve`, { reviewRemark: '' })
  ElMessage.success('审核通过')
  load()
}

function openReject(row) {
  rejectForm.value = { id: row.id, reviewRemark: '' }
  rejectDialogVisible.value = true
}

async function reject() {
  await request.post(`/admin/review-tasks/submissions/${rejectForm.value.id}/reject`, {
    reviewRemark: rejectForm.value.reviewRemark || ''
  })
  ElMessage.success('已驳回')
  rejectDialogVisible.value = false
  load()
}

onMounted(load)
</script>
