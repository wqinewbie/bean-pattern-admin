<template>
  <div class="login-bg">
    <div class="login-card">
      <div class="login-logo">
        <span style="font-size:36px">🪄</span>
        <h2>拼豆魔法屋</h2>
        <p>管理后台 Admin Console</p>
      </div>
      <el-form :model="form" :rules="rules" ref="formRef" @submit.prevent="handleLogin">
        <el-form-item prop="username">
          <el-input v-model="form.username" placeholder="账号" size="large" prefix-icon="User" />
        </el-form-item>
        <el-form-item prop="password">
          <el-input v-model="form.password" type="password" placeholder="密码" size="large" prefix-icon="Lock" show-password @keyup.enter="handleLogin" />
        </el-form-item>
        <el-button type="primary" size="large" style="width:100%" :loading="loading" @click="handleLogin">
          登录管理后台
        </el-button>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { ElMessage } from 'element-plus'

const router = useRouter()
const auth = useAuthStore()
const formRef = ref()
const loading = ref(false)
const form = ref({ username: '', password: '' })
const rules = {
  username: [{ required: true, message: '请输入账号', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
}

async function handleLogin() {
  await formRef.value.validate()
  loading.value = true
  try {
    await auth.login(form.value.username, form.value.password)
    ElMessage.success('登录成功')
    router.push('/')
  } catch (e) {
    // error handled in request interceptor
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-bg {
  min-height: 100vh;
  background: radial-gradient(ellipse at 60% 40%, #1e1533, #0f1117);
  display: flex;
  align-items: center;
  justify-content: center;
}
.login-card {
  background: #1a1d27;
  border: 1px solid #2a2d3e;
  border-radius: 20px;
  padding: 48px 40px;
  width: 380px;
  box-shadow: 0 24px 80px rgba(0,0,0,.5);
}
.login-logo {
  text-align: center;
  margin-bottom: 32px;
}
.login-logo h2 {
  color: #e8eaf0;
  font-size: 22px;
  margin: 8px 0 4px;
}
.login-logo p {
  color: #8b90a7;
  font-size: 13px;
}
:deep(.el-input__wrapper) {
  background: #0f1117;
  border-color: #2a2d3e;
}
:deep(.el-button--primary) {
  background: linear-gradient(135deg, #f5a623, #ff8c00);
  border: none;
  color: #1a1000;
  font-weight: 700;
  margin-top: 8px;
}
</style>
