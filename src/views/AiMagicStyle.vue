<template>
  <div>
    <el-card shadow="never" style="margin-bottom: 16px">
      <el-button type="primary" @click="handleAdd">
        <el-icon><Plus /></el-icon>
        添加风格
      </el-button>
    </el-card>

    <el-card shadow="never">
      <el-table :data="styles" v-loading="tableLoading" stripe>
      <el-table-column prop="id" label="ID" width="60" />
      <el-table-column prop="name" label="风格名称" width="120" />
      <el-table-column prop="icon" label="图标" width="80" align="center">
        <template #default="{ row }">
          <el-image v-if="row.icon" :src="row.icon" style="width: 40px; height: 40px" fit="cover" />
        </template>
      </el-table-column>
      <el-table-column prop="category" label="分类" width="100" />
      <el-table-column prop="tag" label="标签" width="120" />
      <el-table-column prop="description" label="描述" min-width="150" show-overflow-tooltip />
      <el-table-column prop="sortOrder" label="排序" width="80" />
      <el-table-column prop="enabled" label="状态" width="80">
        <template #default="{ row }">
          <el-tag :type="row.enabled ? 'success' : 'info'" size="small">
            {{ row.enabled ? '启用' : '禁用' }}
          </el-tag>
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

    <!-- 编辑对话框 -->
    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑风格' : '添加风格'" width="600px">
      <el-form :model="form" label-width="120px">
        <el-form-item label="风格名称">
          <el-input v-model="form.name" placeholder="如：人物特化" />
        </el-form-item>
        <el-form-item label="图标">
          <el-upload
            class="icon-uploader"
            :action="uploadUrl"
            :headers="uploadHeaders"
            :show-file-list="false"
            :on-success="handleUploadSuccess"
            :before-upload="beforeUpload"
            accept="image/*"
          >
            <img v-if="form.icon" :src="form.icon" class="icon-preview" />
            <el-icon v-else class="icon-uploader-icon"><Plus /></el-icon>
          </el-upload>
          <div style="color: #999; font-size: 12px; margin-top: 4px;">
            建议尺寸：100x100px，支持 jpg/png/gif，大小不超过2MB
          </div>
        </el-form-item>
        <el-form-item label="分类">
          <el-select v-model="form.category" placeholder="请选择">
            <el-option label="题材" value="题材" />
            <el-option label="用途" value="用途" />
            <el-option label="高阶" value="高阶" />
          </el-select>
        </el-form-item>
        <el-form-item label="标签">
          <el-input v-model="form.tag" placeholder="如：适用人物" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="form.description" type="textarea" :rows="2" placeholder="风格描述" />
        </el-form-item>
        <el-form-item label="AI提示词模板">
          <el-input v-model="form.promptTemplate" type="textarea" :rows="3"
                    placeholder="如：portrait, detailed face, high quality" />
          <div style="color: #999; font-size: 12px; margin-top: 4px;">
            正式版AI服务会使用此模板生成图片
          </div>
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="form.sortOrder" :min="0" :max="999" />
          <span style="margin-left: 8px; color: #999">数字越小越靠前</span>
        </el-form-item>
        <el-form-item label="启用">
          <el-switch v-model="form.enabled" :active-value="1" :inactive-value="0" />
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
import { ref, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import request from '../utils/request'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const uploadUrl = computed(() => `${import.meta.env.VITE_API_BASE_URL || ''}/api/image/upload`)
const uploadHeaders = computed(() => ({
  'Authorization': `Bearer ${auth.token}`
}))

const styles = ref([])
const tableLoading = ref(false)
const saveLoading = ref(false)
const dialogVisible = ref(false)
const isEdit = ref(false)
const form = ref({
  id: null,
  name: '',
  icon: '',
  category: '题材',
  tag: '',
  description: '',
  promptTemplate: '',
  sortOrder: 0,
  enabled: 1
})

const loadStyles = async () => {
  tableLoading.value = true
  try {
    styles.value = (await request.get('/admin/ai-magic-style/list')) || []
  } catch (e) {
    ElMessage.error('加载失败')
  } finally {
    tableLoading.value = false
  }
}

const handleAdd = () => {
  isEdit.value = false
  form.value = {
    id: null,
    name: '',
    icon: '',
    category: '题材',
    tag: '',
    description: '',
    promptTemplate: '',
    sortOrder: 0,
    enabled: 1
  }
  dialogVisible.value = true
}

const handleEdit = (row) => {
  isEdit.value = true
  form.value = { ...row }
  dialogVisible.value = true
}

const handleSave = async () => {
  if (!form.value.name) {
    ElMessage.warning('请输入风格名称')
    return
  }
  if (!form.value.category) {
    ElMessage.warning('请选择分类')
    return
  }

  saveLoading.value = true
  try {
    await request.post('/admin/ai-magic-style/save', form.value)
    ElMessage.success('保存成功')
    dialogVisible.value = false
    loadStyles()
  } catch (e) {
    ElMessage.error('保存失败')
  } finally {
    saveLoading.value = false
  }
}

const handleDelete = async (id) => {
  try {
    await ElMessageBox.confirm('确认删除该风格？', '提示', { type: 'warning' })
    await request.delete('/admin/ai-magic-style/delete/' + id)
    ElMessage.success('删除成功')
    loadStyles()
  } catch (e) {}
}

const beforeUpload = (file) => {
  const isImage = file.type.startsWith('image/')
  const isLt2M = file.size / 1024 / 1024 < 2

  if (!isImage) {
    ElMessage.error('只能上传图片文件')
    return false
  }
  if (!isLt2M) {
    ElMessage.error('图片大小不能超过 2MB')
    return false
  }
  return true
}

const handleUploadSuccess = (response) => {
  if (response.code === 0 && response.data) {
    form.value.icon = response.data.originalUrl || response.data.imageUrl || response.data.url
    ElMessage.success('上传成功')
  } else {
    ElMessage.error('上传失败')
  }
}

onMounted(() => {
  loadStyles()
})
</script>

<style scoped>
.icon-uploader {
  width: 100px;
  height: 100px;
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  overflow: hidden;
  transition: border-color 0.3s;
}
.icon-uploader:hover {
  border-color: #409eff;
}
.icon-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  width: 100px;
  height: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.icon-preview {
  width: 100px;
  height: 100px;
  object-fit: cover;
  display: block;
}
</style>
