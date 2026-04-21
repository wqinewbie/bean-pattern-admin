import axios from 'axios'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '../stores/auth'

const request = axios.create({
  baseURL: (import.meta.env.VITE_API_BASE_URL || '') + '/api',
  timeout: 15000,
})

request.interceptors.request.use(config => {
  const auth = useAuthStore()
  if (auth.token) {
    config.headers.Authorization = 'Bearer ' + auth.token
  }
  return config
})

request.interceptors.response.use(
  res => {
    const data = res.data
    if (data.code !== 0) {
      ElMessage.error(data.message || '请求失败')
      return Promise.reject(new Error(data.message))
    }
    return data.data
  },
  err => {
    if (err.response?.status === 401) {
      const auth = useAuthStore()
      auth.logout()
      window.location.href = '/login'
    }
    ElMessage.error(err.response?.data?.message || '网络错误')
    return Promise.reject(err)
  }
)

// 文件上传
request.upload = async (url, formData) => {
  const auth = useAuthStore()
  const res = await axios.post((import.meta.env.VITE_API_BASE_URL || '') + '/api' + url, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
      ...(auth.token ? { Authorization: 'Bearer ' + auth.token } : {})
    },
    timeout: 60000,
  })
  if (res.data.code !== 0) {
    throw new Error(res.data.message || '上传失败')
  }
  // 返回 imageUrl 字段
  return { url: res.data.data?.imageUrl || res.data.data?.originalUrl || '' }
}

export default request
