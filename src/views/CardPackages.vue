<template>
  <div>
    <el-card shadow="never" style="margin-bottom:16px">
      <el-button type="primary" @click="openModal(null)"><el-icon><Plus/></el-icon> 新增次卡套餐</el-button>
    </el-card>
    <el-card shadow="never">
      <el-table :data="list" v-loading="loading" stripe>
        <el-table-column prop="packageCode" label="套餐代码" width="120" />
        <el-table-column prop="packageName" label="套餐名称" min-width="150" />
        <el-table-column prop="aiQuota" label="AI次数" width="100" />
        <el-table-column label="价格" width="100">
          <template #default="{row}">¥{{ row.price }}</template>
        </el-table-column>
        <el-table-column label="原价" width="100">
          <template #default="{row}"><s>¥{{ row.originalPrice }}</s></template>
        </el-table-column>
        <el-table-column label="会员价" width="100">
          <template #default="{row}">
            <span v-if="row.vipPrice" style="color:#f56c6c">¥{{ row.vipPrice }}</span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="tag" label="标签" width="100" />
        <el-table-column prop="sortOrder" label="排序" width="80" />
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
    <el-dialog v-model="dialogVisible" :title="form.id ? '编辑次卡套餐' : '新增次卡套餐'" width="600px">
      <el-form :model="form" label-width="120px">
        <el-form-item label="套餐代码">
          <el-input v-model="form.packageCode" placeholder="例如：c10, c30, c100" :disabled="!!form.id" />
        </el-form-item>
        <el-form-item label="套餐名称">
          <el-input v-model="form.packageName" placeholder="例如：10次AI生成" />
        </el-form-item>
        <el-form-item label="AI次数">
          <el-input-number v-model="form.aiQuota" :min="1" />
        </el-form-item>
        <el-form-item label="价格(元)">
          <el-input-number v-model="form.price" :min="0" :precision="2" />
        </el-form-item>
        <el-form-item label="原价(元)">
          <el-input-number v-model="form.originalPrice" :min="0" :precision="2" />
        </el-form-item>
        <el-form-item label="会员价(元)">
          <el-input-number v-model="form.vipPrice" :min="0" :precision="2" />
          <div style="color:#999;font-size:12px;margin-top:4px">会员用户购买时享受的优惠价格</div>
        </el-form-item>
        <el-form-item label="标签">
          <el-input v-model="form.tag" placeholder="例如：热销、超值" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="form.sortOrder" :min="0" />
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
    list.value = await request.get('/admin/card-packages') || []
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
    aiQuota: 10,
    price: 0,
    originalPrice: 0,
    vipPrice: 0,
    tag: '',
    sortOrder: 0,
    isActive: true
  }
  dialogVisible.value = true
}

async function save() {
  try {
    if (form.value.id) {
      await request.put(`/admin/card-packages/${form.value.id}`, form.value)
    } else {
      await request.post('/admin/card-packages', form.value)
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
    await request.put(`/admin/card-packages/${row.id}/status?isActive=${!row.isActive}`)
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
    await request.delete(`/admin/card-packages/${row.id}`)
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
