<template>
  <div>
    <el-card shadow="never" style="margin-bottom:16px">
      <el-button type="primary" @click="openModal(null)"><el-icon><Plus/></el-icon> 新增活动</el-button>
    </el-card>

    <el-card shadow="never">
      <el-table :data="list" v-loading="loading" stripe>
        <el-table-column prop="activityCode" label="活动编码" width="150" />
        <el-table-column prop="title" label="活动标题" min-width="200" />
        <el-table-column label="活动类型" width="100">
          <template #default="{row}">
            <el-tag size="small" :type="getActivityTypeColor(row.activityType)">
              {{ getActivityTypeLabel(row.activityType) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="活动描述" min-width="200" show-overflow-tooltip />
        <el-table-column label="名额" width="120">
          <template #default="{row}">
            <span v-if="row.totalQuota > 0">
              剩余 {{ row.remainQuota }} / {{ row.totalQuota }}
            </span>
            <span v-else>无限制</span>
          </template>
        </el-table-column>
        <el-table-column label="时间范围" width="200">
          <template #default="{row}">
            <div style="font-size: 12px;">
              <div>{{ row.startAt }}</div>
              <div>{{ row.endAt }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="90">
          <template #default="{row}">
            <el-tag :type="row.status ? 'success' : 'info'" size="small">
              {{ row.status ? '上线' : '下线' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{row}">
            <el-button size="small" @click="openModal(row)">编辑</el-button>
            <el-button size="small" :type="row.status ? 'danger':'success'" @click="toggleStatus(row)">
              {{ row.status ? '下线' : '上线' }}
            </el-button>
            <el-button size="small" type="danger" @click="deleteItem(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 新增/编辑弹窗 -->
    <el-dialog v-model="dialogVisible" :title="form.id ? '编辑活动' : '新增活动'" width="700px">
      <el-form :model="form" label-width="120px">
        <el-form-item label="活动编码">
          <el-input v-model="form.activityCode" placeholder="例如：new_user_gift" :disabled="!!form.id" />
          <div style="font-size:12px;color:#999;margin-top:4px">活动唯一标识，创建后不可修改</div>
        </el-form-item>

        <el-form-item label="活动标题">
          <el-input v-model="form.title" placeholder="例如：新人专享礼包" />
        </el-form-item>

        <el-form-item label="活动描述">
          <el-input v-model="form.description" type="textarea" :rows="3" placeholder="活动的简短描述（用于列表展示）" />
        </el-form-item>

        <el-form-item label="活动封面">
          <el-input v-model="form.coverImage" placeholder="活动封面图URL" />
        </el-form-item>

        <el-form-item label="活动详情页">
          <div style="border: 1px solid #dcdfe6; border-radius: 4px;">
            <div ref="editorToolbar" style="border-bottom: 1px solid #dcdfe6;"></div>
            <div ref="editorContainer" style="height: 400px; overflow-y: auto;"></div>
          </div>
          <div style="font-size:12px;color:#999;margin-top:4px">
            使用富文本编辑器编写活动详情页内容，支持图片、文字、样式等
          </div>
        </el-form-item>

        <el-form-item label="操作按钮文案">
          <el-input v-model="form.buttonText" placeholder="例如：立即领取、立即开通" />
        </el-form-item>

        <el-form-item label="按钮动作">
          <el-select v-model="form.buttonAction" placeholder="请选择按钮动作">
            <el-option label="领取礼品" value="CLAIM" />
            <el-option label="小程序内跳转" value="NAVIGATE" />
            <el-option label="外部链接" value="EXTERNAL" />
          </el-select>
        </el-form-item>

        <el-form-item label="跳转URL" v-if="form.buttonAction === 'NAVIGATE' || form.buttonAction === 'EXTERNAL'">
          <el-input v-model="form.buttonUrl" placeholder="例如：/pages/vip/vip 或 https://example.com" />
        </el-form-item>

        <el-form-item label="活动类型">
          <el-select v-model="form.activityType" placeholder="请选择活动类型">
            <el-option label="礼品活动" value="GIFT" />
            <el-option label="折扣活动" value="DISCOUNT" />
            <el-option label="任务活动" value="TASK" />
          </el-select>
        </el-form-item>

        <el-form-item label="限制类型">
          <el-select v-model="form.limitType" placeholder="请选择限制类型">
            <el-option label="每人一次" value="ONCE" />
            <el-option label="每日一次" value="DAILY" />
            <el-option label="无限制" value="UNLIMITED" />
          </el-select>
        </el-form-item>

        <el-form-item label="总名额">
          <el-input-number v-model="form.totalQuota" :min="0" />
          <div style="font-size:12px;color:#999;margin-top:4px">0表示无限制</div>
        </el-form-item>

        <el-form-item label="剩余名额">
          <el-input-number v-model="form.remainQuota" :min="0" :max="form.totalQuota" />
        </el-form-item>

        <el-form-item label="开始时间">
          <el-date-picker
            v-model="form.startAt"
            type="datetime"
            placeholder="选择开始时间"
            value-format="YYYY-MM-DD HH:mm:ss"
          />
        </el-form-item>

        <el-form-item label="结束时间">
          <el-date-picker
            v-model="form.endAt"
            type="datetime"
            placeholder="选择结束时间"
            value-format="YYYY-MM-DD HH:mm:ss"
          />
        </el-form-item>

        <el-form-item label="礼品配置" v-if="form.activityType === 'GIFT'">
          <el-input v-model="form.giftItems" type="textarea" :rows="5" placeholder='JSON格式，例如：[{"gift_id": 1, "gift_type": "AI_QUOTA", "gift_value": 10}]' />
          <div style="font-size:12px;color:#999;margin-top:4px">
            礼品类型：AI_QUOTA（AI次数）、VIP_DAYS（会员天数）、COUPON（优惠券）
          </div>
        </el-form-item>

        <el-form-item label="折扣配置" v-if="form.activityType === 'DISCOUNT'">
          <el-input v-model="form.discountConfig" type="textarea" :rows="3" placeholder='JSON格式，例如：{"discount_rate": 0.8, "target_product": "vip"}' />
        </el-form-item>

        <el-form-item label="任务配置" v-if="form.activityType === 'TASK'">
          <el-input v-model="form.taskConfig" type="textarea" :rows="3" placeholder='JSON格式，例如：{"task_type": "share", "target_count": 3}' />
        </el-form-item>

        <el-form-item label="关联Banner">
          <el-select v-model="form.bannerId" placeholder="选择关联的Banner（可选）" clearable>
            <el-option
              v-for="banner in banners"
              :key="banner.id"
              :label="banner.title"
              :value="banner.id"
            />
          </el-select>
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
import { ref, onMounted, nextTick, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import request from '../utils/request'
import { createEditor, createToolbar } from '@wangeditor/editor'
import '@wangeditor/editor/dist/css/style.css'

const list = ref([])
const loading = ref(false)
const dialogVisible = ref(false)
const form = ref({})
const banners = ref([])
const editorToolbar = ref(null)
const editorContainer = ref(null)
let editor = null

async function load() {
  loading.value = true
  try {
    list.value = await request.get('/admin/activities') || []
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

async function loadBanners() {
  try {
    const data = await request.get('/admin/banners')
    banners.value = data || []
  } catch (e) {
    console.error('加载Banner失败', e)
  }
}

function openModal(row) {
  form.value = row ? { ...row } : {
    activityCode: '',
    title: '',
    description: '',
    coverImage: '',
    contentHtml: '',
    buttonText: '立即参与',
    buttonAction: 'CLAIM',
    buttonUrl: '',
    activityType: 'GIFT',
    limitType: 'ONCE',
    totalQuota: 0,
    remainQuota: 0,
    startAt: '',
    endAt: '',
    giftItems: '',
    discountConfig: '',
    taskConfig: '',
    bannerId: null,
    status: 1
  }
  dialogVisible.value = true

  // 等待DOM渲染后初始化编辑器
  nextTick(() => {
    initEditor()
  })
}

// 初始化富文本编辑器
function initEditor() {
  if (editor) {
    editor.destroy()
    editor = null
  }

  if (!editorContainer.value || !editorToolbar.value) return

  editor = createEditor({
    selector: editorContainer.value,
    html: form.value.contentHtml || '',
    config: {
      placeholder: '请输入活动详情页内容...',
      onChange(editor) {
        form.value.contentHtml = editor.getHtml()
      }
    },
    mode: 'default'
  })

  createToolbar({
    editor,
    selector: editorToolbar.value,
    config: {
      toolbarKeys: [
        'headerSelect',
        'bold',
        'italic',
        'underline',
        'color',
        'bgColor',
        '|',
        'fontSize',
        'fontFamily',
        'lineHeight',
        '|',
        'bulletedList',
        'numberedList',
        'todo',
        '|',
        'emotion',
        'insertLink',
        'uploadImage',
        '|',
        'justifyLeft',
        'justifyCenter',
        'justifyRight',
        '|',
        'undo',
        'redo'
      ]
    },
    mode: 'default'
  })
}

// 监听弹窗关闭，销毁编辑器
watch(dialogVisible, (newVal) => {
  if (!newVal && editor) {
    editor.destroy()
    editor = null
  }
})

async function save() {
  try {
    // 验证 JSON 格式
    if (form.value.giftItems && form.value.giftItems.trim()) {
      try {
        JSON.parse(form.value.giftItems)
      } catch (e) {
        ElMessage.error('礼品配置必须是有效的JSON格式')
        return
      }
    }
    if (form.value.discountConfig && form.value.discountConfig.trim()) {
      try {
        JSON.parse(form.value.discountConfig)
      } catch (e) {
        ElMessage.error('折扣配置必须是有效的JSON格式')
        return
      }
    }
    if (form.value.taskConfig && form.value.taskConfig.trim()) {
      try {
        JSON.parse(form.value.taskConfig)
      } catch (e) {
        ElMessage.error('任务配置必须是有效的JSON格式')
        return
      }
    }

    if (form.value.id) {
      await request.put(`/admin/activities/${form.value.id}`, form.value)
    } else {
      await request.post('/admin/activities', form.value)
    }
    ElMessage.success('保存成功')
    dialogVisible.value = false
    load()
  } catch (e) {
    console.error(e)
    ElMessage.error('保存失败：' + (e.message || '未知错误'))
  }
}

async function toggleStatus(row) {
  try {
    await request.put(`/admin/activities/${row.id}/status?status=${row.status ? 0 : 1}`)
    ElMessage.success(row.status ? '已下线' : '已上线')
    load()
  } catch (e) {
    console.error(e)
  }
}

async function deleteItem(row) {
  try {
    await ElMessageBox.confirm('确定要删除该活动吗？删除后用户将无法参与此活动。', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await request.delete(`/admin/activities/${row.id}`)
    ElMessage.success('删除成功')
    load()
  } catch (e) {
    if (e !== 'cancel') {
      console.error(e)
    }
  }
}

function getActivityTypeLabel(type) {
  const map = {
    'GIFT': '礼品',
    'DISCOUNT': '折扣',
    'TASK': '任务'
  }
  return map[type] || type
}

function getActivityTypeColor(type) {
  const map = {
    'GIFT': 'success',
    'DISCOUNT': 'warning',
    'TASK': 'primary'
  }
  return map[type] || ''
}

onMounted(() => {
  load()
  loadBanners()
})
</script>
