<template>
  <div>
    <el-card shadow="never" style="margin-bottom: 16px">
      <el-button type="primary" @click="openModal(null)">
        <el-icon><Plus /></el-icon>
        New Banner
      </el-button>
    </el-card>

    <el-card shadow="never">
      <el-table :data="list" v-loading="loading" stripe>
        <el-table-column prop="sortOrder" label="Sort" width="80" />
        <el-table-column prop="title" label="Title" min-width="160" />
        <el-table-column label="Bg" width="90">
          <template #default="{ row }">
            <span
              v-if="row.bgColor"
              :style="{ display: 'inline-block', width: '24px', height: '24px', background: row.bgColor, borderRadius: '4px', border: '1px solid #ddd' }"
            ></span>
            <span v-else style="color: #999">Default</span>
          </template>
        </el-table-column>
        <el-table-column label="Image" width="100">
          <template #default="{ row }">
            <el-image
              v-if="row.imageUrl"
              :src="row.imageUrl"
              fit="cover"
              style="width: 60px; height: 40px; border-radius: 4px"
              :preview-src-list="[row.imageUrl]"
            />
            <span v-else style="color: #999">None</span>
          </template>
        </el-table-column>
        <el-table-column prop="tagText" label="Tag" width="120" />
        <el-table-column label="Status" width="90">
          <template #default="{ row }">
            <el-tag :type="row.status ? 'success' : 'info'" size="small">{{ row.status ? 'On' : 'Off' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="Actions" width="170" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="openModal(row)">Edit</el-button>
            <el-button size="small" :type="row.status ? 'danger' : 'success'" @click="toggle(row)">
              {{ row.status ? 'Off' : 'On' }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="form.id ? 'Edit Banner' : 'New Banner'" width="700px">
      <el-form :model="form" label-width="100px">
        <el-form-item label="Title"><el-input v-model="form.title" /></el-form-item>
        <el-form-item label="Subtitle"><el-input v-model="form.subTitle" /></el-form-item>
        <el-form-item label="Tag"><el-input v-model="form.tagText" /></el-form-item>
        <el-form-item label="Background">
          <el-color-picker v-model="form.bgColor" show-alpha />
        </el-form-item>
        <el-form-item label="Sort"><el-input-number v-model="form.sortOrder" :min="1" /></el-form-item>

        <el-form-item label="Image">
          <div class="image-upload-area">
            <el-upload class="image-uploader" :show-file-list="false" :before-upload="beforeUpload" accept="image/*">
              <img v-if="form.imageUrl" :src="form.imageUrl" class="uploaded-image" />
              <el-icon v-else class="uploader-icon"><Plus /></el-icon>
            </el-upload>
            <div class="upload-tip">
              <p>Recommended: 400×288</p>
              <p>Click to upload and crop</p>
            </div>
          </div>
        </el-form-item>

        <el-form-item label="Link Type">
          <el-select v-model="form.linkType" style="width: 100%">
            <el-option label="NONE" value="NONE" />
            <el-option label="PAGE" value="PAGE" />
            <el-option label="URL" value="URL" />
          </el-select>
        </el-form-item>

        <el-form-item label="Link Value" v-if="form.linkType === 'PAGE'">
          <el-select v-model="form.linkValue" filterable allow-create default-first-option style="width: 100%">
            <el-option v-for="item in pageOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>

        <el-form-item label="Link Value" v-else>
          <el-input v-model="form.linkValue" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">Cancel</el-button>
        <el-button type="primary" @click="save" :loading="saving">Save</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="cropperVisible" title="Crop Image" width="800px">
      <div class="cropper-container">
        <vue-cropper
          ref="cropperRef"
          :img="cropperImg"
          :auto-crop="true"
          :auto-crop-width="400"
          :auto-crop-height="288"
          :fixed="true"
          :fixed-number="[25, 18]"
          :can-move-box="true"
          :center-box="true"
          :info="true"
        />
      </div>
      <template #footer>
        <el-button @click="cropperVisible = false">Cancel</el-button>
        <el-button @click="rotateCropper">Rotate</el-button>
        <el-button type="primary" @click="confirmCrop" :loading="uploading">Confirm Crop & Upload</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import request from '../utils/request'
import { VueCropper } from 'vue-cropper'
import 'vue-cropper/dist/index.css'

const list = ref([])
const loading = ref(false)
const dialogVisible = ref(false)
const form = ref({})
const saving = ref(false)

const cropperVisible = ref(false)
const cropperImg = ref('')
const cropperRef = ref(null)
const uploading = ref(false)

const pageOptions = [
  { label: 'Home', value: '/pages/home/home' },
  { label: 'Convert', value: '/pages/convert/convert' },
  { label: 'AI Generate', value: '/pages/ai-generate/ai-generate' },
  { label: 'Profile', value: '/pages/profile/profile' },
  { label: 'Generate', value: '/pages/generate/generate' },
  { label: 'History', value: '/pages/history/history' },
  { label: 'My Patterns', value: '/pages/my-patterns/my-patterns' },
  { label: 'Draw', value: '/pages/draw/draw' },
  { label: 'Generating', value: '/pages/generating/generating' },
  { label: 'Result', value: '/pages/result/result' },
  { label: 'Focus Mode', value: '/pages/focus-mode/focus-mode' },
  { label: 'VIP', value: '/pages/vip/vip' }
]

async function load() {
  loading.value = true
  try {
    list.value = (await request.get('/admin/banners')) || []
  } finally {
    loading.value = false
  }
}

function openModal(row) {
  form.value = row
    ? { ...row }
    : { title: '', subTitle: '', imageUrl: '', tagText: '', bgColor: '', sortOrder: 1, linkType: 'NONE', linkValue: '' }
  dialogVisible.value = true
}

async function save() {
  saving.value = true
  try {
    if (form.value.id) {
      await request.put(`/admin/banners/${form.value.id}`, form.value)
    } else {
      await request.post('/admin/banners', form.value)
    }
    ElMessage.success('Saved')
    dialogVisible.value = false
    load()
  } catch {
    ElMessage.error('Save failed')
  } finally {
    saving.value = false
  }
}

async function toggle(row) {
  await request.post(`/admin/banners/${row.id}/toggle`)
  ElMessage.success(row.status ? 'Switched off' : 'Switched on')
  load()
}

function beforeUpload(file) {
  const reader = new FileReader()
  reader.onload = (e) => {
    cropperImg.value = e.target?.result || ''
    cropperVisible.value = true
  }
  reader.readAsDataURL(file)
  return false
}

function rotateCropper() {
  if (cropperRef.value && typeof cropperRef.value.rotateRight === 'function') {
    cropperRef.value.rotateRight()
  }
}

async function confirmCrop() {
  if (!cropperRef.value || typeof cropperRef.value.getCropBlob !== 'function') {
    ElMessage.error('Cropper not ready')
    return
  }

  uploading.value = true
  try {
    const blob = await new Promise((resolve, reject) => {
      cropperRef.value.getCropBlob((b) => {
        if (b) resolve(b)
        else reject(new Error('No cropped blob'))
      })
    })

    const formData = new FormData()
    formData.append('file', blob, 'banner.jpg')

    const res = await request.upload('/image/upload', formData)
    if (res?.url) {
      form.value.imageUrl = res.url
      cropperVisible.value = false
      ElMessage.success('Upload success')
    } else {
      ElMessage.error('Upload failed')
    }
  } catch (e) {
    console.error('Upload failed:', e)
    ElMessage.error('Image process failed')
  } finally {
    uploading.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.image-upload-area {
  display: flex;
  align-items: flex-start;
  gap: 16px;
}

.image-uploader {
  width: 160px;
  height: 115px;
  border: 2px dashed #d9d9d9;
  border-radius: 8px;
  cursor: pointer;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: border-color 0.3s;
}

.image-uploader:hover {
  border-color: #409eff;
}

.uploaded-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.uploader-icon {
  font-size: 28px;
  color: #8c9399;
}

.upload-tip {
  color: #909399;
  font-size: 12px;
  line-height: 1.8;
}

.cropper-container {
  width: 100%;
  height: 400px;
  background: #eee;
  border-radius: 8px;
}
</style>
