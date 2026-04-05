<template>
  <div>
    <el-card shadow="never" style="margin-bottom:16px">
      <el-select v-model="filterStatus" placeholder="订单状态" clearable @change="load" style="width:160px">
        <el-option label="全部" value="" />
        <el-option label="已支付" value="PAID" />
        <el-option label="待支付" value="PENDING" />
        <el-option label="已退款" value="REFUNDED" />
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
            <el-tag :type="{PAID:'success',PENDING:'warning',REFUNDED:'danger'}[row.status]" size="small">
              {{ {PAID:'已支付',PENDING:'待支付',REFUNDED:'已退款'}[row.status] }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="paidAt" label="支付时间" width="160" />
        <el-table-column prop="createdAt" label="创建时间" width="160" />
      </el-table>
      <div style="margin-top:16px;display:flex;justify-content:flex-end">
        <el-pagination v-model:current-page="page" v-model:page-size="pageSize" :total="total" layout="total, prev, pager, next" @change="load" />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import request from '../utils/request'

const list = ref([])
const loading = ref(false)
const total = ref(0)
const page = ref(1)
const pageSize = ref(10)
const filterStatus = ref('')

async function load() {
  loading.value = true
  try {
    const data = await request.get('/admin/orders', { params: { page: page.value, pageSize: pageSize.value, status: filterStatus.value } })
    list.value = data.list || []
    total.value = data.total || 0
  } catch {} finally { loading.value = false }
}

onMounted(load)
</script>
