<template>
  <div class="bead-library-page">
    <el-tabs v-model="activeTab" type="border-card">
      <!-- Tab 0: 层级视图 -->
      <el-tab-pane label="层级视图" name="hierarchy">
        <div class="tab-content">
          <div class="hierarchy-container">
            <div class="hierarchy-left">
              <div class="section-title">品牌列表</div>
              <el-menu :default-active="selectedBrandId" @select="handleBrandSelect">
                <el-menu-item v-for="brand in brands" :key="brand.id" :index="String(brand.id)">
                  <span>{{ brand.name }}</span>
                </el-menu-item>
              </el-menu>
            </div>

            <div class="hierarchy-middle" v-if="selectedBrandId">
              <div class="section-title">{{ selectedBrandName }} - 色盘列表</div>
              <el-table
                :data="brandPalettes"
                stripe
                highlight-current-row
                @current-change="handlePaletteSelect"
                style="width: 100%"
              >
                <el-table-column prop="name" label="色盘名称" width="200" />
                <el-table-column prop="remark" label="备注" />
              </el-table>
            </div>

            <div class="hierarchy-right" v-if="selectedPalette">
              <div class="section-title">{{ selectedPalette.name }} - 色码列表</div>
              <el-table :data="hierarchyPaletteColors" stripe max-height="600">
                <el-table-column prop="code" label="色号" width="120" />
                <el-table-column prop="hex" label="HEX" width="100" />
                <el-table-column label="颜色预览" width="80">
                  <template #default="{ row }">
                    <div class="color-preview" :style="{ background: row.hex }"></div>
                  </template>
                </el-table-column>
                <el-table-column label="RGB" width="140">
                  <template #default="{ row }">{{ row.r }}, {{ row.g }}, {{ row.b }}</template>
                </el-table-column>
              </el-table>
            </div>
          </div>
        </div>
      </el-tab-pane>

      <!-- Tab 1: 色码库 -->
      <el-tab-pane label="色码库" name="colors">
        <div class="tab-content">
          <div class="toolbar">
            <el-input
              v-model="colorSearch"
              placeholder="搜索色号或HEX"
              style="width: 240px"
              clearable
              @input="loadColors"
            >
              <template #prefix><el-icon><Search /></el-icon></template>
            </el-input>
            <el-button type="primary" @click="openColorDialog()">
              <el-icon><Plus /></el-icon>新增色码
            </el-button>
          </div>

          <el-table :data="colors" stripe>
            <el-table-column prop="id" label="ID" width="80" />
            <el-table-column prop="code" label="色号" width="140" />
            <el-table-column prop="hex" label="HEX" width="120" />
            <el-table-column label="颜色预览" width="100">
              <template #default="{ row }">
                <div class="color-preview" :style="{ background: row.hex }"></div>
              </template>
            </el-table-column>
            <el-table-column label="RGB" width="160">
              <template #default="{ row }">{{ row.r }}, {{ row.g }}, {{ row.b }}</template>
            </el-table-column>
            <el-table-column label="操作" width="180">
              <template #default="{ row }">
                <el-button size="small" @click="openColorDialog(row)">编辑</el-button>
                <el-button size="small" type="danger" @click="deleteColor(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-tab-pane>

      <!-- Tab 2: 色盘管理 -->
      <el-tab-pane label="色盘管理" name="palettes">
        <div class="tab-content">
          <div class="toolbar">
            <el-button type="primary" @click="openPaletteDialog()">
              <el-icon><Plus /></el-icon>新增色盘
            </el-button>
          </div>

          <el-table :data="palettes" stripe>
            <el-table-column prop="id" label="ID" width="80" />
            <el-table-column prop="name" label="色盘名称" width="200" />
            <el-table-column prop="remark" label="备注" />
            <el-table-column label="色码数量" width="120">
              <template #default="{ row }">
                <el-tag>{{ row.colorCount || 0 }} 个</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="280">
              <template #default="{ row }">
                <el-button size="small" type="primary" @click="openPaletteDetail(row)">
                  管理色码
                </el-button>
                <el-button size="small" @click="openPaletteDialog(row)">编辑</el-button>
                <el-button size="small" type="danger" @click="deletePalette(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-tab-pane>

      <!-- Tab 3: 品牌管理 -->
      <el-tab-pane label="品牌管理" name="brands">
        <div class="tab-content">
          <div class="toolbar">
            <el-button type="primary" @click="openBrandDialog()">
              <el-icon><Plus /></el-icon>新增品牌
            </el-button>
          </div>

          <el-table :data="brands" stripe>
            <el-table-column prop="id" label="ID" width="80" />
            <el-table-column prop="name" label="品牌名称" />
            <el-table-column label="操作" width="180">
              <template #default="{ row }">
                <el-button size="small" @click="openBrandDialog(row)">编辑</el-button>
                <el-button size="small" type="danger" @click="deleteBrand(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-tab-pane>
    </el-tabs>

    <!-- 色码编辑对话框 -->
    <el-dialog
      v-model="colorDialogVisible"
      :title="colorForm.id ? '编辑色码' : '新增色码'"
      width="500px"
    >
      <el-form :model="colorForm" label-width="80px">
        <el-form-item label="色号" required>
          <el-input v-model="colorForm.code" placeholder="例如：C001" />
        </el-form-item>
        <el-form-item label="HEX" required>
          <el-input v-model="colorForm.hex" placeholder="#RRGGBB" @blur="normalizeHex">
            <template #append>
              <el-button @click="hexToRgb">转RGB</el-button>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item label="颜色预览">
          <div class="color-preview-large" :style="{ background: colorForm.hex || '#000000' }"></div>
        </el-form-item>
        <el-form-item label="R">
          <el-input-number v-model="colorForm.r" :min="0" :max="255" style="width: 100%" />
        </el-form-item>
        <el-form-item label="G">
          <el-input-number v-model="colorForm.g" :min="0" :max="255" style="width: 100%" />
        </el-form-item>
        <el-form-item label="B">
          <el-input-number v-model="colorForm.b" :min="0" :max="255" style="width: 100%" />
        </el-form-item>
        <el-form-item>
          <el-button @click="rgbToHex">RGB转HEX</el-button>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="colorDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveColor">保存</el-button>
      </template>
    </el-dialog>

    <!-- 色盘编辑对话框 -->
    <el-dialog
      v-model="paletteDialogVisible"
      :title="paletteForm.id ? '编辑色盘' : '新增色盘'"
      width="500px"
    >
      <el-form :model="paletteForm" label-width="80px">
        <el-form-item label="色盘名称" required>
          <el-input v-model="paletteForm.name" placeholder="例如：基础色盘" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="paletteForm.remark" type="textarea" :rows="3" placeholder="可选" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="paletteDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="savePalette">保存</el-button>
      </template>
    </el-dialog>

    <!-- 色盘详情抽屉 -->
    <el-drawer
      v-model="paletteDetailVisible"
      :title="`色盘：${currentPalette?.name || ''}`"
      size="60%"
    >
      <div class="drawer-content">
        <div class="toolbar">
          <el-select
            v-model="selectedColorCodes"
            multiple
            filterable
            placeholder="从色码库中选择色码批量添加"
            style="flex: 1; max-width: 500px"
            collapse-tags
            collapse-tags-tooltip
          >
            <el-option
              v-for="color in availableColors"
              :key="color.id"
              :label="`${color.code} (${color.hex})`"
              :value="color.code"
            >
              <div style="display: flex; align-items: center; gap: 8px">
                <div class="color-preview-small" :style="{ background: color.hex }"></div>
                <span>{{ color.code }} - {{ color.hex }}</span>
              </div>
            </el-option>
          </el-select>
          <el-button type="primary" @click="addColorsToPalette" :loading="addingColors">
            批量添加
          </el-button>
        </div>

        <el-divider />

        <div class="palette-colors-section">
          <div class="section-header">
            <span>已添加的色码（{{ paletteColors.length }}）</span>
          </div>
          <el-table :data="paletteColors" stripe>
            <el-table-column prop="code" label="色号" width="140" />
            <el-table-column prop="hex" label="HEX" width="120" />
            <el-table-column label="颜色预览" width="100">
              <template #default="{ row }">
                <div class="color-preview" :style="{ background: row.hex }"></div>
              </template>
            </el-table-column>
            <el-table-column label="RGB" width="160">
              <template #default="{ row }">{{ row.r }}, {{ row.g }}, {{ row.b }}</template>
            </el-table-column>
            <el-table-column label="操作" width="120">
              <template #default="{ row }">
                <el-button size="small" type="danger" @click="removeColorFromPalette(row)">
                  移除
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>
    </el-drawer>

    <!-- 品牌编辑对话框 -->
    <el-dialog
      v-model="brandDialogVisible"
      :title="brandForm.id ? '编辑品牌' : '新增品牌'"
      width="500px"
    >
      <el-form :model="brandForm" label-width="80px">
        <el-form-item label="品牌名称" required>
          <el-input v-model="brandForm.name" placeholder="例如：Hama" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="brandDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveBrand">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Plus } from '@element-plus/icons-vue'
import request from '../utils/request'

const activeTab = ref('hierarchy')

// 层级视图相关
const selectedBrandId = ref(null)
const selectedBrandName = ref('')
const brandPalettes = ref([])
const selectedPalette = ref(null)
const hierarchyPaletteColors = ref([])

// 色码相关
const colors = ref([])
const colorSearch = ref('')
const colorDialogVisible = ref(false)
const colorForm = reactive({
  id: null,
  code: '',
  hex: '#000000',
  r: 0,
  g: 0,
  b: 0
})

// 色盘相关
const palettes = ref([])
const paletteDialogVisible = ref(false)
const paletteForm = reactive({
  id: null,
  name: '',
  remark: ''
})
const paletteDetailVisible = ref(false)
const currentPalette = ref(null)
const paletteColors = ref([])
const selectedColorCodes = ref([])
const addingColors = ref(false)

// 品牌相关
const brands = ref([])
const brandDialogVisible = ref(false)
const brandForm = reactive({
  id: null,
  name: ''
})

// 计算属性：可添加到色盘的色码（排除已添加的）
const availableColors = computed(() => {
  const existingCodes = new Set(paletteColors.value.map(c => c.code))
  return colors.value.filter(c => !existingCodes.has(c.code))
})

// 层级视图操作
async function handleBrandSelect(brandId) {
  selectedBrandId.value = brandId
  const brand = brands.value.find(b => String(b.id) === brandId)
  selectedBrandName.value = brand ? brand.name : ''
  selectedPalette.value = null
  hierarchyPaletteColors.value = []

  try {
    brandPalettes.value = await request.get(`/admin/bead/brands/${brandId}/palettes`)
  } catch (error) {
    ElMessage.error('加载品牌色盘失败')
    brandPalettes.value = []
  }
}

async function handlePaletteSelect(palette) {
  if (!palette) {
    selectedPalette.value = null
    hierarchyPaletteColors.value = []
    return
  }

  selectedPalette.value = palette
  try {
    hierarchyPaletteColors.value = await request.get(`/admin/bead/palettes/${palette.id}/colors`)
  } catch (error) {
    ElMessage.error('加载色盘色码失败')
    hierarchyPaletteColors.value = []
  }
}

// 加载数据
async function loadColors() {
  try {
    colors.value = await request.get('/admin/bead/colors', {
      params: { q: colorSearch.value }
    })
  } catch (error) {
    ElMessage.error('加载色码失败')
  }
}

async function loadPalettes() {
  try {
    palettes.value = await request.get('/admin/bead/palettes')
  } catch (error) {
    ElMessage.error('加载色盘失败')
  }
}

async function loadBrands() {
  try {
    brands.value = await request.get('/admin/bead/brands')
  } catch (error) {
    ElMessage.error('加载品牌失败')
  }
}

async function loadPaletteColors(paletteId) {
  try {
    paletteColors.value = await request.get(`/admin/bead/palettes/${paletteId}/colors`)
  } catch (error) {
    ElMessage.error('加载色盘色码失败')
  }
}

// 色码操作
function openColorDialog(row = null) {
  if (row) {
    Object.assign(colorForm, {
      id: row.id,
      code: row.code,
      hex: row.hex || '#000000',
      r: row.r || 0,
      g: row.g || 0,
      b: row.b || 0
    })
  } else {
    Object.assign(colorForm, {
      id: null,
      code: '',
      hex: '#000000',
      r: 0,
      g: 0,
      b: 0
    })
  }
  colorDialogVisible.value = true
}

function normalizeHex() {
  let hex = String(colorForm.hex || '').trim().toUpperCase()
  if (!hex.startsWith('#')) hex = '#' + hex
  colorForm.hex = hex
}

function hexToRgb() {
  normalizeHex()
  const match = /^#([0-9A-F]{6})$/.exec(colorForm.hex)
  if (!match) {
    ElMessage.warning('HEX格式不正确，请输入 #RRGGBB')
    return
  }
  const hex = match[1]
  colorForm.r = parseInt(hex.slice(0, 2), 16)
  colorForm.g = parseInt(hex.slice(2, 4), 16)
  colorForm.b = parseInt(hex.slice(4, 6), 16)
}

function rgbToHex() {
  const r = Math.max(0, Math.min(255, colorForm.r || 0))
  const g = Math.max(0, Math.min(255, colorForm.g || 0))
  const b = Math.max(0, Math.min(255, colorForm.b || 0))
  colorForm.hex = '#' + [r, g, b]
    .map(n => n.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase()
}

async function saveColor() {
  if (!colorForm.code.trim()) {
    ElMessage.warning('请输入色号')
    return
  }
  normalizeHex()

  try {
    const payload = {
      code: colorForm.code.trim(),
      hex: colorForm.hex.toUpperCase(),
      r: colorForm.r || 0,
      g: colorForm.g || 0,
      b: colorForm.b || 0
    }

    if (colorForm.id) {
      await request.put(`/admin/bead/colors/${colorForm.id}`, payload)
      ElMessage.success('更新成功')
    } else {
      await request.post('/admin/bead/colors', payload)
      ElMessage.success('新增成功')
    }

    colorDialogVisible.value = false
    await loadColors()

    // 如果色盘详情打开，刷新色盘色码
    if (currentPalette.value) {
      await loadPaletteColors(currentPalette.value.id)
    }
  } catch (error) {
    ElMessage.error('保存失败')
  }
}

async function deleteColor(row) {
  try {
    await ElMessageBox.confirm(`确认删除色码「${row.code}」？`, '提示', {
      type: 'warning'
    })
    await request.delete(`/admin/bead/colors/${row.id}`)
    ElMessage.success('删除成功')
    await loadColors()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

// 色盘操作
function openPaletteDialog(row = null) {
  if (row) {
    Object.assign(paletteForm, {
      id: row.id,
      name: row.name,
      remark: row.remark || ''
    })
  } else {
    Object.assign(paletteForm, {
      id: null,
      name: '',
      remark: ''
    })
  }
  paletteDialogVisible.value = true
}

async function savePalette() {
  if (!paletteForm.name.trim()) {
    ElMessage.warning('请输入色盘名称')
    return
  }

  try {
    const payload = {
      name: paletteForm.name.trim(),
      remark: paletteForm.remark.trim()
    }

    if (paletteForm.id) {
      await request.put(`/admin/bead/palettes/${paletteForm.id}`, payload)
      ElMessage.success('更新成功')
    } else {
      await request.post('/admin/bead/palettes', payload)
      ElMessage.success('新增成功')
    }

    paletteDialogVisible.value = false
    await loadPalettes()
  } catch (error) {
    ElMessage.error('保存失败')
  }
}

async function deletePalette(row) {
  try {
    await ElMessageBox.confirm(`确认删除色盘「${row.name}」？`, '提示', {
      type: 'warning'
    })
    await request.delete(`/admin/bead/palettes/${row.id}`)
    ElMessage.success('删除成功')
    await loadPalettes()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

async function openPaletteDetail(row) {
  currentPalette.value = row
  selectedColorCodes.value = []
  await loadPaletteColors(row.id)
  paletteDetailVisible.value = true
}

async function addColorsToPalette() {
  if (!selectedColorCodes.value.length) {
    ElMessage.warning('请选择要添加的色码')
    return
  }

  addingColors.value = true
  try {
    const res = await request.post(
      `/admin/bead/palettes/${currentPalette.value.id}/batch-add-colors`,
      { codes: selectedColorCodes.value }
    )

    const added = res?.addedCount || 0
    const ignored = res?.ignoredCount || 0
    const missing = res?.missingCount || 0

    ElMessage.success(`添加完成：新增${added}个，已存在${ignored}个，未找到${missing}个`)
    selectedColorCodes.value = []
    await loadPaletteColors(currentPalette.value.id)
    await loadPalettes()
  } catch (error) {
    ElMessage.error('添加失败')
  } finally {
    addingColors.value = false
  }
}

async function removeColorFromPalette(row) {
  try {
    await ElMessageBox.confirm(`确认从色盘中移除色码「${row.code}」？`, '提示', {
      type: 'warning'
    })
    await request.delete(`/admin/bead/palettes/${currentPalette.value.id}/colors/${row.id}`)
    ElMessage.success('移除成功')
    await loadPaletteColors(currentPalette.value.id)
    await loadPalettes()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('移除失败')
    }
  }
}

// 品牌操作
function openBrandDialog(row = null) {
  if (row) {
    Object.assign(brandForm, {
      id: row.id,
      name: row.name
    })
  } else {
    Object.assign(brandForm, {
      id: null,
      name: ''
    })
  }
  brandDialogVisible.value = true
}

async function saveBrand() {
  if (!brandForm.name.trim()) {
    ElMessage.warning('请输入品牌名称')
    return
  }

  try {
    const payload = { name: brandForm.name.trim() }

    if (brandForm.id) {
      await request.put(`/admin/bead/brands/${brandForm.id}`, payload)
      ElMessage.success('更新成功')
    } else {
      await request.post('/admin/bead/brands', payload)
      ElMessage.success('新增成功')
    }

    brandDialogVisible.value = false
    await loadBrands()
  } catch (error) {
    ElMessage.error('保存失败')
  }
}

async function deleteBrand(row) {
  try {
    await ElMessageBox.confirm(`确认删除品牌「${row.name}」？`, '提示', {
      type: 'warning'
    })
    await request.delete(`/admin/bead/brands/${row.id}`)
    ElMessage.success('删除成功')
    await loadBrands()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

// 初始化
onMounted(async () => {
  await Promise.all([loadColors(), loadPalettes(), loadBrands()])
})
</script>

<style scoped>
.bead-library-page {
  padding: 20px;
}

.tab-content {
  padding: 20px;
}

.toolbar {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 20px;
}

.color-preview {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  border: 1px solid #dcdfe6;
}

.color-preview-small {
  width: 20px;
  height: 20px;
  border-radius: 4px;
  border: 1px solid #dcdfe6;
}

.color-preview-large {
  width: 80px;
  height: 80px;
  border-radius: 8px;
  border: 1px solid #dcdfe6;
}

.drawer-content {
  padding: 0 20px 20px;
}

.palette-colors-section {
  margin-top: 20px;
}

.section-header {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 16px;
  color: #303133;
}

.hierarchy-container {
  display: flex;
  gap: 20px;
  height: calc(100vh - 200px);
}

.hierarchy-left {
  width: 200px;
  border-right: 1px solid #e4e7ed;
  padding-right: 20px;
}

.hierarchy-middle {
  flex: 1;
  min-width: 300px;
  border-right: 1px solid #e4e7ed;
  padding-right: 20px;
}

.hierarchy-right {
  flex: 2;
  min-width: 400px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 16px;
  color: #303133;
  padding-bottom: 12px;
  border-bottom: 2px solid #409eff;
}
</style>
