<template>
  <div class="prompt-test-page">
    <el-card shadow="never" class="panel">
      <template #header>
        <div class="panel-title">AI Prompt Test</div>
      </template>

      <el-form :model="form" label-width="96px" class="test-form">
        <el-form-item label="模型">
          <el-select v-model="form.modelKey" clearable filterable placeholder="留空使用默认模型">
            <el-option
              v-for="item in modelOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="提示词">
          <el-input
            v-model="form.promptTemplate"
            type="textarea"
            :rows="8"
            maxlength="1200"
            show-word-limit
            placeholder="输入要测试的提示词"
          />
        </el-form-item>

        <el-form-item label="反向提示词">
          <el-input
            v-model="form.negativePromptTemplate"
            type="textarea"
            :rows="5"
            maxlength="1200"
            show-word-limit
            placeholder="输入不希望模型生成的内容，可留空"
          />
        </el-form-item>

        <div class="actions">
          <el-button type="primary" :loading="submitting || polling" @click="submitTest">
            {{ polling ? '生成中' : '生成图片' }}
          </el-button>
        </div>
      </el-form>
    </el-card>

    <el-card shadow="never" class="panel result-panel">
      <template #header>
        <div class="result-header">
          <span class="panel-title">AI 原图</span>
          <el-tag v-if="taskStatus" :type="statusType">{{ taskStatus }}</el-tag>
        </div>
      </template>

      <div v-if="!taskId" class="empty-result">生成后的图片会显示在这里。</div>

      <div v-else class="task-meta">
        <span>任务 ID：{{ taskId }}</span>
        <span v-if="elapsedSeconds">耗时：{{ elapsedSeconds }}s</span>
      </div>

      <el-alert
        v-if="errorMessage"
        class="result-alert"
        type="error"
        :title="errorMessage"
        show-icon
        :closable="false"
      />

      <div v-if="polling" class="loading-box">
        <el-skeleton :rows="7" animated />
      </div>

      <div v-if="resultUrl" class="image-card">
        <el-image :src="resultUrl" fit="contain" :preview-src-list="[resultUrl]" />
        <div class="result-actions">
          <el-button size="small" @click="copyText(resultUrl)">复制图片 URL</el-button>
          <el-link :href="resultUrl" target="_blank">新窗口打开</el-link>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { DICT_TYPE } from '../constants/dict'
import { useDict } from '../composables/useDict'
import request from '../utils/request'

const fallbackModelOptions = [
  { label: 'Seedream 5 Lite（默认）', value: 'seedream-5-lite' },
  { label: '即梦 4.0', value: 'jimeng-t2i-v40' },
  { label: '混元生图 3.0', value: 'hunyuan-image-v3' }
]

const aiModelDict = useDict(DICT_TYPE.AI_MODEL_KEY)
const modelOptions = computed(() => (
  aiModelDict.options.value.length ? aiModelDict.options.value : fallbackModelOptions
))

const submitting = ref(false)
const polling = ref(false)
const taskId = ref('')
const taskStatus = ref('')
const resultUrl = ref('')
const errorMessage = ref('')
const startedAt = ref(0)
const elapsedSeconds = ref(0)
let pollTimer = null
let elapsedTimer = null

const form = ref({
  modelKey: '',
  promptTemplate: '',
  negativePromptTemplate: ''
})

const statusType = computed(() => {
  if (taskStatus.value === 'SUCCESS') return 'success'
  if (taskStatus.value === 'FAILED') return 'danger'
  if (taskStatus.value === 'PROCESSING') return 'warning'
  return 'info'
})

async function submitTest() {
  if (!form.value.promptTemplate.trim()) {
    ElMessage.warning('请先填写提示词')
    return
  }

  stopPolling()
  submitting.value = true
  errorMessage.value = ''
  resultUrl.value = ''
  taskId.value = ''
  taskStatus.value = ''

  try {
    const data = await request.post('/admin/ai-prompt-test/generate', {
      modelKey: form.value.modelKey,
      promptTemplate: form.value.promptTemplate,
      negativePromptTemplate: form.value.negativePromptTemplate
    })
    taskId.value = data.taskId
    taskStatus.value = data.status || 'PENDING'
    startPolling()
  } finally {
    submitting.value = false
  }
}

function startPolling() {
  if (!taskId.value) return
  startedAt.value = Date.now()
  elapsedSeconds.value = 0
  polling.value = true
  pollTask()
  pollTimer = window.setInterval(pollTask, 3000)
  elapsedTimer = window.setInterval(() => {
    elapsedSeconds.value = Math.round((Date.now() - startedAt.value) / 1000)
    if (elapsedSeconds.value >= 180) {
      errorMessage.value = '等待超时，请检查 AI 服务日志'
      stopPolling()
    }
  }, 1000)
}

async function pollTask() {
  if (!taskId.value) return
  try {
    const data = await request.get(`/admin/ai-prompt-test/task/${taskId.value}`)
    taskStatus.value = data.status
    if (data.status === 'SUCCESS') {
      resultUrl.value = data.rawAiImageUrl || data.aiImageUrl || ''
      stopPolling()
      ElMessage.success('生成完成')
    } else if (data.status === 'FAILED') {
      errorMessage.value = data.errorMessage || '生成失败'
      stopPolling()
    }
  } catch (e) {
    stopPolling()
  }
}

function stopPolling() {
  polling.value = false
  if (pollTimer) window.clearInterval(pollTimer)
  if (elapsedTimer) window.clearInterval(elapsedTimer)
  pollTimer = null
  elapsedTimer = null
}

async function copyText(text) {
  await navigator.clipboard.writeText(text)
  ElMessage.success('已复制')
}

onBeforeUnmount(stopPolling)
</script>

<style scoped>
.prompt-test-page {
  display: grid;
  grid-template-columns: minmax(360px, 520px) minmax(0, 1fr);
  gap: 16px;
  min-height: 100%;
}

.panel {
  border-radius: 6px;
}

.panel-title {
  font-size: 15px;
  font-weight: 700;
}

.test-form {
  max-width: 100%;
}

.actions {
  display: flex;
  justify-content: flex-end;
}

.result-panel {
  min-height: 620px;
}

.result-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.empty-result {
  height: 420px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #8b90a7;
  border: 1px dashed #dcdfe6;
  border-radius: 6px;
}

.task-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  color: #606266;
  font-size: 13px;
  margin-bottom: 12px;
}

.result-alert,
.loading-box {
  margin-top: 14px;
}

.image-card {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.image-card :deep(.el-image) {
  width: 100%;
  height: 560px;
  background: #f5f7fa;
  border-radius: 4px;
}

.result-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

@media (max-width: 1100px) {
  .prompt-test-page {
    grid-template-columns: 1fr;
  }
}
</style>
