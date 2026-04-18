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
          <p>支持三种位置：右下角、左下角、平铺显示。</p>
        </template>
      </el-alert>

      <el-form :model="form" label-width="100px" style="max-width: 600px">
        <el-form-item label="启用水印">
          <el-switch
            v-model="form.enabled"
            :active-value="1"
            :inactive-value="0"
            @change="handleEnabledChange"
          />
          <span style="margin-left: 12px; color: #909399">
            {{ form.enabled ? '已启用' : '已禁用' }}
          </span>
        </el-form-item>

        <el-form-item label="水印文字">
          <el-input v-model="form.text" placeholder="请输入水印文字" />
        </el-form-item>

        <el-form-item label="字体大小">
          <el-input-number v-model="form.fontSize" :min="12" :max="72" />
          <span style="margin-left: 12px; color: #909399">px</span>
        </el-form-item>

        <el-form-item label="水印颜色">
          <el-color-picker v-model="form.color" />
          <el-input
            v-model="form.color"
            placeholder="rgba(128,128,128,0.5)"
            style="width: 180px; margin-left: 12px"
          />
        </el-form-item>

        <el-form-item label="位置">
          <el-radio-group v-model="form.position">
            <el-radio label="右下">右下角</el-radio>
            <el-radio label="左下">左下角</el-radio>
            <el-radio label="平铺">平铺</el-radio>
          </el-radio-group>
        </el-form-item>

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

        <el-form-item label="边距">
          <el-input-number v-model="form.margin" :min="0" :max="100" />
          <span style="margin-left: 12px; color: #909399">px</span>
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
            width: 300px;
            height: 200px;
            background: #f5f5f5;
            border: 1px solid #dcdfe6;
            border-radius: 8px;
            position: relative;
            overflow: hidden;
          "
        >
          <canvas ref="previewCanvas" width="300" height="200"></canvas>
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
  enabled: 1,
  text: '拼豆小程序',
  fontSize: 24,
  color: 'rgba(128,128,128,0.5)',
  position: '右下',
  opacity: 0.5,
  margin: 20
})

const saving = ref(false)
const previewCanvas = ref(null)

async function load() {
  try {
    const res = await request.get('/watermark/config')
    if (res) {
      form.value = {
        enabled: res.enabled ?? 1,
        text: res.text ?? '拼豆小程序',
        fontSize: res.fontSize ?? 24,
        color: res.color ?? 'rgba(128,128,128,0.5)',
        position: res.position ?? '右下',
        opacity: res.opacity ?? 0.5,
        margin: res.margin ?? 20
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
      enabled: form.value.enabled,
      text: form.value.text,
      fontSize: form.value.fontSize,
      color: form.value.color,
      position: form.value.position,
      opacity: form.value.opacity,
      margin: form.value.margin
    })
    ElMessage.success('保存成功')
  } catch (e) {
    ElMessage.error('保存失败')
  } finally {
    saving.value = false
  }
}

function handleEnabledChange(val) {
  form.value.enabled = val
  nextTick(() => drawPreview())
}

function parseColor(colorStr) {
  // 解析 rgba(r,g,b,a) 格式
  const match = colorStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/)
  if (match) {
    return {
      r: parseInt(match[1]),
      g: parseInt(match[2]),
      b: parseInt(match[3]),
      a: match[4] ? parseFloat(match[4]) : 1
    }
  }
  // 解析 hex 格式
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

  // 模拟色号图背景（棋盘格）
  const cellSize = 10
  for (let y = 0; y < height; y += cellSize) {
    for (let x = 0; x < width; x += cellSize) {
      ctx.fillStyle = (Math.floor(x / cellSize) + Math.floor(y / cellSize)) % 2 === 0 ? '#fff' : '#eee'
      ctx.fillRect(x, y, cellSize, cellSize)
    }
  }

  if (!form.value.enabled) {
    ctx.fillStyle = '#666'
    ctx.font = '14px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('水印已禁用', width / 2, height / 2)
    return
  }

  const color = parseColor(form.value.color)
  const fontSize = Math.round(form.value.fontSize * 0.6) // 预览缩放
  ctx.font = `${fontSize}px sans-serif`
  ctx.textBaseline = 'middle'

  const text = form.value.text || ''
  const metrics = ctx.measureText(text)
  const textWidth = metrics.width
  const textHeight = fontSize

  if (form.value.position === '平铺') {
    // 平铺效果
    const spacing = 100
    ctx.fillStyle = `rgba(${color.r},${color.g},${color.b},${color.a * form.value.opacity})`
    ctx.save()
    ctx.translate(0, 0)
    for (let y = 0; y < height + spacing; y += spacing) {
      for (let x = (y / spacing) % 2 === 0 ? 0 : -spacing / 2; x < width + spacing; x += spacing) {
        ctx.save()
        ctx.translate(x, y)
        ctx.rotate(-Math.PI / 6)
        ctx.fillText(text, 0, 0)
        ctx.restore()
      }
    }
    ctx.restore()
  } else {
    // 单个水印
    ctx.fillStyle = `rgba(${color.r},${color.g},${color.b},${color.a * form.value.opacity})`
    const margin = form.value.margin * 0.5

    if (form.value.position === '右下') {
      ctx.textAlign = 'right'
      ctx.fillText(text, width - margin, height - margin)
    } else {
      ctx.textAlign = 'left'
      ctx.fillText(text, margin, height - margin)
    }
  }
}

// 监听配置变化，实时更新预览
watch(form, () => {
  nextTick(() => drawPreview())
}, { deep: true })

onMounted(load)
</script>
