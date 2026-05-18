<template>
  <div>
    <el-card shadow="never" style="margin-bottom:16px">
      <el-select v-model="filterStatus" placeholder="订单状态" clearable @change="load" style="width:160px">
        <el-option
          v-for="item in orderStatusDict?.optionsWithAll?.value || []"
          :key="item.value"
          :label="item.label"
          :value="item.value"
        />
      </el-select>
    </el-card>
    <el-card shadow="never">
      <el-table :data="list" v-loading="loading" stripe>
        <el-table-column prop="orderNo" label="订单号" width="160" />
        <el-table-column prop="userName" label="用户" width="120" />
        <el-table-column prop="planName" label="套餐" width="120" />
        <el-table-column label="金额" width="90">
          <template #default="{row}">¥{{ row.amount }}</template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{row}">
            <el-tag :type="orderStatusDict?.tagType?.(row.status) || 'info'" size="small">
              {{ orderStatusDict?.label?.(row.status) || '-' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="paidAt" label="支付时间" width="160">
          <template #default="{row}">
            {{ formatTime(row.paidAt) }}
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="160">
          <template #default="{row}">
            {{ formatTime(row.createdAt) }}
          </template>
        </el-table-column>
      </el-table>
      <div style="margin-top:16px;display:flex;justify-content:flex-end">
        <el-pagination v-model:current-page="page" v-model:page-size="pageSize" :total="total" layout="total, prev, pager, next" @change="load" />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { DICT_TYPE } from '../constants/dict'
import { useDict } from '../composables/useDict'
import request from '../utils/request'
import { formatTime } from '../utils/format'

const list = ref([])
const loading = ref(false)
const total = ref(0)
const page = ref(1)
const pageSize = ref(10)
const filterStatus = ref('')
const orderStatusDict = useDict(DICT_TYPE.ORDER_STATUS)

async function load() {
  loading.value = true
  try {
    const data = await request.get('/admin/orders', { params: { page: page.value, pageSize: pageSize.value, status: filterStatus.value } })
    list.value = data.list || []
    total.value = data.total || 0
  } catch (e) { console.error('Orders load failed:', e) } finally { loading.value = false }
}

onMounted(load)
</script>
