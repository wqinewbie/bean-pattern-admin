<template>
  <div>
    <el-card shadow="never" style="margin-bottom:16px">
      <el-button type="primary" @click="openModal(null)"><el-icon><Plus/></el-icon> 新增会员套餐</el-button>
    </el-card>
    <el-card shadow="never">
      <el-table :data="list" v-loading="loading" stripe>
        <el-table-column prop="packageCode" label="套餐代码" width="120" />
        <el-table-column prop="packageName" label="套餐名称" min-width="150" />
        <el-table-column label="价格" width="100">
          <template #default="{row}">¥{{ row.price }}</template>
        </el-table-column>
        <el-table-column label="原价" width="100">
          <template #default="{row}"><s>¥{{ row.originalPrice }}</s></template>
        </el-table-column>
        <el-table-column prop="durationDays" label="有效天数" width="100" />
        <el-table-column prop="aiQuotaGift" label="赠送AI次数" width="120" />
        <el-table-column prop="tag" label="标签" width="100" />
        <el-table-column prop="sortOrder" label="排序" width="80" />
        <el-table-column label="上架时间" width="170">
          <template #default="{row}">{{ row.shelfStartTime || '立即上架' }}</template>
        </el-table-column>
        <el-table-column label="下架时间" width="170">
          <template #default="{row}">{{ row.shelfEndTime || '永不下架' }}</template>
        </el-table-column>
        <el-table-column prop="purchaseLimit" label="限购次数" width="90">
          <template #default="{row}">{{ row.purchaseLimit || '-' }}</template>
        </el-table-column>
        <el-table-column label="仅会员可购" width="110">
          <template #default="{row}">
            <el-tag :type="row.vipOnly ? 'warning' : 'info'" size="small">{{ row.vipOnly ? '是' : '否' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="90">
          <template #default="{row}">
            <el-tag :type="row.isActive ? 'success' : 'info'" size="small">{{ row.isActive ? '启用' : '禁用' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{row}">
            <el-button size="small" @click="openModal(row)">编辑</el-button>
            <el-button size="small" :type="row.isActive ? 'danger':'success'" @click="toggleStatus(row)">
              {{ row.isActive ? '禁用' : '启用' }}
            </el-button>
            <el-button size="small" type="danger" @click="deleteItem(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
    <el-dialog v-model="dialogVisible" :title="form.id ? '编辑会员套餐' : '新增会员套餐'" width="600px">
      <el-form :model="form" label-width="120px">
        <el-form-item label="套餐代码">
          <el-input v-model="form.packageCode" placeholder="例如：month, quarter, year" :disabled="!!form.id" />
        </el-form-item>
        <el-form-item label="套餐名称">
          <el-input v-model="form.packageName" placeholder="例如：包月会员" />
        </el-form-item>
        <el-form-item label="有效天数">
          <el-input-number v-model="form.durationDays" :min="1" :max="365" />
        </el-form-item>
        <el-form-item label="价格(元)">
          <el-input-number v-model="form.price" :min="0" :precision="2" />
        </el-form-item>
        <el-form-item label="原价(元)">
          <el-input-number v-model="form.originalPrice" :min="0" :precision="2" />
        </el-form-item>
        <el-form-item label="赠送AI次数">
          <el-input-number v-model="form.aiQuotaGift" :min="0" />
        </el-form-item>
        <el-form-item label="标签">
          <el-input v-model="form.tag" placeholder="例如：首月特惠、最划算" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="form.sortOrder" :min="0" />
        </el-form-item>
        <el-form-item label="上架时间">
          <el-date-picker
            v-model="form.shelfStartTime"
            type="datetime"
            placeholder="选择上架时间（留空立即上架）"
            value-format="YYYY-MM-DD HH:mm:ss"
            clearable
            style="width:100%"
          />
          <div style="color:#999;font-size:12px;margin-top:4px">留空则立即上架</div>
        </el-form-item>
        <el-form-item label="下架时间">
          <el-date-picker
            v-model="form.shelfEndTime"
            type="datetime"
            placeholder="选择下架时间（留空永不下架）"
            value-format="YYYY-MM-DD HH:mm:ss"
            clearable
            style="width:100%"
          />
          <div style="color:#999;font-size:12px;margin-top:4px">留空则永不下架</div>
        </el-form-item>
        <el-form-item label="限购次数">
          <el-input-number v-model="form.purchaseLimit" :min="0" />
          <div style="color:#999;font-size:12px;margin-top:4px">每个用户最多购买次数，0或留空不限制</div>
        </el-form-item>
        <el-form-item label="仅会员可购">
          <el-switch v-model="form.vipOnly" />
          <span style="margin-left:8px;color:#999;font-size:12px">开启后仅已有会员身份的用户可购买此套餐</span>
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
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import request from '../utils/request'

const list = ref([])
const loading = ref(false)
const dialogVisible = ref(false)
const form = ref({})

async function load() {
  loading.value = true
  try {
    list.value = await request.get('/admin/vip-packages') || []
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

function openModal(row) {
  form.value = row ? { ...row } : {
    packageCode: '',
    packageName: '',
    durationDays: 30,
    price: 0,
    originalPrice: 0,
    aiQuotaGift: 10,
    tag: '',
    sortOrder: 0,
    isActive: true,
    shelfStartTime: null,
    shelfEndTime: null,
    purchaseLimit: null,
    vipOnly: false
  }
  dialogVisible.value = true
}

async function save() {
  try {
    if (form.value.id) {
      await request.put(`/admin/vip-packages/${form.value.id}`, form.value)
    } else {
      await request.post('/admin/vip-packages', form.value)
    }
    ElMessage.success('保存成功')
    dialogVisible.value = false
    load()
  } catch (e) {
    console.error(e)
  }
}

async function toggleStatus(row) {
  try {
    await request.put(`/admin/vip-packages/${row.id}/status?isActive=${!row.isActive}`)
    ElMessage.success(row.isActive ? '已禁用' : '已启用')
    load()
  } catch (e) {
    console.error(e)
  }
}

async function deleteItem(row) {
  try {
    await ElMessageBox.confirm('确定要删除该套餐吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await request.delete(`/admin/vip-packages/${row.id}`)
    ElMessage.success('删除成功')
    load()
  } catch (e) {
    if (e !== 'cancel') {
      console.error(e)
    }
  }
}

onMounted(load)
</script>
