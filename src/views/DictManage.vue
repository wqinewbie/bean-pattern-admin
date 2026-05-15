<template>
  <div>
    <el-card shadow="never" style="margin-bottom:16px">
      <el-button type="primary" @click="openModal()"><el-icon><Plus/></el-icon> 新增字典项</el-button>
      <el-button @click="loadData"><el-icon><Refresh/></el-icon> 刷新</el-button>
    </el-card>
    <el-card shadow="never">
      <el-table :data="list" v-loading="loading" stripe>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="dictType" label="字典类型" width="180" />
        <el-table-column prop="dictLabel" label="字典标签" width="150" />
        <el-table-column prop="dictValue" label="字典值" width="150" />
        <el-table-column prop="tagType" label="标签类型" width="120">
          <template #default="{row}">
            <el-tag :type="row.tagType || 'info'" size="small">{{ row.tagType || 'info' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="sortOrder" label="排序" width="80" />
        <el-table-column label="状态" width="80">
          <template #default="{row}">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'" size="small">
              {{ row.status === 1 ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="是否禁用" width="100">
          <template #default="{row}">
            <el-tag :type="row.disabled === 1 ? 'warning' : 'success'" size="small">
              {{ row.disabled === 1 ? '是' : '否' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" min-width="150" show-overflow-tooltip />
        <el-table-column prop="createdAt" label="创建时间" width="160" />
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{row}">
            <el-button size="small" type="primary" text @click="openModal(row)">编辑</el-button>
            <el-button size="small" type="danger" text @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑字典项' : '新增字典项'" width="600px">
      <el-form :model="form" label-width="100px">
        <el-form-item label="字典类型" required>
          <el-input v-model="form.dictType" placeholder="例如：user_status" />
        </el-form-item>
        <el-form-item label="字典标签" required>
          <el-input v-model="form.dictLabel" placeholder="例如：正常" />
        </el-form-item>
        <el-form-item label="字典值" required>
          <el-input v-model="form.dictValue" placeholder="例如：1" />
        </el-form-item>
        <el-form-item label="标签类型">
          <el-select v-model="form.tagType" placeholder="请选择">
            <el-option label="success" value="success" />
            <el-option label="info" value="info" />
            <el-option label="warning" value="warning" />
            <el-option label="danger" value="danger" />
          </el-select>
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="form.sortOrder" :min="0" />
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="form.status">
            <el-radio :value="1">启用</el-radio>
            <el-radio :value="0">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="是否禁用">
          <el-radio-group v-model="form.disabled">
            <el-radio :value="0">否</el-radio>
            <el-radio :value="1">是</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.remark" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible=false">取消</el-button>
        <el-button type="primary" @click="save" :loading="saving">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Refresh } from '@element-plus/icons-vue'
import { getDictItems, createDictItem, updateDictItem, deleteDictItem } from '../api/dict'

const list = ref([])
const loading = ref(false)
const dialogVisible = ref(false)
const saving = ref(false)
const isEdit = ref(false)
const form = ref({
  dictType: '',
  dictLabel: '',
  dictValue: '',
  tagType: 'info',
  sortOrder: 0,
  status: 1,
  disabled: 0,
  remark: ''
})

onMounted(() => {
  loadData()
})

async function loadData() {
  loading.value = true
  try {
    const res = await getDictItems()
    list.value = res || []
  } catch (error) {
    ElMessage.error('加载失败')
  } finally {
    loading.value = false
  }
}

function openModal(row) {
  if (row) {
    isEdit.value = true
    form.value = { ...row }
  } else {
    isEdit.value = false
    form.value = {
      dictType: '',
      dictLabel: '',
      dictValue: '',
      tagType: 'info',
      sortOrder: 0,
      status: 1,
      disabled: 0,
      remark: ''
    }
  }
  dialogVisible.value = true
}

async function save() {
  if (!form.value.dictType || !form.value.dictLabel || !form.value.dictValue) {
    ElMessage.warning('请填写必填项')
    return
  }
  saving.value = true
  try {
    if (isEdit.value) {
      await updateDictItem(form.value.id, form.value)
      ElMessage.success('更新成功')
    } else {
      await createDictItem(form.value)
      ElMessage.success('创建成功')
    }
    dialogVisible.value = false
    loadData()
  } catch (error) {
    ElMessage.error(isEdit.value ? '更新失败' : '创建失败')
  } finally {
    saving.value = false
  }
}

async function handleDelete(row) {
  try {
    await ElMessageBox.confirm(`确定删除字典项"${row.dictLabel}"吗？`, '提示', {
      type: 'warning'
    })
    await deleteDictItem(row.id)
    ElMessage.success('删除成功')
    loadData()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}
</script>
