<template>
  <div class="prompt-test-page">
    <el-row :gutter="16">
      <el-col :xs="24" :lg="10">
        <el-card shadow="never" class="panel">
          <template #header>
            <div class="panel-title">测试参数</div>
          </template>

          <el-form :model="form" label-width="110px" label-position="top">
            <el-form-item label="测试底图">
              <div class="image-source">
                <el-input v-model="form.imageUrl" placeholder="粘贴可公网访问的图片 URL" clearable />
                <el-upload :show-file-list="false" :before-upload="beforeUpload" accept="image/*">
                  <el-button :loading="uploading">上传图片</el-button>
                </el-upload>
              </div>
              <div class="form-tip">当前 AI worker 是图生图链路，测试时需要一张底图。</div>
            </el-form-item>

            <el-form-item label="已有风格">
              <el-select v-model="selectedStyleName" clearable filterable placeholder="可选择 AI魔法风格配置">
                <el-option
                  v-for="item in styles"
                  :key="item.id"
                  :label="item.name"
                  :value="item.name"
                />
              </el-select>
            </el-form-item>

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

            <el-form-item label="正向提示词">
              <el-input
                v-model="form.promptTemplate"
                type="textarea"
                :rows="6"
                maxlength="1000"
                show-word-limit
                placeholder="描述模型要生成的画面、风格、构图、拼豆图案约束"
              />
            </el-form-item>

            <el-form-item label="用户补充词">
              <el-input
                v-model="form.prompt"
                type="textarea"
                :rows="3"
                maxlength="512"
                show-word-limit
                placeholder="可填写本次测试变量，例如：粉色头发、猫耳、星星背景"
              />
            </el-form-item>

            <el-form-item label="反向提示词">
              <el-input
                v-model="form.negativePromptTemplate"
                type="textarea"
                :rows="4"
                maxlength="1000"
                show-word-limit
                placeholder="例如：杂色、渐变、复杂背景、过多细节、文字、水印"
              />
            </el-form-item>

            <el-row :gutter="12">
              <el-col :span="12">
                <el-form-item label="尺寸预设">
                  <el-select v-model="form.sizePreset" clearable filterable placeholder="默认 standard">
                    <el-option
                      v-for="item in sizePresets"
                      :key="item.presetKey"
                      :label="item.name"
                      :value="item.presetKey"
                    />
                  </el-select>
                  <div v-if="selectedSizePreset" class="form-tip">
                    {{ selectedSizePreset.gridMin }}-{{ selectedSizePreset.gridMax }} 格，默认 {{ selectedSizePreset.defaultGrid }}，候选 {{ selectedSizePreset.candidateGrids }}
                  </div>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="品牌">
                  <el-input v-model="form.brand" placeholder="MARD" />
                </el-form-item>
              </el-col>
            </el-row>

            <el-row :gutter="12">
              <el-col :span="12">
                <el-form-item label="色数">
                  <el-input-number v-model="form.colorCount" :min="0" :max="256" controls-position="right" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="后处理">
                  <el-checkbox v-model="form.mirror">镜像处理</el-checkbox>
                </el-form-item>
              </el-col>
            </el-row>

            <div class="actions">
              <el-button @click="applyStyle" :disabled="!selectedStyle">套用风格提示词</el-button>
              <el-button type="primary" :loading="submitting" @click="submitTest">生成测试图</el-button>
            </div>
          </el-form>
        </el-card>
      </el-col>

      <el-col :xs="24" :lg="14">
        <el-card shadow="never" class="panel result-panel">
          <template #header>
            <div class="result-header">
              <span class="panel-title">测试结果</span>
              <el-tag v-if="taskStatus" :type="statusType">{{ taskStatus }}</el-tag>
            </div>
          </template>

          <div v-if="!taskId" class="empty-result">填写参数后点击生成，结果会显示在这里。</div>

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

          <div v-if="resultUrl" class="image-grid">
            <div class="image-card">
              <div class="image-title">AI 结果图</div>
              <el-image :src="resultUrl" fit="contain" :preview-src-list="[resultUrl]" />
              <el-button size="small" @click="copyText(resultUrl)">复制结果 URL</el-button>
            </div>
            <div v-if="form.imageUrl" class="image-card">
              <div class="image-title">测试底图</div>
              <el-image :src="form.imageUrl" fit="contain" :preview-src-list="[form.imageUrl]" />
            </div>
          </div>

          <el-descriptions v-if="lastTask" class="result-detail" :column="2" border>
            <el-descriptions-item label="模型">{{ form.modelKey || '默认模型' }}</el-descriptions-item>
            <el-descriptions-item label="风格">{{ lastTask.style || '-' }}</el-descriptions-item>
            <el-descriptions-item label="Perfect Pixel">{{ lastTask.perfectPixelStatus || '-' }}</el-descriptions-item>
            <el-descriptions-item label="最终格数">
              {{ lastTask.finalGridWidth || '-' }} x {{ lastTask.finalGridHeight || '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="Raw URL" :span="2">
              <el-link v-if="lastTask.rawAiImageUrl" :href="lastTask.rawAiImageUrl" target="_blank">打开原始结果</el-link>
              <span v-else>-</span>
            </el-descriptions-item>
          </el-descriptions>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { DICT_TYPE } from '../constants/dict'
import { useDict } from '../composables/useDict'
import request from '../utils/request'
import { uploadImageFile, validateImageFile } from '../utils/imageUpload'

const fallbackModelOptions = [
  { label: 'Seedream 5 Lite（默认）', value: 'seedream-5-lite' },
  { label: '即梦 4.0', value: 'jimeng-t2i-v40' },
  { label: '混元生图 3.0', value: 'hunyuan-image-v3' }
]

const aiModelDict = useDict(DICT_TYPE.AI_MODEL_KEY)
const modelOptions = computed(() => (
  aiModelDict.options.value.length ? aiModelDict.options.value : fallbackModelOptions
))

const styles = ref([])
const sizePresets = ref([])
const selectedStyleName = ref('')
const uploading = ref(false)
const submitting = ref(false)
const polling = ref(false)
const taskId = ref('')
const taskStatus = ref('')
const resultUrl = ref('')
const errorMessage = ref('')
const lastTask = ref(null)
const startedAt = ref(0)
const elapsedSeconds = ref(0)
let pollTimer = null
let elapsedTimer = null

const form = ref({
  imageUrl: '',
  promptTemplate: '',
  prompt: '',
  negativePromptTemplate: '',
  modelKey: '',
  style: '',
  sizePreset: '',
  sizeMode: 'default',
  brand: 'MARD',
  colorCount: 0,
  mirror: false
})

const selectedStyle = computed(() => styles.value.find((item) => item.name === selectedStyleName.value))
const selectedSizePreset = computed(() => sizePresets.value.find((item) => item.presetKey === form.value.sizePreset))
const statusType = computed(() => {
  if (taskStatus.value === 'SUCCESS') return 'success'
  if (taskStatus.value === 'FAILED') return 'danger'
  if (taskStatus.value === 'PROCESSING') return 'warning'
  return 'info'
})

watch(selectedStyleName, () => {
  if (!selectedStyleName.value) form.value.style = ''
})

async function loadStyles() {
  styles.value = (await request.get('/admin/ai-magic-style/list')) || []
}

async function loadSizePresets() {
  sizePresets.value = ((await request.get('/admin/ai-size-presets')) || []).filter((item) => item.enabled !== 0)
}

function applyStyle() {
  const style = selectedStyle.value
  if (!style) return
  form.value.style = style.name
  form.value.promptTemplate = style.promptTemplate || ''
  form.value.negativePromptTemplate = style.negativePromptTemplate || ''
  form.value.modelKey = style.modelKey || form.value.modelKey
}

async function beforeUpload(file) {
  if (!validateImageFile(file, { maxSizeMB: 10, acceptTypes: ['image/jpeg', 'image/png', 'image/webp'] })) return false
  uploading.value = true
  try {
    const imageUrl = await uploadImageFile(file, { filename: file.name || 'ai-test-input.jpg' })
    form.value.imageUrl = imageUrl
    ElMessage.success('上传成功')
  } catch (e) {
    ElMessage.error('上传失败，请重试')
  } finally {
    uploading.value = false
  }
  return false
}

async function submitTest() {
  if (!form.value.imageUrl.trim()) {
    ElMessage.warning('请先填写或上传测试底图')
    return
  }
  if (!form.value.promptTemplate.trim() && !selectedStyleName.value) {
    ElMessage.warning('请填写正向提示词或选择已有风格')
    return
  }

  stopPolling()
  submitting.value = true
  errorMessage.value = ''
  resultUrl.value = ''
  lastTask.value = null

  try {
    const payload = {
      ...form.value,
      style: selectedStyleName.value || form.value.style || ''
    }
    const data = await request.post('/admin/ai-prompt-test/generate', payload)
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
      errorMessage.value = '等待超时，请稍后在任务状态中重新查询或检查 AI 服务日志'
      stopPolling()
    }
  }, 1000)
}

async function pollTask() {
  if (!taskId.value) return
  try {
    const data = await request.get(`/admin/ai-prompt-test/task/${taskId.value}`)
    lastTask.value = data
    taskStatus.value = data.status
    if (data.status === 'SUCCESS') {
      resultUrl.value = data.aiImageUrl || data.rawAiImageUrl || ''
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

onMounted(() => {
  Promise.all([loadStyles(), loadSizePresets()])
})
onBeforeUnmount(stopPolling)
</script>

<style scoped>
.prompt-test-page {
  min-height: 100%;
}

.panel {
  border-radius: 6px;
}

.panel-title {
  font-size: 15px;
  font-weight: 700;
}

.image-source {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 8px;
  width: 100%;
}

.form-tip {
  color: #8b90a7;
  font-size: 12px;
  margin-top: 6px;
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.result-panel {
  min-height: 640px;
}

.result-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.empty-result {
  height: 360px;
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
.loading-box,
.result-detail {
  margin-top: 14px;
}

.image-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-top: 14px;
}

.image-card {
  border: 1px solid #ebeef5;
  border-radius: 6px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.image-title {
  font-size: 13px;
  font-weight: 700;
  color: #303133;
}

.image-card :deep(.el-image) {
  width: 100%;
  height: 420px;
  background: #f5f7fa;
  border-radius: 4px;
}

@media (max-width: 1200px) {
  .result-panel {
    margin-top: 16px;
  }
}

@media (max-width: 768px) {
  .image-source,
  .image-grid {
    grid-template-columns: 1fr;
  }
}
</style>
