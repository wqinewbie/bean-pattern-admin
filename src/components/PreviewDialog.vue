<template>
  <el-dialog
    v-model="visible"
    :title="`预览 - ${detail.name || '未命名'}`"
    width="900px"
    :close-on-click-modal="false"
    @opened="onOpened"
    @closed="onClosed"
  >
    <div v-if="loading" style="text-align:center;padding:60px 0">
      <el-icon class="is-loading" :size="32"><Loading /></el-icon>
      <div style="margin-top:12px;color:#8b90a7">加载中...</div>
    </div>

    <div v-else-if="loadError" style="text-align:center;padding:60px 0;color:#f56c6c">
      {{ loadError }}
    </div>

    <template v-else>
      <div class="preview-info">
        <span>规格：{{ detail.gridSize }}x{{ detail.gridSize }}</span>
        <span>色数：{{ detail.colorCount }}</span>
        <span>品牌：{{ detail.brand || '-' }}</span>
        <span>来源：{{ sourceTypeLabel }}</span>
        <span v-if="detail.taskId">任务：{{ detail.taskId }}</span>
      </div>

      <div class="preview-tabs">
        <span
          v-if="userOriginalUrl"
          :class="['tab-item', { active: activeTab === 'userOriginal' }]"
          @click="switchTab('userOriginal')"
        >用户上传原图</span>
        <span
          v-if="aiGeneratedOriginalUrl"
          :class="['tab-item', { active: activeTab === 'aiOriginal' }]"
          @click="switchTab('aiOriginal')"
        >AI生成原图</span>
        <span
          :class="['tab-item', { active: activeTab === 'result' }]"
          @click="switchTab('result')"
        >效果图</span>
        <span
          :class="['tab-item', { active: activeTab === 'pattern' }]"
          @click="switchTab('pattern')"
        >色号图</span>
        <span
          v-if="!userOriginalUrl && originalUrl"
          :class="['tab-item', { active: activeTab === 'original' }]"
          @click="switchTab('original')"
        >原图</span>
      </div>

      <div v-show="activeTab === 'result' || activeTab === 'pattern'" class="preview-canvas-wrap">
        <canvas
          ref="previewCanvas"
          class="preview-canvas"
          :style="{ maxWidth: canvasDisplayWidth + 'px' }"
        ></canvas>
        <span v-if="!hasPatternData" style="color:#8b90a7">暂无图纸数据</span>
      </div>

      <div v-show="isImageTab" class="preview-image-wrap">
        <img
          v-if="activeImageUrl && !imageLoadError"
          :key="activeImageUrl"
          :src="activeImageUrl"
          class="preview-image"
          @error="onImageError"
        />
        <span v-else style="color:#8b90a7">暂无图片</span>
      </div>
    </template>

    <template #footer>
      <el-button @click="visible = false">关闭</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { Loading } from '@element-plus/icons-vue'
import request from '../utils/request'
import { deriveFromMapped, renderResult, renderPattern } from '../utils/patternRenderer'

const props = defineProps({
  modelValue: Boolean,
  recordId: [Number, String],
  type: { type: String, default: 'box' } // 'box' | 'draft' | 'history'
})

const emit = defineEmits(['update:modelValue'])

const visible = ref(false)
const loading = ref(false)
const loadError = ref('')
const detail = ref({})
const gridData = ref([])
const colorPalette = ref([])
const activeTab = ref('result')
const previewCanvas = ref(null)
const canvasDisplayWidth = ref(600)
const imageLoadError = ref(false)

watch(() => props.modelValue, (val) => { visible.value = val })
watch(visible, (val) => { emit('update:modelValue', val) })

const USER_ORIGINAL_FIELDS = ['aiInputImageUrl', 'originalImageUrl', 'imageUrl']
const AI_ORIGINAL_FIELDS = ['aiGeneratedImageUrl', 'rawAiImageUrl', 'aiRefinedImageUrl', 'aiImageUrl']
const DEFAULT_ORIGINAL_FIELDS = ['sourceUrl', 'coverUrl']

function pickUrl(record, fields) {
  if (!record) return ''
  return fields
    .map(field => record[field])
    .find(value => typeof value === 'string' && value.trim()) || ''
}

const originalUrl = computed(() => pickUrl(detail.value, DEFAULT_ORIGINAL_FIELDS))
const isAiDetail = computed(() => !!(detail.value.taskId || detail.value.aiInputImageUrl || detail.value.aiGeneratedImageUrl || detail.value.aiRefinedImageUrl || String(detail.value.sourceType || '').toUpperCase().includes('AI')))
const userOriginalUrl = computed(() => isAiDetail.value ? pickUrl(detail.value, USER_ORIGINAL_FIELDS) : '')
const aiGeneratedOriginalUrl = computed(() => pickUrl(detail.value, AI_ORIGINAL_FIELDS))
const hasPatternData = computed(() => gridData.value.length > 0 && colorPalette.value.length > 0)
const isImageTab = computed(() => activeTab.value === 'original' || activeTab.value === 'userOriginal' || activeTab.value === 'aiOriginal')
const activeImageUrl = computed(() => {
  if (activeTab.value === 'userOriginal') return userOriginalUrl.value
  if (activeTab.value === 'aiOriginal') return aiGeneratedOriginalUrl.value
  return originalUrl.value
})

const sourceTypeLabel = computed(() => {
  const map = {
    AI: 'AI生成',
    AI_GENERATE: 'AI生成',
    IMAGE_CONVERT: '图片转换',
    LOCAL: '图片转换',
    BLANK_CANVAS: '空白画板',
    DRAW: '画板绘制',
    EDIT: '编辑'
  }
  return map[detail.value.sourceType] || detail.value.sourceType || '未知'
})

async function onOpened() {
  await loadDetail()
}

function onClosed() {
  loadError.value = ''
  detail.value = {}
  gridData.value = []
  colorPalette.value = []
  activeTab.value = 'result'
}

async function loadDetail() {
  if (!props.recordId) {
    loadError.value = '记录ID无效'
    return
  }
  loading.value = true
  loadError.value = ''
  const apiMap = {
    box: `/admin/user-boxes/${props.recordId}`,
    draft: `/admin/user-drafts/${props.recordId}`,
    history: `/admin/user-history/${props.recordId}`
  }
  const apiPath = apiMap[props.type] || apiMap.box
  try {
    const data = await request.get(apiPath)
    detail.value = data || {}
    const { gridData: gd, colorPalette: cp } = deriveFromMapped(data?.mappedPixelData || '')
    gridData.value = gd
    colorPalette.value = cp

    const hasUserOriginal = !!pickUrl(data, USER_ORIGINAL_FIELDS)
    const hasAiOriginal = !!pickUrl(data, AI_ORIGINAL_FIELDS)

    if (gd.length && cp.length) {
      activeTab.value = 'result'
    } else if (hasUserOriginal || data?.sourceUrl || data?.coverUrl) {
      activeTab.value = hasUserOriginal ? 'userOriginal' : 'original'
    } else if (hasAiOriginal) {
      activeTab.value = 'aiOriginal'
    } else {
      activeTab.value = 'result'
    }

  } catch (e) {
    loadError.value = e.message || '加载失败'
  } finally {
    loading.value = false
    await nextTick()
    if ((activeTab.value === 'result' || activeTab.value === 'pattern') && hasPatternData.value) {
      renderCurrentTab()
    }
  }
}

function switchTab(tab) {
  activeTab.value = tab
  imageLoadError.value = false
  nextTick(() => {
    if ((tab === 'result' || tab === 'pattern') && hasPatternData.value) {
      renderCurrentTab()
    }
  })
}

function renderCurrentTab() {
  if (!previewCanvas.value || !hasPatternData.value) return
  const canvas = previewCanvas.value
  const gd = gridData.value
  const cp = colorPalette.value
  const size = detail.value.gridSize || gd.length
  const maxDisplay = 600
  const cellPixel = Math.max(4, Math.floor(maxDisplay / size))
  const drawSize = cellPixel * size

  if (activeTab.value === 'result') {
    canvas.width = drawSize
    canvas.height = drawSize
    renderResult(canvas, gd, cp)
    canvasDisplayWidth.value = drawSize
  } else if (activeTab.value === 'pattern') {
    canvas.width = drawSize + 80
    canvas.height = drawSize + 80
    renderPattern(canvas, gd, cp, size)
    canvasDisplayWidth.value = Math.min(canvas.width, maxDisplay)
  }
}

function onImageError() {
  imageLoadError.value = true
}

watch(activeImageUrl, () => {
  imageLoadError.value = false
})
</script>

<style scoped>
.preview-info {
  display: flex;
  flex-wrap: wrap;
  gap: 12px 16px;
  margin-bottom: 16px;
  font-size: 13px;
  color: #606266;
}
.preview-tabs {
  display: flex;
  gap: 0;
  border-bottom: 2px solid #ebeef5;
  margin-bottom: 16px;
}
.tab-item {
  padding: 8px 18px;
  cursor: pointer;
  font-size: 14px;
  color: #606266;
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
  user-select: none;
  transition: color 0.2s, border-color 0.2s;
}
.tab-item:hover {
  color: #409eff;
}
.tab-item.active {
  color: #409eff;
  border-bottom-color: #409eff;
  font-weight: 600;
}
.preview-canvas-wrap {
  text-align: center;
  min-height: 260px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.preview-canvas {
  image-rendering: pixelated;
  border: 1px solid #ebeef5;
  border-radius: 4px;
}
.preview-image-wrap {
  text-align: center;
  min-height: 260px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.preview-image {
  max-width: 100%;
  max-height: 560px;
  border-radius: 4px;
}
</style>
