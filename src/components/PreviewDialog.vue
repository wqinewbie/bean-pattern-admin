<template>
  <el-dialog
    v-model="visible"
    :title="`预览 - ${detail.name || '未命名'}`"
    width="700px"
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
      <!-- 图纸信息 -->
      <div class="preview-info">
        <span>规格：{{ detail.gridSize }}x{{ detail.gridSize }}</span>
        <span>色数：{{ detail.colorCount }}</span>
        <span>品牌：{{ detail.brand || '-' }}</span>
        <span>来源：{{ sourceTypeLabel }}</span>
      </div>

      <!-- 标签切换 -->
      <div class="preview-tabs">
        <span
          :class="['tab-item', { active: activeTab === 'result' }]"
          @click="switchTab('result')"
        >效果图</span>
        <span
          :class="['tab-item', { active: activeTab === 'pattern' }]"
          @click="switchTab('pattern')"
        >色号图</span>
        <span
          v-if="detail.sourceUrl || detail.coverUrl"
          :class="['tab-item', { active: activeTab === 'original' }]"
          @click="switchTab('original')"
        >原图</span>
      </div>

      <!-- 效果图 / 色号图 -->
      <div v-show="activeTab !== 'original'" class="preview-canvas-wrap">
        <canvas
          ref="previewCanvas"
          class="preview-canvas"
          :style="{ maxWidth: canvasDisplayWidth + 'px' }"
        ></canvas>
      </div>

      <!-- 原图 -->
      <div v-show="activeTab === 'original'" class="preview-image-wrap">
        <img
          v-if="originalUrl"
          :src="originalUrl"
          class="preview-image"
          @error="onImageError"
        />
        <span v-else style="color:#8b90a7">无原图</span>
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

watch(() => props.modelValue, (val) => { visible.value = val })
watch(visible, (val) => { emit('update:modelValue', val) })

const originalUrl = computed(() => detail.value.sourceUrl || detail.value.coverUrl || '')

const sourceTypeLabel = computed(() => {
  const map = {
    'AI_GENERATE': 'AI生成',
    'IMAGE_CONVERT': '图片转换',
    'BLANK_CANVAS': '空白画板',
    'DRAW': '画板绘制',
    'EDIT': '编辑',
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
  if (!props.recordId) { loadError.value = '记录ID无效'; return }
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
    const { gridData: gd, colorPalette: cp } = deriveFromMapped(data.mappedPixelData || '')
    gridData.value = gd
    colorPalette.value = cp
    // 默认显示效果图（有数据时），否则看原图
    if (gd.length && cp.length) {
      activeTab.value = 'result'
    } else if (data.sourceUrl || data.coverUrl) {
      activeTab.value = 'original'
    } else {
      activeTab.value = 'result'
    }
    await nextTick()
    if (activeTab.value !== 'original' && gd.length && cp.length) {
      renderCurrentTab()
    }
  } catch (e) {
    loadError.value = e.message || '加载失败'
  } finally {
    loading.value = false
  }
}

function switchTab(tab) {
  activeTab.value = tab
  nextTick(() => {
    if (tab !== 'original' && gridData.value.length && colorPalette.value.length) {
      renderCurrentTab()
    }
  })
}

function renderCurrentTab() {
  if (!previewCanvas.value) return
  const canvas = previewCanvas.value
  const gd = gridData.value
  const cp = colorPalette.value
  const size = detail.value.gridSize || gd.length

  // 计算 canvas 尺寸：最大 600 宽，按格子等比缩放
  const maxDisplay = 600
  const cellPixel = Math.max(4, Math.floor(maxDisplay / size))
  const drawSize = cellPixel * size

  if (activeTab.value === 'result') {
    canvas.width = drawSize
    canvas.height = drawSize
    renderResult(canvas, gd, cp)
    canvasDisplayWidth.value = drawSize
  } else if (activeTab.value === 'pattern') {
    // pattern 画布大小由 renderPattern 内部根据 maxCanvasSize 调整
    canvas.width = drawSize + 80
    canvas.height = drawSize + 80
    renderPattern(canvas, gd, cp, size)
    // pattern 实际尺寸可能超过容器，限制显示宽度
    canvasDisplayWidth.value = Math.min(canvas.width, maxDisplay)
  }
}

function onImageError(e) {
  e.target.style.display = 'none'
}
</script>

<style scoped>
.preview-info {
  display: flex;
  gap: 16px;
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
  padding: 8px 20px;
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
  min-height: 200px;
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
  min-height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.preview-image {
  max-width: 100%;
  max-height: 500px;
  border-radius: 4px;
}
</style>
