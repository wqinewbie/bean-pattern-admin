<template>
  <div>
    <el-card shadow="never" style="margin-bottom:16px">
      <el-button type="primary" @click="openModal(null)"><el-icon><Plus/></el-icon> 新增教程</el-button>
    </el-card>

    <el-card shadow="never">
      <el-table :data="list" v-loading="loading" stripe>
        <el-table-column prop="sortOrder" label="排序" width="70" />
        <el-table-column prop="title" label="标题" min-width="140" />
        <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
        <el-table-column label="视频地址" min-width="200">
          <template #default="{row}">
            <span style="color:#409EFF;font-size:12px" :title="row.videoUrl">{{ row.videoUrl ? (row.videoUrl.length > 30 ? row.videoUrl.substring(0,30)+'...' : row.videoUrl) : '无' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="90">
          <template #default="{row}">
            <el-tag :type="tutorialStatusDict.tagType(row.status ? '1' : '0')" size="small">{{ tutorialStatusDict.label(row.status ? '1' : '0') }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{row}">
            <el-button size="small" @click="openModal(row)">编辑</el-button>
            <el-button size="small" :type="row.status ? 'danger' : 'success'" @click="toggle(row)">{{ row.status ? '下线' : '上线' }}</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="form.id ? '编辑教程' : '新增教程'" width="620px">
      <el-form :model="form" label-width="90px">
        <el-form-item label="标题" required>
          <el-input v-model="form.title" placeholder="如：新手必看：如何拼出完美立体豆？" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="form.description" type="textarea" :rows="2" placeholder="简短描述教程内容" />
        </el-form-item>
        <el-form-item label="封面图">
          <div v-if="form.thumbnailUrl" style="margin-bottom:8px">
            <el-image :src="form.thumbnailUrl" style="width:120px;height:80px" fit="cover" />
          </div>
          <el-upload
            accept="image/*"
            :show-file-list="false"
            :before-upload="beforeImageUpload"
          >
            <el-button type="primary" :loading="uploadingImage">
              <el-icon v-if="!uploadingImage"><Upload/></el-icon>
              {{ uploadingImage ? '上传中...' : (form.thumbnailUrl ? '更换封面' : '上传封面') }}
            </el-button>
          </el-upload>
          <div style="margin-top:8px;color:#909399;font-size:12px">
            建议尺寸 16:9，支持 jpg、png 格式，不超过 2MB
          </div>
        </el-form-item>
        <el-form-item label="视频上传" required>
          <div v-if="form.videoUrl" style="margin-bottom:8px">
            <el-tag type="success">已上传</el-tag>
            <span style="margin-left:8px;color:#67C23A;font-size:12px;word-break:break-all">{{ form.videoUrl }}</span>
          </div>
          <div v-else style="margin-bottom:8px;color:#E6A23C;font-size:12px">未上传视频</div>
          <el-upload
            :action="uploadUrl"
            :headers="{ Authorization: 'Bearer ' + token }"
            accept="video/*"
            :show-file-list="false"
            :before-upload="beforeVideoUpload"
            :on-success="onVideoUploadSuccess"
            :on-error="onVideoUploadError"
          >
            <el-button type="primary" :loading="uploading">
              <el-icon v-if="!uploading"><Upload/></el-icon>
              {{ uploading ? '上传中...' : (form.videoUrl ? '重新上传' : '上传视频') }}
            </el-button>
          </el-upload>
          <div style="margin-top:8px;color:#909399;font-size:12px">
            支持 mp4、mov 等视频格式，建议小于 100MB
          </div>
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="form.sortOrder" :min="1" :max="999" />
        </el-form-item>
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
import { ElMessage } from 'element-plus'
import { useAuthStore } from '../stores/auth'
import request from '../utils/request'
import { uploadImageFile, validateImageFile } from '../utils/imageUpload'
import { DICT_TYPE } from '../constants/dict'
import { useDict } from '../composables/useDict'

const auth = useAuthStore()
const token = computed(() => auth.token || '')
const uploadUrl = computed(() => (import.meta.env.VITE_API_BASE_URL || '') + '/api/admin/tutorials/video-upload')

const list = ref([])
const loading = ref(false)
const dialogVisible = ref(false)
const form = ref({})
const uploading = ref(false)
const uploadingImage = ref(false)

const tutorialStatusDict = useDict(DICT_TYPE.TUTORIAL_STATUS)

async function load() {
  loading.value = true
  try { list.value = await request.get('/admin/tutorials') || [] }
  catch {} finally { loading.value = false }
}

function openModal(row) {
  form.value = row
    ? { ...row }
    : { title: '', description: '', videoUrl: '', thumbnailUrl: '', sortOrder: 1 }
  dialogVisible.value = true
}

async function beforeImageUpload(file) {
  if (!validateImageFile(file, { maxSizeMB: 2, acceptTypes: ['image/jpeg', 'image/png'] })) return false

  uploadingImage.value = true
  try {
    const imageUrl = await uploadImageFile(file, { filename: file.name || 'tutorial-thumbnail.jpg' })
    if (imageUrl) {
      form.value.thumbnailUrl = imageUrl
      ElMessage.success('封面上传成功')
    } else {
      ElMessage.error('上传失败')
    }
  } catch (e) {
    ElMessage.error('封面上传失败，请重试')
  } finally {
    uploadingImage.value = false
  }

  return false
}

function beforeVideoUpload(file) {
  const isVideo = file.type.startsWith('video/')
  if (!isVideo) {
    ElMessage.error('只能上传视频文件')
    return false
  }
  const isLt100M = file.size / 1024 / 1024 < 100
  if (!isLt100M) {
    ElMessage.error('视频大小不能超过 100MB')
    return false
  }
  uploading.value = true
  return true
}

function onVideoUploadSuccess(res) {
  uploading.value = false
  if (res.code === 0 && res.data && res.data.originalUrl) {
    form.value.videoUrl = res.data.originalUrl
    ElMessage.success('视频上传成功')
  } else {
    ElMessage.error(res.message || '上传失败')
  }
}

function onVideoUploadError() {
  uploading.value = false
  ElMessage.error('视频上传失败，请重试')
}

async function save() {
  if (!form.value.title) {
    ElMessage.warning('请填写标题')
    return
  }
  if (!form.value.videoUrl) {
    ElMessage.warning('请上传视频')
    return
  }
  if (form.value.id) {
    await request.put(`/admin/tutorials/${form.value.id}`, form.value)
  } else {
    await request.post('/admin/tutorials', form.value)
  }
  ElMessage.success('保存成功')
  dialogVisible.value = false
  load()
}

async function toggle(row) {
  await request.post(`/admin/tutorials/${row.id}/toggle`)
  ElMessage.success(row.status ? '已下线' : '已上线')
  load()
}

onMounted(load)
</script>
