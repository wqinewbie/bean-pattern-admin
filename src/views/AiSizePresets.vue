<template>
  <div>
    <el-card shadow="never" style="margin-bottom: 16px">
      <div class="toolbar">
        <div>
          <div class="title">AI图纸尺寸档位</div>
          <div class="tip">小程序会展示启用档位；生成任务会固化当时的尺寸规则快照。</div>
        </div>
        <el-button type="primary" @click="openCreate">
          <el-icon><Plus /></el-icon>
          新增档位
        </el-button>
      </div>
    </el-card>

    <el-card shadow="never">
      <el-table :data="presets" v-loading="loading" stripe>
        <el-table-column prop="presetKey" label="标识" width="120" />
        <el-table-column prop="name" label="名称" width="100" />
        <el-table-column prop="description" label="小程序展示" min-width="130" />
        <el-table-column label="范围" width="120">
          <template #default="{ row }">{{ row.gridMin }}-{{ row.gridMax }}</template>
        </el-table-column>
        <el-table-column label="候选格数" min-width="240" show-overflow-tooltip>
          <template #default="{ row }">{{ row.candidateGrids }}</template>
        </el-table-column>
        <el-table-column prop="defaultGrid" label="默认" width="80" />
        <el-table-column prop="sortOrder" label="排序" width="80" />
        <el-table-column label="推荐" width="80">
          <template #default="{ row }">
            <el-tag :type="row.recommended ? 'warning' : 'info'" size="small">{{ row.recommended ? '是' : '否' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.enabled ? 'success' : 'info'" size="small">{{ row.enabled ? '启用' : '停用' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="openEdit(row)">编辑</el-button>
            <el-button size="small" type="danger" @click="remove(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑尺寸档位' : '新增尺寸档位'" width="640px">
      <el-form :model="form" label-width="110px">
        <el-form-item label="标识">
          <el-input v-model="form.presetKey" :disabled="isEdit" placeholder="small / standard / detailed" />
          <div class="form-help">创建后不可修改，只能使用小写字母、数字、中横线和下划线。</div>
        </el-form-item>
        <el-form-item label="名称">
          <el-input v-model="form.name" placeholder="例如：标准" />
        </el-form-item>
        <el-form-item label="展示说明">
          <el-input v-model="form.description" placeholder="例如：80格以内" />
        </el-form-item>
        <el-form-item label="尺寸范围">
          <div class="range-row">
            <el-input-number v-model="form.gridMin" :min="16" :max="128" />
            <span>至</span>
            <el-input-number v-model="form.gridMax" :min="16" :max="128" />
          </div>
        </el-form-item>
        <el-form-item label="候选格数">
          <el-input v-model="candidateText" placeholder="例如：32,36,40,44,48,56,64,72,80" />
          <div class="form-help">多个数字用英文逗号分隔，必须在尺寸范围内。</div>
        </el-form-item>
        <el-form-item label="默认格数">
          <el-input-number v-model="form.defaultGrid" :min="16" :max="128" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="form.sortOrder" :min="0" :max="999" />
        </el-form-item>
        <el-form-item label="推荐">
          <el-switch v-model="form.recommended" :active-value="1" :inactive-value="0" />
        </el-form-item>
        <el-form-item label="启用">
          <el-switch v-model="form.enabled" :active-value="1" :inactive-value="0" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.remark" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="save">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import request from '../utils/request'

const presets = ref([])
const loading = ref(false)
const saving = ref(false)
const dialogVisible = ref(false)
const isEdit = ref(false)
const candidateText = ref('')
const form = ref(emptyForm())

function emptyForm() {
  return {
    id: null,
    presetKey: '',
    name: '',
    description: '',
    gridMin: 32,
    gridMax: 80,
    candidateGrids: '[32,36,40,44,48,56,64,72,80]',
    defaultGrid: 64,
    sortOrder: 0,
    recommended: 0,
    enabled: 1,
    remark: ''
  }
}

async function load() {
  loading.value = true
  try {
    presets.value = await request.get('/admin/ai-size-presets') || []
  } finally {
    loading.value = false
  }
}

function openCreate() {
  isEdit.value = false
  form.value = emptyForm()
  candidateText.value = '32,36,40,44,48,56,64,72,80'
  dialogVisible.value = true
}

function openEdit(row) {
  isEdit.value = true
  form.value = { ...row }
  candidateText.value = parseCandidateText(row.candidateGrids).join(',')
  dialogVisible.value = true
}

function parseCandidateText(value) {
  if (Array.isArray(value)) return value
  try {
    const parsed = JSON.parse(value || '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch (e) {
    return String(value || '').split(',').map(v => Number(v.trim())).filter(Boolean)
  }
}

function buildCandidates() {
  const values = candidateText.value
    .split(',')
    .map(v => Number(v.trim()))
    .filter(v => Number.isInteger(v))
  return Array.from(new Set(values)).sort((a, b) => a - b)
}

async function save() {
  const candidates = buildCandidates()
  if (!form.value.presetKey || !form.value.name) return ElMessage.warning('请填写标识和名称')
  if (!candidates.length) return ElMessage.warning('请填写候选格数')
  if (!candidates.includes(Number(form.value.defaultGrid))) return ElMessage.warning('默认格数必须在候选格数内')

  const payload = {
    ...form.value,
    candidateGrids: JSON.stringify(candidates)
  }

  saving.value = true
  try {
    if (isEdit.value) {
      await request.put(`/admin/ai-size-presets/${payload.id}`, payload)
    } else {
      await request.post('/admin/ai-size-presets', payload)
    }
    ElMessage.success('保存成功')
    dialogVisible.value = false
    load()
  } finally {
    saving.value = false
  }
}

async function remove(row) {
  try {
    await ElMessageBox.confirm(`确认删除尺寸档位「${row.name}」？`, '提示', { type: 'warning' })
    await request.delete(`/admin/ai-size-presets/${row.id}`)
    ElMessage.success('删除成功')
    load()
  } catch (e) {}
}

onMounted(load)
</script>

<style scoped>
.toolbar { display: flex; align-items: center; justify-content: space-between; gap: 16px; }
.title { font-size: 16px; font-weight: 700; color: #303133; }
.tip { color: #909399; font-size: 13px; margin-top: 4px; }
.form-help { color: #909399; font-size: 12px; line-height: 1.5; margin-top: 4px; }
.range-row { display: flex; align-items: center; gap: 12px; }
</style>
