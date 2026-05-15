<template>
  <div>
    <el-card shadow="never" style="margin-bottom: 16px">
      <el-button type="primary" @click="openModal(null)">
        <el-icon><Plus /></el-icon>
        新建 Banner
      </el-button>
    </el-card>

    <el-card shadow="never">
      <el-table :data="list" v-loading="loading" stripe>
        <el-table-column prop="sortOrder" label="排序" width="80" />
        <el-table-column label="动作" width="120">
          <template #default="{ row }">
            <el-tag size="small" :type="getActionTypeTagType(row.actionType)">{{ getActionTypeLabel(row.actionType) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="领取限制" width="120">
          <template #default="{ row }">
            <el-tag v-if="row.actionType === 'CLAIM_GIFT'" size="small" :type="getClaimLimitTagType(row.actionConfig)">
              {{ getClaimLimitLabel(row.actionConfig) }}
            </el-tag>
            <span v-else style="color: #999">-</span>
          </template>
        </el-table-column>
        <el-table-column label="礼品包编码" min-width="150">
          <template #default="{ row }">
            <span v-if="row.actionType === 'CLAIM_GIFT'">{{ getGiftPackageCode(row.actionConfig) }}</span>
            <span v-else style="color: #999">-</span>
          </template>
        </el-table-column>
        <el-table-column label="活动标识" min-width="160">
          <template #default="{ row }">
            <span v-if="row.actionType === 'CLAIM_GIFT'">{{ getBannerCode(row) }}</span>
            <span v-else style="color: #999">-</span>
          </template>
        </el-table-column>
        <el-table-column label="背景色" width="90">
          <template #default="{ row }">
            <span
              v-if="row.bgColor"
              :style="{ display: 'inline-block', width: '24px', height: '24px', background: row.bgColor, borderRadius: '4px', border: '1px solid #ddd' }"
            ></span>
            <span v-else style="color: #999">默认</span>
          </template>
        </el-table-column>
        <el-table-column label="图片" width="100">
          <template #default="{ row }">
            <el-image
              v-if="row.imageUrl"
              :src="row.imageUrl"
              fit="cover"
              style="width: 85.75px; height: 36px; border-radius: 4px"
              :preview-src-list="[row.imageUrl]"
            />
            <span v-else style="color: #999">无</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="row.status ? 'success' : 'info'" size="small">{{ row.status ? '启用' : '停用' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="170" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="openModal(row)">编辑</el-button>
            <el-button size="small" :type="row.status ? 'danger' : 'success'" @click="toggle(row)">
              {{ row.status ? '停用' : '启用' }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="form.id ? '编辑 Banner' : '新建 Banner'" width="700px">
      <el-form :model="form" label-width="100px">
        <el-form-item label="背景色">
          <el-color-picker v-model="form.bgColor" show-alpha />
        </el-form-item>
        <el-form-item label="排序"><el-input-number v-model="form.sortOrder" :min="1" /></el-form-item>

        <el-form-item label="图片">
          <div class="image-upload-area">
            <el-upload class="image-uploader" :show-file-list="false" :before-upload="beforeUpload" accept="image/*">
              <img v-if="form.imageUrl" :src="form.imageUrl" class="uploaded-image" />
              <el-icon v-else class="uploader-icon"><Plus /></el-icon>
            </el-upload>
            <div class="upload-tip">
              <p>推荐尺寸：686×288</p>
              <p>点击上传并裁剪</p>
            </div>
          </div>
        </el-form-item>

        <el-form-item label="动作类型">
          <el-select v-model="form.actionType" style="width: 100%">
            <el-option v-for="item in bannerActionTypeDict.options" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>

        <el-form-item label="跳转路径" v-if="form.actionType === 'NAVIGATE'">
          <el-select v-model="form.linkValue" filterable allow-create default-first-option style="width: 100%">
            <el-option v-for="item in pageOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>

        <el-form-item label="活动编码" v-if="form.actionType === 'ACTIVITY'">
          <el-input v-model="form.linkValue" placeholder="例如：new_user_gift" />
        </el-form-item>

        <el-form-item label="礼品包" v-if="form.actionType === 'CLAIM_GIFT'">
          <el-select v-model="form.giftPackageCode" clearable filterable placeholder="选择礼品包" style="width: 100%">
            <el-option v-for="pkg in giftPackages" :key="pkg.packageCode" :label="pkg.name + '（' + pkg.packageCode + '）'" :value="pkg.packageCode" />
          </el-select>
        </el-form-item>

        <el-form-item label="领取限制" v-if="form.actionType === 'CLAIM_GIFT'">
          <el-select v-model="form.claimLimit" style="width: 100%">
            <el-option v-for="item in bannerClaimLimitDict.options" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>

        <el-form-item label="活动标识" v-if="form.actionType === 'CLAIM_GIFT'">
          <el-input v-model="form.bannerCode" placeholder="例如：daily_gift；用于防重复领取，建议保持稳定不随意修改" />
        </el-form-item>

        <el-alert
          v-if="form.actionType === 'CLAIM_GIFT'"
          type="info"
          :closable="false"
          show-icon
          title="系统会自动生成领取配置，无需手写 JSON"
          style="margin-bottom: 18px"
        />

        <el-form-item label="外部链接" v-if="form.actionType === 'EXTERNAL'">
          <el-input v-model="form.linkValue" placeholder="https://example.com" />
        </el-form-item>

        <!-- 兼容旧版本字段 -->
        <el-form-item label="跳转类型（旧）" v-if="!form.actionType || form.actionType === 'NONE'">
          <el-select v-model="form.linkType" style="width: 100%">
            <el-option label="NONE" value="NONE" />
            <el-option label="PAGE" value="PAGE" />
            <el-option label="URL" value="URL" />
          </el-select>
        </el-form-item>

        <el-form-item label="跳转值（旧）" v-if="(!form.actionType || form.actionType === 'NONE') && form.linkType === 'PAGE'">
          <el-select v-model="form.linkValue" filterable allow-create default-first-option style="width: 100%">
            <el-option v-for="item in pageOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>

        <el-form-item label="跳转值（旧）" v-else-if="(!form.actionType || form.actionType === 'NONE') && form.linkType !== 'PAGE'">
          <el-input v-model="form.linkValue" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="save" :loading="saving">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="cropperVisible" title="裁剪图片" width="800px">
      <div class="cropper-container">
        <vue-cropper
          ref="cropperRef"
          :img="cropperImg"
          :auto-crop="true"
          :auto-crop-width="686"
          :auto-crop-height="288"
          :fixed="true"
          :fixed-number="[343, 144]"
          :can-move-box="true"
          :center-box="true"
          :info="true"
        />
      </div>
      <template #footer>
        <el-button @click="cropperVisible = false">取消</el-button>
        <el-button @click="rotateCropper">旋转</el-button>
        <el-button type="primary" @click="confirmCrop" :loading="uploading">确认裁剪并上传</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import request from '../utils/request'
import { VueCropper } from 'vue-cropper'
import 'vue-cropper/dist/index.css'
import { DICT_TYPE } from '../constants/dict'
import { useDict } from '../composables/useDict'

const list = ref([])
const loading = ref(false)
const dialogVisible = ref(false)
const form = ref({})
const saving = ref(false)
const giftPackages = ref([])
const bannerActionTypeDict = useDict(DICT_TYPE.BANNER_ACTION_TYPE)
const bannerClaimLimitDict = useDict(DICT_TYPE.BANNER_CLAIM_LIMIT)

const cropperVisible = ref(false)
const cropperImg = ref('')
const cropperRef = ref(null)
const uploading = ref(false)

const pageOptions = [
  { label: '首页', value: '/pages/home/home' },
  { label: '图片转图纸', value: '/pages/convert/convert' },
  { label: 'AI 生成', value: '/pages/ai-generate/ai-generate' },
  { label: '我的', value: '/pages/profile/profile' },
  { label: '生成页', value: '/pages/generate/generate' },
  { label: '时光机', value: '/pages/history/history' },
  { label: '图纸箱', value: '/pages/my-patterns/my-patterns' },
  { label: '画板', value: '/pages/draw/draw' },
  { label: '生成中', value: '/pages/generating/generating' },
  { label: '结果页', value: '/pages/result/result' },
  { label: '专注模式', value: '/pages/focus-mode/focus-mode' },
  { label: 'VIP', value: '/pages/vip/vip' }
]

function parseActionConfig(actionConfig) {
  if (!actionConfig) return {}
  try {
    return JSON.parse(actionConfig)
  } catch {
    return {}
  }
}

function getActionTypeLabel(actionType) {
  const fallback = {
    NAVIGATE: '小程序内跳转',
    ACTIVITY: '活动详情页',
    CLAIM_GIFT: '领取礼品包',
    EXTERNAL: '外部链接',
    NONE: '无动作'
  }
  return bannerActionTypeDict.label(actionType) || fallback[actionType] || actionType || '未设置'
}

function getActionTypeTagType(actionType) {
  return bannerActionTypeDict.tagType(actionType)
}

function getClaimLimitLabel(actionConfig) {
  const parsedConfig = parseActionConfig(actionConfig)
  return bannerClaimLimitDict.label(parsedConfig.limit || 'ONCE')
}

function getClaimLimitTagType(actionConfig) {
  const parsedConfig = parseActionConfig(actionConfig)
  return bannerClaimLimitDict.tagType(parsedConfig.limit || 'ONCE')
}

function getGiftPackageCode(actionConfig) {
  const parsedConfig = parseActionConfig(actionConfig)
  return parsedConfig.giftPackageCode || parsedConfig.packageCode || '-'
}

function getBannerCode(row) {
  const parsedConfig = parseActionConfig(row.actionConfig)
  return parsedConfig.banner_code || parsedConfig.bannerCode || `banner_${row.id}`
}

async function load() {
  loading.value = true
  try {
    list.value = (await request.get('/admin/banners')) || []
    giftPackages.value = (await request.get('/admin/gift-packages?activeOnly=true')) || []
  } finally {
    loading.value = false
  }
}

function openModal(row) {
  const parsedConfig = parseActionConfig(row?.actionConfig)
  form.value = row
    ? {
        ...row,
        giftPackageCode: parsedConfig.giftPackageCode || parsedConfig.packageCode || '',
        claimLimit: parsedConfig.limit || 'ONCE',
        bannerCode: parsedConfig.banner_code || parsedConfig.bannerCode || `banner_${row.id}`
      }
    : {
        imageUrl: '',
        bgColor: '',
        sortOrder: 1,
        linkType: 'NONE',
        linkValue: '',
        actionType: 'NAVIGATE',
        actionConfig: '',
        giftPackageCode: '',
        claimLimit: 'ONCE',
        bannerCode: ''
      }
  dialogVisible.value = true
}

async function save() {
  saving.value = true
  try {
    const payload = { ...form.value, title: 'Banner图片', subTitle: '', tagText: '' }
    if (payload.actionType === 'CLAIM_GIFT') {
      if (!payload.giftPackageCode) {
        ElMessage.error('请选择礼品包')
        return
      }
      const normalizedBannerCode = (payload.bannerCode || payload.giftPackageCode || '').trim()
      if (!normalizedBannerCode) {
        ElMessage.error('请填写活动标识')
        return
      }
      payload.actionConfig = JSON.stringify({
        giftPackageCode: payload.giftPackageCode,
        limit: payload.claimLimit || 'ONCE',
        banner_code: normalizedBannerCode
      })
    }
    delete payload.giftPackageCode
    delete payload.claimLimit
    delete payload.bannerCode
    if (payload.id) {
      await request.put(`/admin/banners/${payload.id}`, payload)
    } else {
      await request.post('/admin/banners', payload)
    }
    ElMessage.success('保存成功')
    dialogVisible.value = false
    load()
  } catch {
    ElMessage.error('保存失败')
  } finally {
    saving.value = false
  }
}

async function toggle(row) {
  await request.post(`/admin/banners/${row.id}/toggle`)
  ElMessage.success(row.status ? '已停用' : '已启用')
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
    ElMessage.error('裁剪器未就绪')
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
      ElMessage.success('上传成功')
    } else {
      ElMessage.error('上传失败')
    }
  } catch (e) {
    console.error('Upload failed:', e)
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
  width: 171.5px;
  height: 72px;
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
