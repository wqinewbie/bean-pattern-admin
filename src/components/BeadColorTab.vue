<template>
  <div class="tab-content">
    <div class="toolbar">
      <el-input v-model="search" placeholder="搜索色号或HEX" style="width:240px" clearable @input="load">
        <template #prefix><el-icon><Search/></el-icon></template>
      </el-input>
      <el-button type="primary" @click="openDialog()"><el-icon><Plus/></el-icon>新增色码</el-button>
    </div>
    <el-table :data="list" stripe>
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="code" label="色号" width="140" />
      <el-table-column prop="hex" label="HEX" width="120" />
      <el-table-column label="颜色预览" width="100">
        <template #default="{row}"><div class="color-preview" :style="{background:row.hex}"/></template>
      </el-table-column>
      <el-table-column label="RGB" width="160">
        <template #default="{row}">{{ row.r }}, {{ row.g }}, {{ row.b }}</template>
      </el-table-column>
      <el-table-column label="操作" width="180">
        <template #default="{row}">
          <el-button size="small" @click="openDialog(row)">编辑</el-button>
          <el-button size="small" type="danger" @click="remove(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="visible" :title="form.id ? '编辑色码' : '新增色码'" width="500px">
      <el-form :model="form" label-width="80px">
        <el-form-item label="色号" required><el-input v-model="form.code" placeholder="例如：C001"/></el-form-item>
        <el-form-item label="HEX" required>
          <el-input v-model="form.hex" placeholder="#RRGGBB" @blur="onHexBlur">
            <template #append><el-button @click="hexToRgb">转RGB</el-button></template>
          </el-input>
        </el-form-item>
        <el-form-item label="颜色预览">
          <div class="color-preview-large" :style="{background:form.hex||'#000000'}"/>
        </el-form-item>
        <el-form-item label="R"><el-input-number v-model="form.r" :min="0" :max="255" style="width:100%"/></el-form-item>
        <el-form-item label="G"><el-input-number v-model="form.g" :min="0" :max="255" style="width:100%"/></el-form-item>
        <el-form-item label="B"><el-input-number v-model="form.b" :min="0" :max="255" style="width:100%"/></el-form-item>
        <el-form-item><el-button @click="rgbToHex">RGB转HEX</el-button></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="visible=false">取消</el-button>
        <el-button type="primary" @click="save">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Plus } from '@element-plus/icons-vue'
import request from '../utils/request'

const list = ref([])
const search = ref('')
const visible = ref(false)
const form = reactive({ id: null, code: '', hex: '#000000', r: 0, g: 0, b: 0 })

async function load() {
  try {
    const res = await request.get('/admin/bead/colors', { params: { q: search.value } })
    list.value = Array.isArray(res) ? res : (res.list || [])
  } catch (e) { console.error(e) }
}

function openDialog(row) {
  if (row) { form.id = row.id; form.code = row.code; form.hex = row.hex; form.r = row.r; form.g = row.g; form.b = row.b }
  else { form.id = null; form.code = ''; form.hex = '#000000'; form.r = 0; form.g = 0; form.b = 0 }
  visible.value = true
}

function onHexBlur() {
  const v = form.hex.trim()
  if (v && !v.startsWith('#')) form.hex = '#' + v
}

function hexToRgb() {
  const h = form.hex.replace('#', '')
  if (h.length >= 6) { form.r = parseInt(h.slice(0, 2), 16); form.g = parseInt(h.slice(2, 4), 16); form.b = parseInt(h.slice(4, 6), 16) }
}

function rgbToHex() {
  form.hex = '#' + [form.r, form.g, form.b].map(v => Math.max(0, Math.min(255, v || 0)).toString(16).padStart(2, '0')).join('')
}

async function save() {
  try {
    const body = { code: form.code, hex: form.hex, r: form.r, g: form.g, b: form.b }
    if (form.id) { await request.put(`/admin/bead/colors/${form.id}`, body) }
    else { await request.post('/admin/bead/colors', body) }
    ElMessage.success('保存成功')
    visible.value = false
    load()
  } catch (e) { console.error(e) }
}

async function remove(row) {
  try {
    await ElMessageBox.confirm('确定要删除该色码吗？', '提示', { type: 'warning' })
    await request.delete(`/admin/bead/colors/${row.id}`)
    ElMessage.success('删除成功')
    load()
  } catch (e) { if (e !== 'cancel') console.error(e) }
}

defineExpose({ load })
</script>
