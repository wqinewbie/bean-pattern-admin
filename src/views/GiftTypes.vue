<template>
  <div>
    <el-card shadow="never" style="margin-bottom:16px">
      <div class="page-toolbar">
        <div class="page-tip">维护运营可发放的奖励类型，例如购会员卡优惠券、购次卡优惠券、会员体验卡等。</div>
        <el-button type="primary" @click="openModal(null)">新增礼品类型</el-button>
      </div>
    </el-card>

    <el-card shadow="never">
      <el-table :data="list" v-loading="loading" stripe>
        <el-table-column prop="sortOrder" label="排序" width="80" />
        <el-table-column prop="code" label="类型编码" width="160" />
        <el-table-column prop="name" label="类型名称" width="180" />
        <el-table-column prop="giftCategory" label="业务分类" width="120" />
        <el-table-column label="面值类型" width="120">
          <template #default="{ row }">{{ formatValueType(row.valueType) }}</template>
        </el-table-column>
        <el-table-column label="适用商品" width="120">
          <template #default="{ row }">{{ formatTargetProduct(row.targetProductType) }}</template>
        </el-table-column>
        <el-table-column prop="description" label="描述" min-width="220" show-overflow-tooltip />
        <el-table-column label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="giftStatusDict.tagType(row.status)" size="small">{{ giftStatusDict.label(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="openModal(row)">编辑</el-button>
            <el-button size="small" :type="row.status ? 'danger' : 'success'" @click="toggle(row)">{{ row.status ? '停用' : '启用' }}</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="form.id ? '编辑礼品类型' : '新增礼品类型'" width="680px">
      <el-form :model="form" label-width="110px">
        <el-form-item label="类型编码"><el-input v-model="form.code" :disabled="!!form.id" /></el-form-item>
        <el-form-item label="类型名称"><el-input v-model="form.name" /></el-form-item>
        <el-form-item label="业务分类"><el-input v-model="form.giftCategory" placeholder="如 COUPON / MEMBERSHIP / QUOTA" /></el-form-item>
        <el-form-item label="面值类型">
          <el-select v-model="form.valueType" style="width:100%">
            <el-option v-for="item in giftValueTypeDict.options.value" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="适用商品">
          <el-select v-model="form.targetProductType" style="width:100%">
            <el-option v-for="item in giftTargetProductDict.optionsWithAll.value" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="描述"><el-input v-model="form.description" type="textarea" :rows="3" /></el-form-item>
        <el-form-item label="排序"><el-input-number v-model="form.sortOrder" :min="0" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible=false">取消</el-button>
        <el-button type="primary" @click="save">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import request from '../utils/request'
import { DICT_TYPE } from '../constants/dict'
import { useDict } from '../composables/useDict'

const list = ref([])
const loading = ref(false)
const dialogVisible = ref(false)
const form = ref({})
const giftValueTypeDict = useDict(DICT_TYPE.GIFT_TYPE_VALUE_TYPE)
const giftTargetProductDict = useDict(DICT_TYPE.GIFT_TYPE_TARGET_PRODUCT)
const giftStatusDict = useDict(DICT_TYPE.GIFT_TYPE_STATUS)

async function load() {
  loading.value = true
  try {
    list.value = await request.get('/admin/gift-types') || []
  } finally {
    loading.value = false
  }
}

function openModal(row) {
  form.value = row ? { ...row } : {
    code: '', name: '', giftCategory: 'COUPON', valueType: 'discount', targetProductType: 'vip', description: '', sortOrder: 0, status: 1
  }
  dialogVisible.value = true
}

function formatValueType(type) {
  return giftValueTypeDict.label(type)
}

function formatTargetProduct(type) {
  return giftTargetProductDict.label(type)
}

async function save() {
  try {
    if (form.value.id) await request.put(`/admin/gift-types/${form.value.id}`, form.value)
    else await request.post('/admin/gift-types', form.value)
    ElMessage.success('保存成功')
    dialogVisible.value = false
    load()
  } catch (e) {
    ElMessage.error(e.message || '保存失败')
  }
}

async function toggle(row) {
  await request.post(`/admin/gift-types/${row.id}/toggle`)
  ElMessage.success(row.status ? '已停用' : '已启用')
  load()
}

onMounted(load)
</script>

<style scoped>
.page-toolbar { display:flex; align-items:center; justify-content:space-between; gap:16px; }
.page-tip { color:#909399; font-size:13px; }
</style>
