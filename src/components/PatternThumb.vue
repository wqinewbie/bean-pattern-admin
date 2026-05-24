<template>
  <canvas
    v-if="hasPatternData"
    ref="canvasRef"
    class="pattern-thumb"
    width="46"
    height="46"
  ></canvas>
  <el-image
    v-else-if="imageUrl"
    :src="imageUrl"
    class="pattern-thumb"
    fit="cover"
    :preview-src-list="[imageUrl]"
    preview-teleported
  />
  <span v-else style="color:#8b90a7">-</span>
</template>

<script setup>
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { deriveFromMapped, renderResult } from '../utils/patternRenderer'

const props = defineProps({
  mappedPixelData: { type: [String, Array], default: '' },
  imageUrl: { type: String, default: '' }
})

const canvasRef = ref(null)

const parsed = computed(() => deriveFromMapped(props.mappedPixelData || ''))
const hasPatternData = computed(() => parsed.value.gridData.length && parsed.value.colorPalette.length)

async function renderThumb() {
  await nextTick()
  if (!canvasRef.value || !hasPatternData.value) return
  renderResult(canvasRef.value, parsed.value.gridData, parsed.value.colorPalette)
}

onMounted(renderThumb)
watch(() => props.mappedPixelData, renderThumb)
</script>

<style scoped>
.pattern-thumb {
  width: 46px;
  height: 46px;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  background: #fff;
  image-rendering: pixelated;
  object-fit: cover;
}
</style>
