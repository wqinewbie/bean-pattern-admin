<template>
  <div class="bead-page">
    <el-row :gutter="16">
      <el-col :span="7">
        <el-card shadow="never" class="panel">
          <template #header>
            <div class="panel-header">
              <span>品牌 / 套装 / 色盘</span>
              <el-button size="small" @click="loadTree">刷新</el-button>
            </div>
          </template>
          <el-tree
            :data="treeData"
            node-key="key"
            :expand-on-click-node="false"
            :default-expand-all="true"
            @node-click="onTreeNodeClick"
          >
            <template #default="{ data }">
              <span :class="['node', 'node-' + data.type]">{{ data.label }}</span>
            </template>
          </el-tree>
        </el-card>
      </el-col>

      <el-col :span="17">
        <el-card shadow="never" class="panel">
          <template #header>
            <div class="panel-header">
              <span>{{ rightTitle }}</span>
              <el-tag v-if="selectedPaletteId" type="success">色码 {{ paletteColors.length }}</el-tag>
            </div>
          </template>

          <div v-if="!selectedPaletteId" class="empty-tip">请在左侧树中选择某个“色盘”查看对应色码</div>

          <template v-else>
            <div class="op-row" style="margin-bottom:10px">
              <el-input
                v-model="paletteColorQ"
                placeholder="筛选当前色盘色号 / HEX"
                style="max-width:240px"
                clearable
              />
              <el-select
                v-model="batchColorCodes"
                multiple
                filterable
                clearable
                collapse-tags
                collapse-tags-tooltip
                placeholder="按色号多选后批量添加"
                style="min-width:340px;max-width:520px"
              >
                <el-option
                  v-for="c in selectableColorOptions"
                  :key="c.id"
                  :label="`${c.code} (${c.hex})`"
                  :value="c.code"
                />
              </el-select>
              <el-button type="primary" :loading="addingBatchColors" @click="batchAddPaletteColors">批量添加</el-button>
            </div>
            <el-table :data="filteredPaletteColors" stripe>
            <el-table-column prop="code" label="色号" width="140" />
            <el-table-column prop="hex" label="HEX" width="120" />
            <el-table-column label="颜色" width="90">
              <template #default="{row}">
                <div :style="{width:'28px',height:'28px',borderRadius:'8px',background:row.hex,border:'1px solid #ddd'}"></div>
              </template>
            </el-table-column>
            <el-table-column label="RGB" width="160">
              <template #default="{row}">({{ row.r }}, {{ row.g }}, {{ row.b }})</template>
            </el-table-column>
            <el-table-column label="操作" width="280">
              <template #default="{row}">
                <el-button size="small" @click="openEditColor(row)">编辑</el-button>
                <el-button size="small" type="danger" @click="removeColor(row)">删除</el-button>
              </template>
            </el-table-column>
            </el-table>
          </template>
        </el-card>
      </el-col>
    </el-row>

    <el-tabs v-model="activeTab" type="border-card" class="ops-tabs">
      <el-tab-pane label="品牌管理" name="brands">
        <div class="op-row">
          <el-input v-model="brandName" placeholder="输入品牌名" style="max-width:280px" />
          <el-button type="primary" @click="createBrand">新增</el-button>
        </div>
        <el-table :data="brands" stripe>
          <el-table-column prop="id" label="ID" width="80" />
          <el-table-column prop="name" label="品牌名" />
          <el-table-column label="操作" width="280">
            <template #default="{row}">
              <el-button size="small" @click="editBrand(row)">编辑</el-button>
              <el-button size="small" type="danger" @click="removeBrand(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <el-tab-pane label="色盘管理" name="palettes">
        <div class="op-row">
          <el-input v-model="paletteName" placeholder="色盘名" style="max-width:220px" />
          <el-input v-model="paletteRemark" placeholder="备注（可选）" style="max-width:340px" />
          <el-button type="primary" @click="createPalette">新增</el-button>
        </div>
        <el-table :data="palettes" stripe>
          <el-table-column prop="id" label="ID" width="80" />
          <el-table-column prop="name" label="色盘名" width="220" />
          <el-table-column prop="remark" label="备注" />
          <el-table-column label="操作" width="280">
            <template #default="{row}">
              <el-button size="small" type="primary" text @click="enterPaletteForBatchAdd(row)">进入并批量添加</el-button>
              <el-button size="small" @click="editPalette(row)">编辑</el-button>
              <el-button size="small" type="danger" @click="removePalette(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <el-tab-pane label="色码管理" name="colors">
        <div class="op-row">
          <el-input v-model="colorQ" placeholder="搜索色号" style="max-width:220px" clearable @input="loadColors" />
          <el-button type="primary" @click="openCreateColor">新增色码</el-button>
        </div>
        <el-table :data="colors" stripe>
          <el-table-column prop="id" label="ID" width="80" />
          <el-table-column prop="code" label="色号" width="140" />
          <el-table-column prop="hex" label="HEX" width="120" />
          <el-table-column label="颜色" width="90">
            <template #default="{row}">
              <div :style="{width:'28px',height:'28px',borderRadius:'8px',background:row.hex,border:'1px solid #ddd'}"></div>
            </template>
          </el-table-column>
          <el-table-column label="RGB" width="160">
            <template #default="{row}">({{ row.r }}, {{ row.g }}, {{ row.b }})</template>
          </el-table-column>
          <el-table-column label="操作" width="280">
            <template #default="{row}">
              <el-button size="small" @click="openEditColor(row)">编辑</el-button>
              <el-button size="small" type="danger" @click="removeColor(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>
    </el-tabs>

    <el-dialog v-model="colorDialogVisible" :title="colorForm.id ? '编辑色码' : '新增色码'" width="420px">
      <el-form label-width="78px">
        <el-form-item label="色号"><el-input v-model="colorForm.code" /></el-form-item>
        <el-form-item label="HEX">
          <el-input v-model="colorForm.hex" placeholder="#RRGGBB" @blur="normalizeHexInput" />
        </el-form-item>
        <el-form-item label="预览">
          <div class="color-preview-box" :style="{ background: colorForm.hex || '#000000' }"></div>
          <el-button size="small" @click="applyHexToRgb">HEX→RGB</el-button>
          <el-button size="small" @click="applyRgbToHex">RGB→HEX</el-button>
        </el-form-item>
        <el-form-item label="R"><el-input-number v-model="colorForm.r" :min="0" :max="255" /></el-form-item>
        <el-form-item label="G"><el-input-number v-model="colorForm.g" :min="0" :max="255" /></el-form-item>
        <el-form-item label="B"><el-input-number v-model="colorForm.b" :min="0" :max="255" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="colorDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveColor">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '../utils/request'

const activeTab = ref('brands')
const brands = ref([])
const brandName = ref('')
const palettes = ref([])
const paletteName = ref('')
const paletteRemark = ref('')
const colors = ref([])
const colorQ = ref('')
const colorDialogVisible = ref(false)
const colorForm = reactive({ id: null, code: '', hex: '#000000', r: 0, g: 0, b: 0 })
const paletteColorQ = ref('')
const batchColorCodes = ref([])
const addingBatchColors = ref(false)

const treeData = ref([])
const selectedPaletteId = ref(null)
const selectedPath = ref('')
const paletteColors = ref([])
const rightTitle = computed(() => selectedPath.value || '联动色码视图')
const filteredPaletteColors = computed(() => {
  const q = paletteColorQ.value.trim().toLowerCase()
  if (!q) return paletteColors.value
  return paletteColors.value.filter((c) => {
    const code = String(c.code || '').toLowerCase()
    const hex = String(c.hex || '').toLowerCase()
    return code.includes(q) || hex.includes(q)
  })
})
const selectableColorOptions = computed(() => {
  const selected = new Set((paletteColors.value || []).map((c) => c.code))
  return (colors.value || []).filter((c) => !selected.has(c.code))
})

async function loadBrands() { brands.value = await request.get('/api/admin/bead/brands') }
async function loadPalettes() { palettes.value = await request.get('/api/admin/bead/palettes') }
async function loadColors() { colors.value = await request.get('/api/admin/bead/colors', { params: { q: colorQ.value } }) }

async function loadTree() {
  const data = await request.get('/api/admin/bead/tree')
  treeData.value = (data || []).map((b) => ({
    ...b,
    key: `brand_${b.id}`,
    children: (b.children || []).map((k) => ({
      ...k,
      key: `kit_${k.id}`,
      children: (k.children || []).map((p) => ({ ...p, key: `palette_${p.id}` }))
    }))
  }))
}

async function loadPaletteColors(paletteId) {
  paletteColors.value = await request.get(`/api/admin/bead/palettes/${paletteId}/colors`)
}

async function batchAddPaletteColors() {
  if (!selectedPaletteId.value) {
    ElMessage.warning('请先选择色盘')
    return
  }
  if (!batchColorCodes.value.length) {
    ElMessage.warning('请先选择要添加的色号')
    return
  }
  addingBatchColors.value = true
  try {
    const res = await request.post(`/api/admin/bead/palettes/${selectedPaletteId.value}/batch-add-colors`, {
      codes: batchColorCodes.value,
    })
    const added = Number(res?.addedCount || 0)
    const ignored = Number(res?.ignoredCount || 0)
    const missing = Number(res?.missingCount || 0)
    ElMessage.success(`批量添加完成：新增 ${added}，已存在 ${ignored}，未找到 ${missing}`)
    batchColorCodes.value = []
    await loadPaletteColors(selectedPaletteId.value)
  } finally {
    addingBatchColors.value = false
  }
}

async function onTreeNodeClick(data, node) {
  if (data.type !== 'palette') return
  selectedPaletteId.value = data.id
  const labels = []
  let cur = node
  while (cur && cur.data) {
    labels.unshift(cur.data.label)
    cur = cur.parent
  }
  selectedPath.value = labels.join(' / ')
  batchColorCodes.value = []
  await loadPaletteColors(data.id)
}

async function createBrand() {
  if (!brandName.value.trim()) return
  await request.post('/api/admin/bead/brands', { name: brandName.value.trim() })
  brandName.value = ''
  ElMessage.success('新增成功')
  await Promise.all([loadBrands(), loadTree()])
}
async function editBrand(row) {
  const { value } = await ElMessageBox.prompt('请输入新品牌名', '编辑品牌', { inputValue: row.name })
  await request.put(`/api/admin/bead/brands/${row.id}`, { name: value })
  ElMessage.success('已更新')
  await Promise.all([loadBrands(), loadTree()])
}
async function removeBrand(row) {
  await ElMessageBox.confirm(`确认删除品牌「${row.name}」？`, '提示', { type: 'warning' })
  await request.delete(`/api/admin/bead/brands/${row.id}`)
  ElMessage.success('已删除')
  await Promise.all([loadBrands(), loadTree()])
}

async function createPalette() {
  if (!paletteName.value.trim()) return
  await request.post('/api/admin/bead/palettes', { name: paletteName.value.trim(), remark: paletteRemark.value.trim() })
  paletteName.value = ''
  paletteRemark.value = ''
  ElMessage.success('新增成功')
  await Promise.all([loadPalettes(), loadTree()])
}
async function editPalette(row) {
  const { value: name } = await ElMessageBox.prompt('请输入色盘名', '编辑色盘', { inputValue: row.name })
  await request.put(`/api/admin/bead/palettes/${row.id}`, { name, remark: row.remark || '' })
  ElMessage.success('已更新')
  await Promise.all([loadPalettes(), loadTree()])
}
async function enterPaletteForBatchAdd(row) {
  if (!row?.id) return
  activeTab.value = 'palettes'
  selectedPaletteId.value = row.id
  selectedPath.value = row.name || `色盘#${row.id}`
  batchColorCodes.value = []
  await loadPaletteColors(row.id)
}
async function removePalette(row) {
  await ElMessageBox.confirm(`确认删除色盘「${row.name}」？`, '提示', { type: 'warning' })
  await request.delete(`/api/admin/bead/palettes/${row.id}`)
  ElMessage.success('已删除')
  await Promise.all([loadPalettes(), loadTree()])
}

function openCreateColor() {
  Object.assign(colorForm, { id: null, code: '', hex: '#000000', r: 0, g: 0, b: 0 })
  colorDialogVisible.value = true
}
function openEditColor(row) {
  Object.assign(colorForm, { id: row.id, code: row.code, hex: row.hex || '#000000', r: row.r, g: row.g, b: row.b })
  colorDialogVisible.value = true
}

function normalizeHexInput() {
  let hex = String(colorForm.hex || '').trim().toUpperCase()
  if (!hex) {
    colorForm.hex = '#000000'
    return
  }
  if (!hex.startsWith('#')) hex = '#' + hex
  colorForm.hex = hex
}

function applyHexToRgb() {
  normalizeHexInput()
  const m = /^#([0-9A-F]{6})$/.exec(colorForm.hex)
  if (!m) {
    ElMessage.warning('HEX 格式不正确，请输入 #RRGGBB')
    return
  }
  const v = m[1]
  colorForm.r = parseInt(v.slice(0, 2), 16)
  colorForm.g = parseInt(v.slice(2, 4), 16)
  colorForm.b = parseInt(v.slice(4, 6), 16)
}

function applyRgbToHex() {
  const r = Math.max(0, Math.min(255, Number(colorForm.r || 0)))
  const g = Math.max(0, Math.min(255, Number(colorForm.g || 0)))
  const b = Math.max(0, Math.min(255, Number(colorForm.b || 0)))
  colorForm.hex = '#' + [r, g, b].map((n) => n.toString(16).padStart(2, '0')).join('').toUpperCase()
}
async function saveColor() {
  normalizeHexInput()
  const payload = {
    code: String(colorForm.code || '').trim(),
    hex: String(colorForm.hex || '').trim().toUpperCase(),
    r: Number(colorForm.r || 0),
    g: Number(colorForm.g || 0),
    b: Number(colorForm.b || 0),
  }
  if (colorForm.id) await request.put(`/api/admin/bead/colors/${colorForm.id}`, payload)
  else await request.post('/api/admin/bead/colors', payload)
  colorDialogVisible.value = false
  ElMessage.success('已保存')
  await loadColors()
  if (selectedPaletteId.value) {
    await loadPaletteColors(selectedPaletteId.value)
  }
}
async function removeColor(row) {
  await ElMessageBox.confirm(`确认删除色码「${row.code}」？`, '提示', { type: 'warning' })
  await request.delete(`/api/admin/bead/colors/${row.id}`)
  ElMessage.success('已删除')
  await loadColors()
  if (selectedPaletteId.value) {
    paletteColors.value = await request.get(`/api/admin/bead/palettes/${selectedPaletteId.value}/colors`)
  }
}

onMounted(async () => {
  await Promise.all([loadBrands(), loadPalettes(), loadColors(), loadTree()])
})
</script>

<style scoped>
.bead-page { display: flex; flex-direction: column; gap: 16px; }
.panel { min-height: 360px; }
.panel-header { display: flex; justify-content: space-between; align-items: center; }
.node { font-size: 13px; }
.node-brand { font-weight: 700; }
.node-kit { color: #e6a23c; }
.node-palette { color: #67c23a; }
.empty-tip { color: #8b90a7; font-size: 13px; padding: 30px 4px; }
.ops-tabs { margin-top: 2px; }
.op-row { margin-bottom: 12px; display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
.color-preview-box { width: 34px; height: 34px; border-radius: 8px; border: 1px solid #dcdfe6; margin-right: 10px; }
</style>
