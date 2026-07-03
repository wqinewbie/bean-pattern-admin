<template>
  <div class="bead-library-page">
    <el-tabs v-model="activeTab" type="border-card">
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
              <div class="section-title">{{ selectedBrandName }} - 套装列表</div>
              <el-table
                :data="brandKits"
                stripe
                highlight-current-row
                @current-change="handleKitSelect"
                style="width: 100%"
              >
                <el-table-column label="套装" width="140">
                  <template #default="{ row }">{{ row.colorCount || row.color_count }} 色</template>
                </el-table-column>
                <el-table-column prop="id" label="套装ID" width="100" />
                <el-table-column label="实际颜色" width="110">
                  <template #default="{ row }">
                    <el-tag :type="kitCountType(row)" size="small">{{ row.colorTotal ?? 0 }}</el-tag>
                  </template>
                </el-table-column>
              </el-table>
            </div>

            <div class="hierarchy-right" v-if="selectedKit">
              <div class="section-title">
                <span>{{ selectedKit.colorCount || selectedKit.color_count }} 色套装 - 色码列表</span>
                <el-button type="primary" size="small" @click="openKitColorDrawer">
                  <el-icon><Plus /></el-icon>添加颜色
                </el-button>
              </div>
              <el-table :data="kitColors" stripe max-height="600">
                <el-table-column prop="code" label="色号" width="120" />
                <el-table-column prop="displayName" label="显示名" width="120" />
                <el-table-column prop="hex" label="HEX" width="100" />
                <el-table-column label="颜色预览" width="90">
                  <template #default="{ row }">
                    <div class="color-preview" :style="{ background: row.hex }"></div>
                  </template>
                </el-table-column>
                <el-table-column label="RGB" width="140">
                  <template #default="{ row }">{{ row.r }}, {{ row.g }}, {{ row.b }}</template>
                </el-table-column>
                <el-table-column label="操作" width="90">
                  <template #default="{ row }">
                    <el-button size="small" type="danger" link @click="removeColorFromKit(row)">移除</el-button>
                  </template>
                </el-table-column>
              </el-table>
            </div>
          </div>
        </div>
      </el-tab-pane>

      <el-tab-pane label="数据审计" name="audit">
        <div class="tab-content">
          <div class="toolbar">
            <el-button type="primary" :loading="auditLoading" @click="loadAudit">
              <el-icon><Refresh /></el-icon>刷新审计
            </el-button>
            <el-tag v-if="auditSummary" :type="auditSummary.healthy ? 'success' : 'warning'" size="large">
              {{ auditSummary.healthy ? '核心检查正常' : '存在需要处理的问题' }}
            </el-tag>
          </div>

          <div v-if="auditSummary" class="audit-metrics">
            <div class="metric"><span>品牌</span><strong>{{ auditSummary.brands }}</strong></div>
            <div class="metric"><span>套装</span><strong>{{ auditSummary.kits }}</strong></div>
            <div class="metric"><span>色码</span><strong>{{ auditSummary.colors }}</strong></div>
            <div class="metric"><span>套装颜色</span><strong>{{ auditSummary.kitColors }}</strong></div>
            <div class="metric" :class="{ warning: auditSummary.kitCountMismatches }">
              <span>数量不一致</span><strong>{{ auditSummary.kitCountMismatches }}</strong>
            </div>
            <div class="metric" :class="{ warning: auditSummary.virtualKitColors }">
              <span>VT占位</span><strong>{{ auditSummary.virtualKitColors }}</strong>
            </div>
            <div class="metric" :class="{ warning: auditSummary.badColorValues }">
              <span>色值异常</span><strong>{{ auditSummary.badColorValues }}</strong>
            </div>
            <div class="metric muted">
              <span>旧色盘重复</span><strong>{{ auditSummary.legacyPaletteDuplicates }}</strong>
            </div>
          </div>

          <el-alert
            v-if="auditSummary?.healthy"
            type="success"
            title="当前核心颜色数据正常：套装数量、VT占位、HEX/RGB 均未发现异常。"
            :closable="false"
            show-icon
          />

          <div class="audit-section">
            <div class="section-header">套装数量不一致</div>
            <el-table :data="auditData.kitCountMismatches" stripe>
              <el-table-column prop="brandName" label="品牌" width="140" />
              <el-table-column prop="kitId" label="套装ID" width="100" />
              <el-table-column prop="colorCount" label="标称色数" width="120" />
              <el-table-column prop="colorTotal" label="实际色数" width="120" />
            </el-table>
          </div>

          <div class="audit-section">
            <div class="section-header">VT 占位色</div>
            <el-table :data="auditData.virtualKitColors" stripe>
              <el-table-column prop="brandName" label="品牌" width="140" />
              <el-table-column prop="kitId" label="套装ID" width="100" />
              <el-table-column prop="colorCount" label="套装" width="100" />
              <el-table-column prop="code" label="色号" width="100" />
              <el-table-column prop="hex" label="HEX" width="100" />
              <el-table-column label="RGB">
                <template #default="{ row }">{{ row.r }}, {{ row.g }}, {{ row.b }}</template>
              </el-table-column>
            </el-table>
          </div>

          <div class="audit-section">
            <div class="section-header">色值异常</div>
            <el-table :data="auditData.badColorValues" stripe>
              <el-table-column prop="code" label="色号" width="120" />
              <el-table-column prop="displayName" label="显示名" width="120" />
              <el-table-column prop="hex" label="HEX" width="100" />
              <el-table-column label="RGB">
                <template #default="{ row }">{{ row.r }}, {{ row.g }}, {{ row.b }}</template>
              </el-table-column>
            </el-table>
          </div>

          <div class="audit-section">
            <div class="section-header">旧色盘重复记录</div>
            <el-table :data="auditData.legacyPaletteDuplicates" stripe max-height="360">
              <el-table-column prop="brandName" label="品牌" width="140" />
              <el-table-column prop="kitId" label="套装ID" width="100" />
              <el-table-column prop="colorCount" label="套装" width="100" />
              <el-table-column prop="code" label="重复色号" width="120" />
              <el-table-column prop="legacyHits" label="命中次数" width="100" />
              <el-table-column prop="legacyPalettes" label="旧色盘" />
            </el-table>
          </div>
        </div>
      </el-tab-pane>

      <el-tab-pane label="色码库" name="colors">
        <BeadColorTab ref="colorTabRef" />
      </el-tab-pane>

      <el-tab-pane label="品牌管理" name="brands">
        <BeadBrandTab ref="brandTabRef" />
      </el-tab-pane>
    </el-tabs>

    <el-drawer v-model="kitColorDrawerVisible" title="添加套装颜色" size="640px">
      <div class="drawer-content">
        <div class="toolbar">
          <el-input
            v-model="colorSearch"
            placeholder="搜索色号 / 显示名 / HEX"
            clearable
            @input="loadAvailableColors"
          />
          <el-button type="primary" :loading="addingColors" @click="addColorsToKit">
            <el-icon><Plus /></el-icon>添加选中
          </el-button>
        </div>
        <el-table
          ref="availableColorTableRef"
          :data="availableColors"
          stripe
          height="calc(100vh - 230px)"
          @selection-change="selectedColorCodes = $event.map(item => item.code)"
        >
          <el-table-column type="selection" width="44" />
          <el-table-column prop="code" label="色号" width="110" />
          <el-table-column prop="displayName" label="显示名" width="120" />
          <el-table-column prop="hex" label="HEX" width="100" />
          <el-table-column label="预览" width="80">
            <template #default="{ row }">
              <div class="color-preview-small" :style="{ background: row.hex }"></div>
            </template>
          </el-table-column>
          <el-table-column label="RGB">
            <template #default="{ row }">{{ row.r }}, {{ row.g }}, {{ row.b }}</template>
          </el-table-column>
        </el-table>
      </div>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Refresh } from '@element-plus/icons-vue'
import request from '../utils/request'
import BeadColorTab from '../components/BeadColorTab.vue'
import BeadBrandTab from '../components/BeadBrandTab.vue'

const activeTab = ref('hierarchy')
const colorTabRef = ref(null)
const brandTabRef = ref(null)

const brands = ref([])
const selectedBrandId = ref(null)
const selectedBrandName = ref('')
const brandKits = ref([])
const selectedKit = ref(null)
const kitColors = ref([])

const kitColorDrawerVisible = ref(false)
const availableColorTableRef = ref(null)
const availableColors = ref([])
const selectedColorCodes = ref([])
const colorSearch = ref('')
const addingColors = ref(false)

const auditLoading = ref(false)
const auditSummary = ref(null)
const auditData = ref({
  kitCountMismatches: [],
  virtualKitColors: [],
  badColorValues: [],
  legacyPaletteDuplicates: []
})

function kitCountType(row) {
  const expected = Number(row.colorCount ?? row.color_count ?? 0)
  const actual = Number(row.colorTotal ?? row.color_total ?? 0)
  return expected === actual ? 'success' : 'warning'
}

async function loadBrands() {
  try {
    brands.value = await request.get('/admin/bead/brands')
  } catch (error) {
    ElMessage.error('加载品牌失败')
  }
}

async function handleBrandSelect(brandId) {
  selectedBrandId.value = brandId
  const brand = brands.value.find(b => String(b.id) === brandId)
  selectedBrandName.value = brand ? brand.name : ''
  selectedKit.value = null
  kitColors.value = []

  try {
    brandKits.value = await request.get(`/admin/bead/brands/${brandId}/kits`)
  } catch (error) {
    ElMessage.error('加载品牌套装失败')
    brandKits.value = []
  }
}

async function handleKitSelect(kit) {
  if (!kit) {
    selectedKit.value = null
    kitColors.value = []
    return
  }

  selectedKit.value = kit
  await loadKitColors()
}

async function loadKitColors() {
  if (!selectedKit.value) return
  try {
    kitColors.value = await request.get(`/admin/bead/kits/${selectedKit.value.id}/colors`)
  } catch (error) {
    ElMessage.error('加载套装色码失败')
    kitColors.value = []
  }
}

async function loadAvailableColors() {
  try {
    const res = await request.get('/admin/bead/colors', { params: { q: colorSearch.value } })
    const list = Array.isArray(res) ? res : (res.list || [])
    const existing = new Set(kitColors.value.map(item => item.code))
    availableColors.value = list.filter(item => !existing.has(item.code))
  } catch (error) {
    ElMessage.error('加载色码库失败')
  }
}

async function openKitColorDrawer() {
  selectedColorCodes.value = []
  colorSearch.value = ''
  await loadAvailableColors()
  kitColorDrawerVisible.value = true
}

async function addColorsToKit() {
  if (!selectedKit.value || !selectedColorCodes.value.length) {
    ElMessage.warning('请选择要添加的色码')
    return
  }

  addingColors.value = true
  try {
    const res = await request.post(
      `/admin/bead/kits/${selectedKit.value.id}/batch-add-colors`,
      { codes: selectedColorCodes.value }
    )
    ElMessage.success(`添加完成：新增 ${res?.addedCount || 0} 个，已存在 ${res?.ignoredCount || 0} 个，未找到 ${res?.missingCount || 0} 个`)
    availableColorTableRef.value?.clearSelection()
    selectedColorCodes.value = []
    await loadKitColors()
    await handleBrandSelect(selectedBrandId.value)
    await loadAvailableColors()
  } catch (error) {
    ElMessage.error('添加失败')
  } finally {
    addingColors.value = false
  }
}

async function removeColorFromKit(row) {
  if (!selectedKit.value) return
  try {
    await ElMessageBox.confirm(`确认从套装中移除色码「${row.code}」？`, '提示', { type: 'warning' })
    await request.delete(`/admin/bead/kits/${selectedKit.value.id}/colors/${row.id}`)
    ElMessage.success('移除成功')
    await loadKitColors()
    await handleBrandSelect(selectedBrandId.value)
  } catch (error) {
    if (error !== 'cancel') ElMessage.error('移除失败')
  }
}

async function loadAudit() {
  auditLoading.value = true
  try {
    const res = await request.get('/admin/bead/audit')
    auditSummary.value = res.summary
    auditData.value = {
      kitCountMismatches: res.kitCountMismatches || [],
      virtualKitColors: res.virtualKitColors || [],
      badColorValues: res.badColorValues || [],
      legacyPaletteDuplicates: res.legacyPaletteDuplicates || []
    }
  } catch (error) {
    ElMessage.error('加载颜色审计失败')
  } finally {
    auditLoading.value = false
  }
}

onMounted(async () => {
  await loadBrands()
  await loadAudit()
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
  border-radius: 6px;
  border: 1px solid #dcdfe6;
}

.color-preview-small {
  width: 24px;
  height: 24px;
  border-radius: 4px;
  border: 1px solid #dcdfe6;
}

.drawer-content {
  padding: 0 20px 20px;
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
  min-width: 360px;
  border-right: 1px solid #e4e7ed;
  padding-right: 20px;
}

.hierarchy-right {
  flex: 2;
  min-width: 520px;
}

.section-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 16px;
  color: #303133;
  padding-bottom: 12px;
  border-bottom: 2px solid #409eff;
}

.audit-metrics {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
  gap: 12px;
  margin-bottom: 20px;
}

.metric {
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  padding: 12px;
  background: #fff;
}

.metric span {
  display: block;
  color: #606266;
  font-size: 13px;
  margin-bottom: 6px;
}

.metric strong {
  color: #303133;
  font-size: 22px;
}

.metric.warning {
  border-color: #e6a23c;
  background: #fdf6ec;
}

.metric.muted {
  background: #f7f8fa;
}

.audit-section {
  margin-top: 20px;
}

.section-header {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 10px;
}
</style>
