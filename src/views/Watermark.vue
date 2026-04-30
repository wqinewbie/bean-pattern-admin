<template>
  <div>
    <el-card shadow="never">
      <el-alert
        title="水印配置说明"
        type="info"
        :closable="false"
        style="margin-bottom: 20px"
      >
        <template #default>
          <p>水印将应用于生成图纸时的色号图预览。配置后小程序端会根据此配置自动渲染水印。</p>
          <p><strong>小程序名称</strong>将显示在色号图顶部，所有用户统一。</p>
          <p><strong>默认水印文字</strong>用于普通用户，VIP用户可在小程序端自定义文字。</p>
          <p><strong>水印样式</strong>（颜色、角度、密集度）所有用户统一，VIP用户也使用此样式。</p>
        </template>
      </el-alert>

      <el-form :model="form" label-width="120px" style="max-width: 700px">
        <!-- 小程序名称 -->
        <el-form-item label="小程序名称">
          <el-input 
            v-model="form.appName" 
            placeholder="请输入小程序名称"
            maxlength="20"
            show-word-limit
          />
          <div style="margin-top: 8px; color: #909399; font-size: 12px">
            显示在色号图顶部，所有用户统一
          </div>
        </el-form-item>

        <el-divider />

        <!-- 默认水印文字 -->
        <el-form-item label="默认水印文字">
          <el-input 
            v-model="form.defaultText" 
            placeholder="请输入默认水印文字"
            maxlength="30"
            show-word-limit
          />
          <div style="margin-top: 8px; color: #909399; font-size: 12px">
            普通用户使用此水印，VIP用户可在小程序端自定义
          </div>
        </el-form-item>

        <el-divider>
          <span style="color: #909399; font-size: 14px">水印样式（所有用户统一）</span>
        </el-divider>

        <!-- 字体大小 -->
        <el-form-item label="字体大小">
          <el-input-number v-model="form.fontSize" :min="12" :max="72" />
          <span style="margin-left: 12px; color: #909399">px</span>
        </el-form-item>

        <!-- 颜色 -->
        <el-form-item label="颜色">
          <el-input
            v-model="form.color"
            placeholder="rgba(100,100,100,0.25)"
            style="width: 250px"
          />
          <div style="margin-top: 8px; color: #909399; font-size: 12px">
            建议使用 rgba 格式，支持透明度
          </div>
        </el-form-item>

        <!-- 倾斜角度 -->
        <el-form-item label="倾斜角度">
          <el-slider
            v-model="form.angle"
            :min="-45"
            :max="45"
            :step="5"
            :format-tooltip="val => val + '°'"
            style="width: 300px"
          />
          <span style="margin-left: 12px; color: #909399">
            {{ form.angle }}°
          </span>
        </el-form-item>

        <!-- 密集度 -->
        <el-form-item label="水平间距">
          <el-slider
            v-model="form.spacingXRatio"
            :min="0.1"
            :max="0.5"
            :step="0.01"
            :format-tooltip="val => (val * 100).toFixed(0) + '%'"
            style="width: 300px"
          />
          <span style="margin-left: 12px; color: #909399">
            {{ (form.spacingXRatio * 100).toFixed(0) }}%（画布宽度）
          </span>
        </el-form-item>

        <el-form-item label="垂直间距">
          <el-slider
            v-model="form.spacingYRatio"
            :min="0.1"
            :max="0.5"
            :step="0.01"
            :format-tooltip="val => (val * 100).toFixed(0) + '%'"
            style="width: 300px"
          />
          <span style="margin-left: 12px; color: #909399">
            {{ (form.spacingYRatio * 100).toFixed(0) }}%（画布高度）
          </span>
        </el-form-item>

        <!-- 透明度 -->
        <el-form-item label="透明度">
          <el-slider
            v-model="form.opacity"
            :min="0"
            :max="1"
            :step="0.05"
            :format-tooltip="val => (val * 100).toFixed(0) + '%'"
            style="width: 300px"
          />
          <span style="margin-left: 12px; color: #909399">
            {{ (form.opacity * 100).toFixed(0) }}%
          </span>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="save" :loading="saving">保存配置</el-button>
          <el-button @click="load">重置</el-button>
        </el-form-item>
      </el-form>

      <el-divider />

      <div style="margin-top: 20px">
        <h4 style="margin-bottom: 12px; color: #303133">预览效果</h4>
        <div
          style="
            width: 400px;
            height: 300px;
            background: #f5f5f5;
            border: 1px solid #dcdfe6;
            border-radius: 8px;
            position: relative;
            overflow: hidden;
          "
        >
          <canvas ref="previewCanvas" width="400" height="300"></canvas>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import request from '../utils/request'

const form = ref({
  appName: '拼豆魔法屋',
  defaultText: '拼豆魔法屋出品',
  fontSize: 24,
  color: 'rgba(100,100,100,0.25)',
  angle: -30,
  spacingXRatio: 0.22,
  spacingYRatio: 0.18,
  opacity: 0.25
})

const saving = ref(false)
const previewCanvas = ref(null)

async function load() {
  try {
    const res = await request.get('/watermark/config')
    if (res) {
      form.value = {
        appName: res.appName ?? '拼豆魔法屋',
        defaultText: res.defaultText ?? '拼豆魔法屋出品',
        fontSize: res.fontSize ?? 24,
        color: res.color ?? 'rgba(100,100,100,0.25)',
        angle: res.angle ?? -30,
        spacingXRatio: res.spacingXRatio ?? 0.22,
        spacingYRatio: res.spacingYRatio ?? 0.18,
        opacity: res.opacity ?? 0.25
      }
    }
  } catch (e) {
    console.error('加载配置失败', e)
  }
  nextTick(() => drawPreview())
}

async function save() {
  saving.value = true
  try {
    await request.post('/watermark/config', {
      appName: form.value.appName,
      defaultText: form.value.defaultText,
      fontSize: form.value.fontSize,
      color: form.value.color,
      angle: form.value.angle,
      spacingXRatio: form.value.spacingXRatio,
      spacingYRatio: form.value.spacingYRatio,
      opacity: form.value.opacity
    })
    ElMessage.success('保存成功')
  } catch (e) {
    ElMessage.error('保存失败')
  } finally {
    saving.value = false
  }
}

function parseColor(colorStr) {
  const match = colorStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/)
  if (match) {
    return {
      r: parseInt(match[1]),
      g: parseInt(match[2]),
      b: parseInt(match[3]),
      a: match[4] ? parseFloat(match[4]) : 1
    }
  }
  const hex = colorStr.replace('#', '')
  return {
    r: parseInt(hex.substring(0, 2), 16),
    g: parseInt(hex.substring(2, 4), 16),
    b: parseInt(hex.substring(4, 6), 16),
    a: 1
  }
}

function drawPreview() {
  const canvas = previewCanvas.value
  if (!canvas) return

  const ctx = canvas.getContext('2d')
  const width = canvas.width
  const height = canvas.height

  // 清空画布
  ctx.clearRect(0, 0, width, height)

  // 绘制小程序名称（顶部）
  if (form.value.appName) {
    ctx.fillStyle = '#5D4037'
    ctx.font = 'bold 16px sans-serif'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'top'
    ctx.fillText(form.value.appName, 15, 15)
  }

  // 模拟色号图背景（从顶部留出空间）
  const topOffset = 45
  const cellSize = 12
  for (let y = topOffset; y < height; y += cellSize) {
    for (let x = 0; x < width; x += cellSize) {
      ctx.fillStyle = (Math.floor(x / cellSize) + Math.floor((y - topOffset) / cellSize)) % 2 === 0 ? '#fff' : '#eee'
      ctx.fillRect(x, y, cellSize, cellSize)
    }
  }

  // 绘制水印
  const color = parseColor(form.value.color)
  const fontSize = Math.round(form.value.fontSize * 0.5) // 预览缩放
  const text = form.value.defaultText || ''
  const angle = form.value.angle || -30
  const spacingX = Math.floor(width * form.value.spacingXRatio)
  const spacingY = Math.floor((height - topOffset) * form.value.spacingYRatio)

  ctx.font = `${fontSize}px sans-serif`
  ctx.fillStyle = `rgba(${color.r},${color.g},${color.b},${color.a * form.value.opacity})`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  const angleRad = (angle * Math.PI) / 180

  for (let y = topOffset; y < height + spacingY; y += spacingY) {
    for (let x = -spacingX; x < width + spacingX; x += spacingX) {
      ctx.save()
      ctx.translate(x, y)
      ctx.rotate(angleRad)
      ctx.fillText(text, 0, 0)
      ctx.restore()
    }
  }
}

// 监听配置变化，实时更新预览
watch(form, () => {
  nextTick(() => drawPreview())
}, { deep: true })

onMounted(load)
</script>
