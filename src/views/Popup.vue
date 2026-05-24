<template>
  <div>
    <el-card shadow="never" style="margin-bottom: 16px">
      <el-button type="primary" @click="handleAdd">
        <el-icon><Plus /></el-icon>
        添加弹窗
      </el-button>
    </el-card>

    <el-card shadow="never">
      <el-table :data="popups" v-loading="tableLoading" stripe>
      <el-table-column prop="id" label="ID" width="60" />
      <el-table-column prop="key" label="标识" width="120" />
      <el-table-column prop="title" label="标题" min-width="150" />
      <el-table-column prop="priority" label="优先级" width="80" />
      <el-table-column prop="enabled" label="状态" width="80">
        <template #default="{ row }">
          <el-tag :type="popupEnabledDict.tagType(row.enabled === true || row.enabled === 1 ? '1' : '0')" size="small">
            {{ popupEnabledDict.label(row.enabled === true || row.enabled === 1 ? '1' : '0') }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="startTime" label="开始时间" width="160">
        <template #default="{ row }">
          {{ formatTime(row.startTime) }}
        </template>
      </el-table-column>
      <el-table-column prop="endTime" label="结束时间" width="160">
        <template #default="{ row }">
          {{ formatTime(row.endTime) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="180" fixed="right">
        <template #default="{ row }">
          <el-button size="small" @click="handleEdit(row)">编辑</el-button>
          <el-button size="small" type="danger" @click="handleDelete(row.id)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    </el-card>

    <!-- 编辑弹窗 -->
    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑弹窗' : '添加弹窗'" width="600px">
      <el-form :model="form" label-width="100px">
        <el-form-item label="标识Key">
          <el-input v-model="form.key" :disabled="isEdit" placeholder="如: welcome, update_notice" />
        </el-form-item>
        <el-form-item label="标题">
          <el-input v-model="form.title" placeholder="弹窗标题" />
        </el-form-item>
        <el-form-item label="内容">
          <el-input v-model="form.content" type="textarea" :rows="4" placeholder="弹窗内容" />
        </el-form-item>
        <el-form-item label="图片">
          <div class="image-upload-area">
            <el-upload
              class="image-uploader"
              :show-file-list="false"
              :before-upload="beforeImageUpload"
              accept="image/*"
            >
              <img v-if="form.imageUrl" :src="form.imageUrl" class="uploaded-image" />
              <el-icon v-else class="uploader-icon"><Plus /></el-icon>
            </el-upload>
            <div class="upload-tip">
              <p>可选，点击上传配图</p>
              <p>支持 jpg、png、gif、webp，大小不超过 2MB</p>
            </div>
          </div>
        </el-form-item>
        <el-form-item label="按钮文字">
          <el-input v-model="form.buttonText" placeholder="默认'我知道了'" />
        </el-form-item>
        <el-form-item label="按钮链接">
          <el-input v-model="form.buttonUrl" placeholder="可选，点击跳转链接" />
        </el-form-item>
        <el-form-item label="优先级">
          <el-input-number v-model="form.priority" :min="0" :max="100" />
        </el-form-item>
        <el-form-item label="启用">
          <el-switch v-model="form.enabled" :active-value="1" :inactive-value="0" />
        </el-form-item>
        <el-form-item label="开始时间">
          <el-date-picker v-model="form.startTime" type="datetime" placeholder="留空表示立即开始"
            format="YYYY-MM-DD HH:mm:ss" value-format="YYYY-MM-DD HH:mm:ss" />
        </el-form-item>
        <el-form-item label="结束时间">
          <el-date-picker v-model="form.endTime" type="datetime" placeholder="留空表示永久有效"
            format="YYYY-MM-DD HH:mm:ss" value-format="YYYY-MM-DD HH:mm:ss" />
        </el-form-item>
        <el-form-item label="展示间隔">
          <el-input-number v-model="form.showInterval" :min="0" :max="365" />
          <span style="margin-left: 8px; color: #999">天，0表示每次都展示</span>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSave" :loading="saveLoading" :disabled="saveLoading">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import request from '../utils/request'
import { DICT_TYPE } from '../constants/dict'
import { useDict } from '../composables/useDict'
import { formatTime } from '../utils/format'
import { uploadImageFile, validateImageFile } from '../utils/imageUpload'

const popups = ref([])
const tableLoading = ref(false)
const saveLoading = ref(false)
const dialogVisible = ref(false)
const isEdit = ref(false)
const form = ref({
  id: null,
  key: '',
  title: '',
  content: '',
  imageUrl: '',
  buttonText: '我知道了',
  buttonUrl: '',
  priority: 0,
  enabled: 1,
  startTime: null,
  endTime: null,
  showInterval: 0
})

const popupEnabledDict = useDict(DICT_TYPE.POPUP_ENABLED)

const loadPopups = async () => {
  tableLoading.value = true
  try {
    popups.value = (await request.get('/admin/popup/list')) || []
  } catch (e) {
    ElMessage.error('加载弹窗失败')
  } finally {
    tableLoading.value = false
  }
}

const handleAdd = () => {
  isEdit.value = false
  form.value = {
    id: null,
    key: '',
    title: '',
    content: '',
    imageUrl: '',
    buttonText: '我知道了',
    buttonUrl: '',
    priority: 0,
    enabled: 1,
    startTime: null,
    endTime: null,
    showInterval: 0
  }
  dialogVisible.value = true
}

const handleEdit = (row) => {
  isEdit.value = true
  form.value = { ...row }
  dialogVisible.value = true
}

const handleSave = async () => {
  if (saveLoading.value) return
  saveLoading.value = true
  try {
    await request.post('/admin/popup/save', form.value)
    ElMessage.success('保存成功')
    dialogVisible.value = false
    loadPopups()
  } catch (e) {
    ElMessage.error('保存失败')
  } finally {
    saveLoading.value = false
  }
}

const handleDelete = async (id) => {
  try {
    await ElMessageBox.confirm('确认删除该弹窗配置？', '提示', { type: 'warning' })
    await request.delete('/admin/popup/delete/' + id)
    ElMessage.success('删除成功')
    loadPopups()
  } catch (e) {}
}

const beforeImageUpload = async (file) => {
  if (!validateImageFile(file, { maxSizeMB: 2 })) return false

  try {
    const imageUrl = await uploadImageFile(file, { filename: file.name || 'popup-image.jpg' })
    if (imageUrl) {
      form.value.imageUrl = imageUrl
      ElMessage.success('上传成功')
    } else {
      ElMessage.error('上传失败')
    }
  } catch (e) {
    ElMessage.error('上传失败，请重试')
  }

  return false
}

onMounted(() => {
  loadPopups()
})
</script>

<style scoped>
.image-upload-area {
  display: flex;
  align-items: flex-start;
  gap: 16px;
}

.image-uploader {
  width: 120px;
  height: 80px;
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
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

.upload-tip p {
  margin: 0;
}
</style>
