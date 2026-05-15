<template>
  <div>
    <el-card shadow="never" style="margin-bottom:16px">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;">
        <div>
          <div style="font-size:16px;font-weight:700;">活动中心</div>
          <div style="font-size:12px;color:#909399;margin-top:4px;">活动中心是公共内容承接页，可被 Banner、弹窗、消息、任务等入口跳转；活动发奖只能绑定礼品包。</div>
        </div>
        <el-button type="primary" @click="openModal(null)"><el-icon><Plus/></el-icon> 新增活动</el-button>
      </div>
    </el-card>

    <el-card shadow="never">
      <el-table :data="list" v-loading="loading" stripe>
        <el-table-column prop="activityCode" label="活动编码" width="150" />
        <el-table-column prop="title" label="活动标题" min-width="200" />
        <el-table-column label="类型" width="100"><template #default="{row}"><el-tag size="small" :type="activityTypeDict.tagType(row.activityType)">{{ getActivityTypeLabel(row.activityType) }}</el-tag></template></el-table-column>
        <el-table-column label="礼品包" min-width="220"><template #default="{row}">{{ getGiftPackageLabel(row.giftPackageCode) }}</template></el-table-column>
        <el-table-column prop="description" label="活动描述" min-width="200" show-overflow-tooltip />
        <el-table-column label="名额" width="120"><template #default="{row}"><span v-if="row.totalQuota > 0">剩余 {{ row.remainQuota }} / {{ row.totalQuota }}</span><span v-else>无限制</span></template></el-table-column>
        <el-table-column label="时间范围" width="200"><template #default="{row}"><div style="font-size:12px;"><div>{{ row.startAt }}</div><div>{{ row.endAt }}</div></div></template></el-table-column>
        <el-table-column label="状态" width="90"><template #default="{row}"><el-tag :type="row.status ? 'success' : 'info'" size="small">{{ row.status ? '上线' : '下线' }}</el-tag></template></el-table-column>
        <el-table-column label="操作" width="200" fixed="right"><template #default="{row}"><el-button size="small" @click="openModal(row)">编辑</el-button><el-button size="small" :type="row.status ? 'danger':'success'" @click="toggleStatus(row)">{{ row.status ? '下线' : '上线' }}</el-button><el-button size="small" type="danger" @click="deleteItem(row)">删除</el-button></template></el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="form.id ? '编辑活动' : '新增活动'" width="760px">
      <el-form :model="form" label-width="120px">
        <el-form-item label="活动编码"><el-input v-model="form.activityCode" placeholder="例如：new_user_gift" :disabled="!!form.id" /><div class="form-help">活动唯一标识，供 Banner/弹窗等入口跳转使用。</div></el-form-item>
        <el-form-item label="活动标题"><el-input v-model="form.title" /></el-form-item>
        <el-form-item label="活动描述"><el-input v-model="form.description" type="textarea" :rows="3" /></el-form-item>
        <el-form-item label="活动封面"><el-input v-model="form.coverImage" placeholder="活动封面图URL" /></el-form-item>

        <el-form-item label="活动类型">
          <el-radio-group v-model="form.activityType">
            <el-radio-button v-for="item in activityTypeDict.options" :key="item.value" :label="item.value">{{ item.label }}</el-radio-button>
          </el-radio-group>
          <div class="form-help">内容页只承接图文和跳转；礼品活动必须绑定礼品包。</div>
        </el-form-item>

        <el-form-item label="奖励礼品包" v-if="form.activityType === 'GIFT'" required>
          <el-select v-model="form.giftPackageCode" filterable placeholder="请选择礼品包" style="width:100%">
            <el-option v-for="pkg in giftPackages" :key="pkg.packageCode" :label="pkg.name + '（' + pkg.packageCode + '）'" :value="pkg.packageCode" />
          </el-select>
        </el-form-item>

        <el-form-item label="操作按钮文案"><el-input v-model="form.buttonText" placeholder="例如：立即领取、查看详情" /></el-form-item>
        <el-form-item label="按钮动作">
          <el-select v-model="form.buttonAction" placeholder="请选择按钮动作">
            <el-option v-for="item in activityButtonActionDict.options" :key="item.value" :label="item.label" :value="item.value" :disabled="item.value === 'CLAIM' && form.activityType !== 'GIFT'" />
          </el-select>
        </el-form-item>
        <el-form-item label="跳转URL" v-if="form.buttonAction === 'NAVIGATE' || form.buttonAction === 'EXTERNAL'"><el-input v-model="form.buttonUrl" placeholder="例如：/pages/vip/vip 或 https://example.com" /></el-form-item>

        <el-form-item label="活动详情页">
          <div style="border: 1px solid #dcdfe6; border-radius: 4px; width:100%;">
            <div ref="editorToolbar" style="border-bottom: 1px solid #dcdfe6;"></div>
            <div ref="editorContainer" style="height: 360px; overflow-y: auto;"></div>
          </div>
        </el-form-item>

        <el-form-item label="限制类型" v-if="form.activityType === 'GIFT'"><el-select v-model="form.limitType"><el-option v-for="item in activityLimitTypeDict.options" :key="item.value" :label="item.label" :value="item.value" /></el-select></el-form-item>
        <el-form-item label="总名额" v-if="form.activityType === 'GIFT'"><el-input-number v-model="form.totalQuota" :min="0" /><div class="form-help">0表示无限制</div></el-form-item>
        <el-form-item label="剩余名额" v-if="form.activityType === 'GIFT'"><el-input-number v-model="form.remainQuota" :min="0" :max="form.totalQuota || undefined" /></el-form-item>
        <el-form-item label="开始时间"><el-date-picker v-model="form.startAt" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" /></el-form-item>
        <el-form-item label="结束时间"><el-date-picker v-model="form.endAt" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" /></el-form-item>
      </el-form>

      <template #footer><el-button @click="dialogVisible=false">取消</el-button><el-button type="primary" @click="save">保存</el-button></template>
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
import { DICT_TYPE } from '../constants/dict'
import { useDict } from '../composables/useDict'

const list = ref([])
const loading = ref(false)
const dialogVisible = ref(false)
const form = ref({})
const giftPackages = ref([])
const editorToolbar = ref(null)
const editorContainer = ref(null)
let editor = null
const activityTypeDict = useDict(DICT_TYPE.ACTIVITY_TYPE)
const activityButtonActionDict = useDict(DICT_TYPE.ACTIVITY_BUTTON_ACTION)
const activityLimitTypeDict = useDict(DICT_TYPE.ACTIVITY_LIMIT_TYPE)

async function load() {
  loading.value = true
  try { list.value = await request.get('/admin/activities') || [] } finally { loading.value = false }
}
async function loadGiftPackages() { giftPackages.value = await request.get('/admin/gift-packages?activeOnly=true') || [] }

function openModal(row) {
  form.value = row ? { ...row, activityType: normalizeActivityType(row.activityType), giftPackageCode: row.giftPackageCode || '' } : {
    activityCode: '', title: '', description: '', coverImage: '', contentHtml: '', buttonText: '查看详情', buttonAction: 'NONE', buttonUrl: '', activityType: 'CONTENT', limitType: 'ONCE', totalQuota: 0, remainQuota: 0, startAt: '', endAt: '', giftPackageCode: '', status: true, pageType: 'RICH_TEXT'
  }
  dialogVisible.value = true
  nextTick(initEditor)
}

function normalizeActivityType(type) { return type === 'GIFT' ? 'GIFT' : 'CONTENT' }

function initEditor() {
  if (editor) { editor.destroy(); editor = null }
  if (!editorContainer.value || !editorToolbar.value) return
  editor = createEditor({ selector: editorContainer.value, html: form.value.contentHtml || '', config: { placeholder: '请输入活动详情页内容...', onChange(editor) { form.value.contentHtml = editor.getHtml() } }, mode: 'default' })
  createToolbar({ editor, selector: editorToolbar.value, config: { toolbarKeys: ['headerSelect','bold','italic','underline','color','bgColor','|','fontSize','fontFamily','lineHeight','|','bulletedList','numberedList','todo','|','emotion','insertLink','uploadImage','|','justifyLeft','justifyCenter','justifyRight','|','undo','redo'] }, mode: 'default' })
}

watch(dialogVisible, (open) => { if (!open && editor) { editor.destroy(); editor = null } })

async function save() {
  try {
    if (!form.value.activityCode?.trim()) return ElMessage.error('活动编码不能为空')
    if (!form.value.title?.trim()) return ElMessage.error('活动标题不能为空')
    if (form.value.activityType === 'GIFT' && !form.value.giftPackageCode) return ElMessage.error('礼品活动必须绑定礼品包')
    if (form.value.buttonAction === 'CLAIM' && form.value.activityType !== 'GIFT') return ElMessage.error('领取按钮只能用于礼品活动')
    const payload = { ...form.value, activityCode: form.value.activityCode.trim(), title: form.value.title.trim(), pageType: 'RICH_TEXT' }
    if (payload.activityType !== 'GIFT') { payload.giftPackageCode = null; payload.totalQuota = 0; payload.remainQuota = 0; payload.limitType = 'UNLIMITED' }
    if (payload.id) await request.put(`/admin/activities/${payload.id}`, payload)
    else await request.post('/admin/activities', payload)
    ElMessage.success('保存成功')
    dialogVisible.value = false
    load()
  } catch (e) {
    console.error(e)
    ElMessage.error('保存失败：' + (e.message || '未知错误'))
  }
}

async function toggleStatus(row) { await request.put(`/admin/activities/${row.id}/status?status=${row.status ? 0 : 1}`); ElMessage.success(row.status ? '已下线' : '已上线'); load() }
async function deleteItem(row) {
  try { await ElMessageBox.confirm('确定要删除该活动吗？删除后入口将无法跳转到该活动。', '提示', { type: 'warning' }); await request.delete(`/admin/activities/${row.id}`); ElMessage.success('删除成功'); load() } catch (e) { if (e !== 'cancel') console.error(e) }
}
function getActivityTypeLabel(type) { return activityTypeDict.label(type) }
function getGiftPackageLabel(code) { if (!code) return '—'; const matched = giftPackages.value.find(item => item.packageCode === code); return matched ? `${matched.name}（${matched.packageCode}）` : code }

onMounted(() => { load(); loadGiftPackages() })
</script>

<style scoped>
.form-help { font-size: 12px; color: #909399; line-height: 1.6; margin-top: 4px; }
</style>
