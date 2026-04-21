<template>
  <div>
    <el-card shadow="never" style="margin-bottom:16px">
      <el-button type="primary" @click="openModal(null)"><el-icon><Plus/></el-icon> 新增Banner</el-button>
    </el-card>

    <el-card shadow="never">
      <el-table :data="list" v-loading="loading" stripe>
        <el-table-column prop="sortOrder" label="排序" width="70" />
        <el-table-column prop="title" label="标题" min-width="140" />
        <el-table-column label="背景色" width="90">
          <template #default="{row}">
            <span v-if="row.bgColor" :style="{display:'inline-block',width:'24px',height:'24px',background:row.bgColor,borderRadius:'4px',border:'1px solid #ddd'}"></span>
            <span v-else style="color:#999">默认</span>
          </template>
        </el-table-column>
        <el-table-column label="图片" width="100">
          <template #default="{row}">
            <el-image v-if="row.imageUrl" :src="row.imageUrl" fit="cover" style="width:60px;height:40px;border-radius:4px" :preview-src-list="[row.imageUrl]" />
            <span v-else style="color:#999">无</span>
          </template>
        </el-table-column>
        <el-table-column prop="tagText" label="标签" width="100" />
        <el-table-column label="状态" width="90">
          <template #default="{row}">
            <el-tag :type="row.status ? 'success' : 'info'" size="small">{{ row.status ? '上线' : '下线' }}</el-tag>
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

    <el-dialog v-model="dialogVisible" :title="form.id ? '编辑Banner' : '新增Banner'" width="700px">
      <el-form :model="form" label-width="90px">
        <el-form-item label="标题"><el-input v-model="form.title" /></el-form-item>
        <el-form-item label="副标题"><el-input v-model="form.subTitle" /></el-form-item>
        <el-form-item label="标签"><el-input v-model="form.tagText" /></el-form-item>
        <el-form-item label="背景颜色">
          <el-color-picker v-model="form.bgColor" show-alpha />
          <span style="margin-left:12px;color:#909399;font-size:12px">支持渐变，格式：#FF9800, #FFB74D</span>
        </el-form-item>
        <el-form-item label="排序"><el-input-number v-model="form.sortOrder" :min="1" /></el-form-item>

        <el-form-item label="图片">
          <div class="image-upload-area">
            <el-upload
              class="image-uploader"
              :show-file-list="false"
              :before-upload="beforeUpload"
              accept="image/*"
            >
              <img v-if="form.imageUrl" :src="form.imageUrl" class="uploaded-image" />
              <el-icon v-else class="uploader-icon"><Plus /></el-icon>
            </el-upload>
            <div class="upload-tip">
              <p>建议尺寸：400×288px</p>
              <p>点击上传图片，支持裁剪</p>
            </div>
          </div>
        </el-form-item>

        <el-form-item label="跳转类型">
          <el-select v-model="form.linkType" style="width:100%">
            <el-option label="不跳转（NONE）" value="NONE" />
            <el-option label="小程序页面（PAGE）" value="PAGE" />
            <el-option label="外链复制（URL）" value="URL" />
          </el-select>
        </el-form-item>

        <el-form-item label="跳转值" v-if="form.linkType === 'PAGE'">
          <div style="width:100%">
            <el-select v-model="form.linkValue" filterable allow-create default-first-option style="width:100%" placeholder="选择页面或手动输入带参数URL">
              <el-option v-for="item in pageOptions" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
            <div style="margin-top:8px;color:#909399;font-size:12px;line-height:1.6">
              <div><b>常用示例：</b><code>/pages/my-patterns/my-patterns</code></div>
              <div><b>带参数：</b><code>/pages/generate/generate?imageUrl=https%3A%2F%2Fxx.com%2Fa.png</code></div>
              <div>提示：参数里的链接请先 encodeURIComponent</div>
            </div>
          </div>
        </el-form-item>

        <el-form-item label="跳转值" v-else>
          <el-input v-model="form.linkValue" placeholder="按下方示例填写" />
          <div style="margin-top:8px;color:#909399;font-size:12px;line-height:1.6">
            <div v-if="form.linkType === 'URL'"><b>URL 示例：</b><code>https://mp.weixin.qq.com/s/xxxx</code>（小程序会复制链接）</div>
            <div v-else><b>NONE：</b>留空即可</div>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible=false">取消</el-button>
        <el-button type="primary" @click="save" :loading="saving">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="cropperVisible" title="裁剪图片" width="800px">
      <div class="cropper-container">
        <vue-cropper
          ref="cropperRef"
          :src="cropperImg"
          :aspect-ratio="400/288"
          :view-mode="1"
          :drag-mode="'move'"
          :guides="true"
          :center="true"
          :highlight="false"
          :background="true"
          :responsive="true"
          :checkOrientation="false"
          @ready="onCropperReady"
        />
      </div>
      <template #footer>
        <el-button @click="cropperVisible=false">取消</el-button>
        <el-button @click="rotateCropper">旋转</el-button>
        <el-button type="primary" @click="confirmCrop" :loading="uploading">确认裁剪并上传</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import request from '../utils/request'
import { VueCropper } from 'vue-cropper'

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
  { label: '首页', value: '/pages/home/home' },
  { label: '图片转图纸', value: '/pages/convert/convert' },
  { label: 'AI生成', value: '/pages/ai-generate/ai-generate' },
  { label: '我的', value: '/pages/profile/profile' },
  { label: '生成页', value: '/pages/generate/generate' },
  { label: '历史记录', value: '/pages/history/history' },
  { label: '我的图纸', value: '/pages/my-patterns/my-patterns' },
  { label: '空白画板', value: '/pages/draw/draw' },
  { label: '生成中', value: '/pages/generating/generating' },
  { label: '结果页', value: '/pages/result/result' },
  { label: '专注模式', value: '/pages/focus-mode/focus-mode' },
  { label: 'VIP', value: '/pages/vip/vip' }
]

async function load() {
  loading.value = true
  try { list.value = await request.get('/admin/banners') || [] }
  catch {} finally { loading.value = false }
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
    ElMessage.success('保存成功')
    dialogVisible.value = false
    load()
  } catch (e) {
    ElMessage.error('保存失败')
  } finally {
    saving.value = false
  }
}

async function toggle(row) {
  await request.post(`/admin/banners/${row.id}/toggle`)
  ElMessage.success(row.status ? '已下线' : '已上线')
  load()
}

function beforeUpload(file) {
  const reader = new FileReader()
  reader.onload = (e) => {
    cropperImg.value = e.target.result
    cropperVisible.value = true
  }
  reader.readAsDataURL(file)
  return false
}

function onCropperReady() {}

function rotateCropper() {
  if (cropperRef.value) {
    cropperRef.value.rotateRight()
  }
}

async function confirmCrop() {
  if (!cropperRef.value) return

  uploading.value = true
  try {
    const cropper = cropperRef.value
    const canvas = cropper.getCroppedCanvas({
      width: 400,
      height: 288,
      imageSmoothingEnabled: true,
      imageSmoothingQuality: 'high'
    })

    if (!canvas) {
      throw new Error('获取裁剪画布失败')
    }

    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.9))

    const formData = new FormData()
    formData.append('file', blob, 'banner.jpg')

    const res = await request.upload('/image/upload', formData)
    if (res && res.url) {
      form.value.imageUrl = res.url
      cropperVisible.value = false
      ElMessage.success('图片上传成功')
    } else {
      ElMessage.error('图片上传失败')
    }
  } catch (e) {
    console.error('上传失败:', e)
    ElMessage.error('图片处理失败')
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
