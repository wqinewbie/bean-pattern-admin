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
            <el-option v-for="item in imageTaskTypeDict.optionsWithAll" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-col>
        <el-col :span="4">
          <el-select v-model="status" placeholder="任务状态" clearable @change="load">
            <el-option v-for="item in imageTaskStatusDict.optionsWithAll" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-col>
        <el-col :span="4">
          <el-select v-model="isSaved" placeholder="是否入图纸箱" clearable @change="load">
            <el-option v-for="item in imageTaskSavedDict.optionsWithAll" :key="item.value" :label="item.label" :value="item.value" />
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
            <el-tag size="small" type="info">{{ imageTaskTypeDict.label(row.taskType) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="110">
          <template #default="{row}">
            <el-tag size="small" :type="imageTaskStatusDict.tagType(row.status)">{{ imageTaskStatusDict.label(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="图纸箱" width="110">
          <template #default="{row}">
            <el-tag size="small" :type="imageTaskSavedDict.tagType(row.isSaved ? '1' : '0')">{{ imageTaskSavedDict.label(row.isSaved ? '1' : '0') }}</el-tag>
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
import { DICT_TYPE } from '../constants/dict'
import { useDict } from '../composables/useDict'

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

const imageTaskTypeDict = useDict(DICT_TYPE.IMAGE_TASK_TYPE)
const imageTaskStatusDict = useDict(DICT_TYPE.IMAGE_TASK_STATUS)
const imageTaskSavedDict = useDict(DICT_TYPE.IMAGE_TASK_SAVED)

async function load() {
  loading.value = true
  try {
    const data = await request.get('/admin/user-patterns', {
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
