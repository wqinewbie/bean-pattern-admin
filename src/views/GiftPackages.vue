<template>
  <div>
    <el-card shadow="never" style="margin-bottom: 16px">
      <el-button type="primary" @click="openModal(null)">新增礼品包</el-button>
    </el-card>

    <el-card shadow="never">
      <el-table :data="list" v-loading="loading" stripe>
        <el-table-column prop="sortOrder" label="排序" width="80" />
        <el-table-column prop="packageCode" label="礼品包编码" width="180" />
        <el-table-column prop="name" label="名称" min-width="180" />
        <el-table-column prop="description" label="描述" min-width="220" show-overflow-tooltip />
        <el-table-column label="奖励内容" min-width="360">
          <template #default="{ row }">
            <div class="reward-tags">
              <el-tag v-for="(item, idx) in parseItems(row.itemsJson)" :key="idx" :type="tagType(item.type)">
                {{ giftTypeName(item.type) }} {{ formatGiftValue(item) }}
              </el-tag>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="row.status ? 'success' : 'info'">{{ row.status ? '启用' : '停用' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="openModal(row)">编辑</el-button>
            <el-button size="small" :type="row.status ? 'danger' : 'success'" @click="toggle(row)">
              {{ row.status ? '停用' : '启用' }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="form.id ? '编辑礼品包' : '新增礼品包'" width="860px">
      <el-form :model="form" label-width="110px">
        <el-form-item label="礼品包编码"><el-input v-model="form.packageCode" placeholder="例如：new_user_gift_pack" :disabled="!!form.id" /></el-form-item>
        <el-form-item label="名称"><el-input v-model="form.name" placeholder="例如：新人礼包" /></el-form-item>
        <el-form-item label="描述"><el-input v-model="form.description" type="textarea" :rows="2" /></el-form-item>
        <el-form-item label="排序"><el-input-number v-model="form.sortOrder" :min="0" /></el-form-item>

        <el-divider content-position="left">礼品明细</el-divider>
        <div class="reward-editor">
          <div v-for="(item, idx) in rewardItems" :key="idx" class="reward-row">
            <el-select v-model="item.type" filterable placeholder="选择礼品类型" style="width: 260px" @change="onTypeChange(item)">
              <el-option v-for="type in giftTypes" :key="type.code" :label="type.name + '（' + type.code + '）'" :value="type.code" />
            </el-select>
            <el-input-number v-model="item.value" :min="0" :step="valueStep(item)" :precision="valuePrecision(item)" />
            <span class="value-tip">{{ valueTip(item) }}</span>
            <el-button type="danger" link @click="removeReward(idx)">删除</el-button>
          </div>
          <el-button @click="addReward">添加礼品</el-button>
        </div>

        <el-divider content-position="left">高级模式（可选）</el-divider>
        <el-form-item>
          <el-switch v-model="advancedMode" active-text="手动编辑 JSON" inactive-text="使用明细表单" />
        </el-form-item>
        <el-form-item label="礼品明细JSON" v-if="advancedMode">
          <el-input v-model="form.itemsJson" type="textarea" :rows="8" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="save" :loading="saving">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import request from '../utils/request'

const list = ref([])
const giftTypes = ref([])
const loading = ref(false)
const dialogVisible = ref(false)
const saving = ref(false)
const advancedMode = ref(false)
const form = ref({})
const rewardItems = ref([])

function parseItems(itemsJson) {
  try {
    const arr = JSON.parse(itemsJson || '[]')
    return Array.isArray(arr) ? arr : []
  } catch {
    return []
  }
}

function giftType(typeCode) {
  return giftTypes.value.find(t => t.code === typeCode) || {}
}

function giftTypeName(typeCode) {
  return giftType(typeCode).name || typeCode
}

function formatGiftValue(item) {
  const type = giftType(item.type)
  if (type.valueType === 'discount') return `${item.value}折`
  if (type.valueType === 'days') return `${item.value}天`
  if (type.valueType === 'times') return `${item.value}次`
  return item.value
}

function tagType(typeCode) {
  const category = giftType(typeCode).giftCategory
  if (category === 'COUPON') return 'danger'
  if (category === 'MEMBERSHIP') return 'warning'
  if (category === 'QUOTA') return 'success'
  return 'primary'
}

function valueStep(item) {
  return giftType(item.type).valueType === 'discount' ? 0.1 : 1
}

function valuePrecision(item) {
  return giftType(item.type).valueType === 'discount' ? 1 : 0
}

function valueTip(item) {
  const type = giftType(item.type)
  if (type.valueType === 'discount') return '例如 8.5 表示 8.5 折'
  if (type.valueType === 'days') return '天'
  if (type.valueType === 'times') return '次'
  return ''
}

function onTypeChange(item) {
  if (!item.value) item.value = giftType(item.type).valueType === 'discount' ? 8.5 : 1
}

function addReward() {
  rewardItems.value.push({ type: giftTypes.value[0]?.code || '', value: 1 })
}

function removeReward(index) {
  rewardItems.value.splice(index, 1)
}

function buildItemsJson() {
  return JSON.stringify(rewardItems.value.filter(item => item.type && Number(item.value) > 0))
}

async function load() {
  loading.value = true
  try {
    giftTypes.value = await request.get('/admin/gift-types?activeOnly=true') || []
    list.value = await request.get('/admin/gift-packages') || []
  } finally {
    loading.value = false
  }
}

function openModal(row) {
  form.value = row ? { ...row } : { packageCode: '', name: '', description: '', itemsJson: '[]', sortOrder: 0, status: 1 }
  rewardItems.value = parseItems(form.value.itemsJson).map(item => ({ type: item.type || item.gift_type, value: Number(item.value ?? item.gift_value ?? 0) }))
  advancedMode.value = false
  dialogVisible.value = true
}

async function save() {
  saving.value = true
  try {
    if (!advancedMode.value) form.value.itemsJson = buildItemsJson()
    const parsed = JSON.parse(form.value.itemsJson || '[]')
    if (!Array.isArray(parsed) || !parsed.length) throw new Error('请至少配置一项礼品')
    if (form.value.id) await request.put(`/admin/gift-packages/${form.value.id}`, form.value)
    else await request.post('/admin/gift-packages', form.value)
    ElMessage.success('保存成功')
    dialogVisible.value = false
    load()
  } catch (e) {
    ElMessage.error(e.message || '保存失败')
  } finally {
    saving.value = false
  }
}

async function toggle(row) {
  await request.post(`/admin/gift-packages/${row.id}/toggle`)
  ElMessage.success(row.status ? '已停用' : '已启用')
  load()
}

onMounted(load)
</script>

<style scoped>
.reward-tags { display: flex; gap: 8px; flex-wrap: wrap; }
.reward-editor { display: flex; flex-direction: column; gap: 12px; margin-left: 110px; margin-bottom: 18px; }
.reward-row { display: flex; align-items: center; gap: 12px; }
.value-tip { color: #909399; font-size: 12px; min-width: 150px; }
</style>
