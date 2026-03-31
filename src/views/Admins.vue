<template>
  <div>
    <el-card shadow="never" style="margin-bottom:16px">
      <el-button type="primary" @click="openModal()"><el-icon><Plus/></el-icon> 新增管理员</el-button>
    </el-card>
    <el-card shadow="never">
      <el-table :data="list" v-loading="loading" stripe>
        <el-table-column prop="username" label="账号" width="140" />
        <el-table-column prop="nickName" label="显示名" min-width="120" />
        <el-table-column prop="role" label="角色" width="140" />
        <el-table-column label="状态" width="90">
          <template #default="{row}">
            <el-tag :type="row.status ? 'success' : 'danger'" size="small">{{ row.status ? '正常' : '禁用' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="lastLoginAt" label="最后登录" width="160" />
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
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import request from '../utils/request'

const list = ref([])
const loading = ref(false)
const dialogVisible = ref(false)
const form = ref({ username: '', nickName: '', password: '' })

async function load() {
  loading.value = true
  try { list.value = await request.get('/api/admin/admins') || [] }
  catch {} finally { loading.value = false }
}

function openModal() {
  form.value = { username: '', nickName: '', password: '' }
  dialogVisible.value = true
}

async function save() {
  if (!form.value.username || !form.value.password) {
    ElMessage.warning('账号和密码不能为空')
    return
  }
  await request.post('/api/admin/admins', form.value)
  ElMessage.success('添加成功')
  dialogVisible.value = false
  load()
}

onMounted(load)
</script>
