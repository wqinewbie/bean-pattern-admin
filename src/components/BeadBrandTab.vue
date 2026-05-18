<template>
  <div class="tab-content">
    <div class="toolbar">
      <el-button type="primary" @click="openDialog()"><el-icon><Plus/></el-icon>新增品牌</el-button>
    </div>
    <el-table :data="brands" stripe>
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="name" label="品牌名称" />
      <el-table-column label="操作" width="180">
        <template #default="{row}">
          <el-button size="small" @click="openDialog(row)">编辑</el-button>
          <el-button size="small" type="danger" @click="remove(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="visible" :title="form.id ? '编辑品牌' : '新增品牌'" width="500px">
      <el-form :model="form" label-width="80px">
        <el-form-item label="品牌名称" required>
          <el-input v-model="form.name" placeholder="例如：Hama" />
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
import { Plus } from '@element-plus/icons-vue'
import request from '../utils/request'

const brands = ref([])
const visible = ref(false)
const form = reactive({ id: null, name: '' })

async function load() {
  try { brands.value = await request.get('/admin/bead/brands') || [] } catch (e) { console.error(e) }
}

function openDialog(row) {
  if (row) { form.id = row.id; form.name = row.name } else { form.id = null; form.name = '' }
  visible.value = true
}

async function save() {
  try {
    if (form.id) {
      await request.put(`/admin/bead/brands/${form.id}`, { name: form.name })
    } else {
      await request.post('/admin/bead/brands', { name: form.name })
    }
    ElMessage.success('保存成功')
    visible.value = false
    load()
  } catch (e) { console.error(e) }
}

async function remove(row) {
  try {
    await ElMessageBox.confirm('确定要删除该品牌吗？', '提示', { type: 'warning' })
    await request.delete(`/admin/bead/brands/${row.id}`)
    ElMessage.success('删除成功')
    load()
  } catch (e) { if (e !== 'cancel') console.error(e) }
}

onMounted(load)
</script>
