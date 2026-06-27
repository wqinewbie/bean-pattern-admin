<template>
  <div class="tab-content">
    <div class="toolbar">
      <el-input v-model="search" placeholder="搜索色号 / 显示名 / HEX" style="width:280px" clearable @input="load">
        <template #prefix><el-icon><Search /></el-icon></template>
      </el-input>
      <el-button type="primary" @click="openDialog()">
        <el-icon><Plus /></el-icon>新增色码
      </el-button>
    </div>
    <el-table :data="list" stripe>
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="code" label="色号" width="120" />
      <el-table-column prop="displayName" label="显示名" width="140" />
      <el-table-column prop="hex" label="HEX" width="120" />
      <el-table-column label="颜色预览" width="100">
        <template #default="{ row }"><div class="color-preview" :style="{ background: row.hex }" /></template>
      </el-table-column>
      <el-table-column label="RGB" width="160">
        <template #default="{ row }">{{ row.r }}, {{ row.g }}, {{ row.b }}</template>
      </el-table-column>
      <el-table-column label="操作" width="180">
        <template #default="{ row }">
          <el-button size="small" @click="openDialog(row)">编辑</el-button>
          <el-button size="small" type="danger" @click="remove(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="visible" :title="form.id ? '编辑色码' : '新增色码'" width="520px">
      <el-form :model="form" label-width="90px">
        <el-form-item label="色号" required>
          <el-input v-model="form.code" placeholder="例如：C001" />
        </el-form-item>
        <el-form-item label="显示名">
          <el-input v-model="form.displayName" placeholder="留空则使用色号" />
        </el-form-item>
        <el-form-item label="HEX" required>
          <el-input v-model="form.hex" placeholder="#RRGGBB" @blur="onHexBlur">
            <template #append><el-button @click="hexToRgb">转 RGB</el-button></template>
          </el-input>
        </el-form-item>
        <el-form-item label="颜色预览">
          <div class="color-preview-large" :style="{ background: form.hex || '#000000' }" />
        </el-form-item>
        <el-form-item label="R">
          <el-input-number v-model="form.r" :min="0" :max="255" style="width:100%" @change="rgbToHex" />
        </el-form-item>
        <el-form-item label="G">
          <el-input-number v-model="form.g" :min="0" :max="255" style="width:100%" @change="rgbToHex" />
        </el-form-item>
        <el-form-item label="B">
          <el-input-number v-model="form.b" :min="0" :max="255" style="width:100%" @change="rgbToHex" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="visible = false">取消</el-button>
        <el-button type="primary" @click="save">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Plus } from '@element-plus/icons-vue'
import request from '../utils/request'

const list = ref([])
const search = ref('')
const visible = ref(false)
const form = reactive({ id: null, code: '', displayName: '', hex: '#000000', r: 0, g: 0, b: 0 })

function normalizeHex(value) {
  const raw = String(value || '').trim()
  const hex = raw.startsWith('#') ? raw : `#${raw}`
  return /^#[0-9a-fA-F]{6}$/.test(hex) ? hex.toUpperCase() : ''
}

async function load() {
  try {
    const res = await request.get('/admin/bead/colors', { params: { q: search.value } })
    list.value = Array.isArray(res) ? res : (res.list || [])
  } catch (error) {
    ElMessage.error('加载色码失败')
  }
}

function openDialog(row) {
  if (row) {
    form.id = row.id
    form.code = row.code
    form.displayName = row.displayName || ''
    form.hex = row.hex
    form.r = row.r
    form.g = row.g
    form.b = row.b
  } else {
    form.id = null
    form.code = ''
    form.displayName = ''
    form.hex = '#000000'
    form.r = 0
    form.g = 0
    form.b = 0
  }
  visible.value = true
}

function onHexBlur() {
  const hex = normalizeHex(form.hex)
  if (!hex) return
  form.hex = hex
  hexToRgb()
}

function hexToRgb() {
  const hex = normalizeHex(form.hex)
  if (!hex) {
    ElMessage.warning('请输入正确的 HEX，例如 #A1B2C3')
    return
  }
  form.hex = hex
  form.r = parseInt(hex.slice(1, 3), 16)
  form.g = parseInt(hex.slice(3, 5), 16)
  form.b = parseInt(hex.slice(5, 7), 16)
}

function rgbToHex() {
  form.hex = '#' + [form.r, form.g, form.b]
    .map(v => Math.max(0, Math.min(255, Number(v) || 0)).toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase()
}

async function save() {
  const hex = normalizeHex(form.hex)
  if (!form.code.trim()) {
    ElMessage.warning('请输入色号')
    return
  }
  if (!hex) {
    ElMessage.warning('请输入正确的 HEX')
    return
  }

  try {
    const body = {
      code: form.code.trim(),
      displayName: form.displayName.trim(),
      hex,
      r: form.r,
      g: form.g,
      b: form.b
    }
    if (form.id) await request.put(`/admin/bead/colors/${form.id}`, body)
    else await request.post('/admin/bead/colors', body)
    ElMessage.success('保存成功')
    visible.value = false
    await load()
  } catch (error) {
    ElMessage.error('保存失败')
  }
}

async function remove(row) {
  try {
    await ElMessageBox.confirm(`确定要删除色码「${row.code}」吗？`, '提示', { type: 'warning' })
    await request.delete(`/admin/bead/colors/${row.id}`)
    ElMessage.success('删除成功')
    await load()
  } catch (error) {
    if (error !== 'cancel') ElMessage.error('删除失败')
  }
}

onMounted(load)
defineExpose({ load, list })
</script>

<style scoped>
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

.color-preview-large {
  width: 80px;
  height: 80px;
  border-radius: 6px;
  border: 1px solid #dcdfe6;
}
</style>
