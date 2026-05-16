import { ElMessage } from 'element-plus'
import request from './request'

export const DEFAULT_IMAGE_UPLOAD_OPTIONS = {
  maxSizeMB: 2,
  acceptTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  uploadUrl: '/image/upload',
  filename: 'image.jpg'
}

export function validateImageFile(file, options = {}) {
  const config = { ...DEFAULT_IMAGE_UPLOAD_OPTIONS, ...options }

  if (!file?.type?.startsWith('image/')) {
    ElMessage.error('只能上传图片文件')
    return false
  }

  if (Array.isArray(config.acceptTypes) && config.acceptTypes.length && !config.acceptTypes.includes(file.type)) {
    ElMessage.error(`仅支持 ${config.acceptTypes.map(type => type.split('/')[1]).join('、')} 格式`)
    return false
  }

  if (config.maxSizeMB && file.size / 1024 / 1024 > config.maxSizeMB) {
    ElMessage.error(`图片大小不能超过 ${config.maxSizeMB}MB`)
    return false
  }

  return true
}

export async function uploadImageFile(fileOrBlob, options = {}) {
  const config = { ...DEFAULT_IMAGE_UPLOAD_OPTIONS, ...options }
  const formData = new FormData()
  formData.append('file', fileOrBlob, config.filename)
  const res = await request.upload(config.uploadUrl, formData)
  return res?.url || ''
}

export function normalizeImageUploadResponse(response) {
  return response?.data?.originalUrl || response?.data?.imageUrl || response?.data?.url || response?.url || ''
}
