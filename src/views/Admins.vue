<template>
  <div>
    <el-card shadow="never" style="margin-bottom:16px">
      <el-button v-if="canCreateAdmin" type="primary" @click="openModal()"><el-icon><Plus/></el-icon> 新增管理员</el-button>
    </el-card>
    <el-card shadow="never">
      <el-table :data="list" v-loading="loading" stripe>
        <el-table-column prop="username" label="账号" width="180">
          <template #default="{row}">
            <span>{{ row.username }}</span>
            <el-tag v-if="row.isCurrent" type="success" size="small" style="margin-left:6px">当前</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="nickName" label="显示名" min-width="120" />
        <el-table-column prop="role" label="角色" width="140" />
        <el-table-column label="状态" width="90">
          <template #default="{row}">
            <el-tag :type="userStatusDict.tagType(row.status ? '1' : '0')" size="small">{{ userStatusDict.label(row.status ? '1' : '0') }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="lastLoginAt" label="最后登录" width="160" />
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{row}">
            <el-button v-if="canDelete(row)" size="small" type="danger" text @click="removeAdmin(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
    <el-dialog v-model="dialogVisible" title="新增管理员" width="420px">
      <el-form :model="form" label-width="80px">
        <el-form-item label="账号"><el-input v-model="form.username" /></el-form-item>
        <el-form-item label="显示名"><el-input v-model="form.nickName" /></el-form-item>
        <el-form-item label="密码"><el-input v-model="form.password" type="password" show-password /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible=false">取消</el-button>
        <el-button type="primary" @click="save">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '../utils/request'
import { useAuthStore } from '../stores/auth'
import { DICT_TYPE } from '../constants/dict'
import { useDict } from '../composables/useDict'

const list = ref([])
const loading = ref(false)
const dialogVisible = ref(false)
const form = ref({ username: '', nickName: '', password: '' })
const auth = useAuthStore()
const userStatusDict = useDict(DICT_TYPE.USER_STATUS)
const canCreateAdmin = computed(() => String(auth.adminInfo?.role || '').toUpperCase() === 'SUPER_ADMIN')

const MSG_ONLY_SUPER_ADMIN_CREATE = '仅超级管理员可新增管理员'
const MSG_DELETE_GUARD = '仅可删除普通管理员，且不能删除当前登录账号'

async function load() {
  loading.value = true
  try { list.value = await request.get('/admin/admins') || [] }
  catch {} finally { loading.value = false }
}

function openModal() {
  form.value = { username: '', nickName: '', password: '' }
  dialogVisible.value = true
}

async function save() {
  if (!canCreateAdmin.value) {
    ElMessage.warning(MSG_ONLY_SUPER_ADMIN_CREATE)
    return
  }
  if (!form.value.username || !form.value.password) {
    ElMessage.warning('账号和密码不能为空')
    return
  }
  await request.post('/admin/admins', form.value)
  ElMessage.success('添加成功')
  dialogVisible.value = false
  load()
}

function canDelete(row) {
  const currentId = auth.adminInfo?.id
  const role = String(row.role || '').toUpperCase()
  return row.username !== 'admin' && role === 'ADMIN' && row.id !== currentId
}

async function removeAdmin(row) {
  if (!canDelete(row)) {
    ElMessage.warning(MSG_DELETE_GUARD)
    return
  }
  await ElMessageBox.confirm(`确认删除管理员「${row.username}」吗？`, '提示', { type: 'warning' })
  await request.delete(`/admin/admins/${row.id}`)
  ElMessage.success('删除成功')
  load()
}

onMounted(load)
</script>