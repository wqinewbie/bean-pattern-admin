<template>
  <div>
    <el-card shadow="never" style="margin-bottom:16px">
      <el-row :gutter="12">
        <el-col :span="8">
          <el-input v-model="q" placeholder="搜索昵称/手机号" clearable @input="handleSearch">
            <template #prefix><el-icon><Search/></el-icon></template>
          </el-input>
        </el-col>
        <el-col :span="4">
          <el-select v-model="filterVip" placeholder="VIP状态" clearable @change="load">
            <el-option
              v-for="item in vipStatusDict?.optionsWithAll || []"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-col>
        <el-col :span="4">
          <el-select v-model="filterStatus" placeholder="用户状态" clearable @change="load">
            <el-option
              v-for="item in userStatusDict?.optionsWithAll || []"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-col>
      </el-row>
    </el-card>
    <el-card shadow="never">
      <el-table :data="list" v-loading="loading" stripe>
        <el-table-column label="用户" min-width="160">
          <template #default="{row}">
            <div style="display:flex;align-items:center;gap:8px">
              <el-avatar size="small" :style="{background:'#7c6afe',color:'#fff'}">{{ row.nickName?.[0] }}</el-avatar>
              <div>
                <div style="font-weight:600">{{ row.nickName || '未设置' }}</div>
                <div style="font-size:11px;color:#8b90a7">#{{ row.id }}</div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="phone" label="手机号" width="170">
          <template #default="{row}">
            <div style="display:flex;align-items:center;gap:8px">
              <span>{{ row.phone || '未绑定' }}</span>
              <el-tag v-if="row.phone" type="success" size="small">已绑定</el-tag>
              <el-tag v-else type="warning" size="small">未绑定</el-tag>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="aiQuota" label="AI次数" width="80" />
        <el-table-column label="VIP" width="90">
          <template #default="{row}">
            <el-tag :type="vipStatusDict?.tagType?.(row.vipLevel ? 1 : 0) || 'info'" size="small">
              {{ vipStatusDict?.label?.(row.vipLevel ? 1 : 0) || '-' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="90">
          <template #default="{row}">
            <el-tag :type="userStatusDict?.tagType?.(row.status) || 'info'" size="small">
              {{ userStatusDict?.label?.(row.status) || '-' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="注册时间" width="160">
          <template #default="{row}">
            {{ formatTime(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{row}">
            <el-button size="small" :type="row.status ? 'danger' : 'success'" @click="toggleStatus(row)">
              {{ row.status ? '禁用' : '启用' }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      <div style="margin-top:16px;display:flex;justify-content:flex-end">
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="pageSize"
          :total="total"
          layout="total, prev, pager, next"
          @change="load"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { DICT_TYPE } from '../constants/dict'
import { useDict } from '../composables/useDict'
import request from '../utils/request'
import { formatTime } from '../utils/format'

const list = ref([])
const loading = ref(false)
const total = ref(0)
const page = ref(1)
const pageSize = ref(10)
const q = ref('')
const filterVip = ref('')
const filterStatus = ref('')
const vipStatusDict = useDict(DICT_TYPE.VIP_STATUS)
const userStatusDict = useDict(DICT_TYPE.USER_STATUS)
let searchTimer = null

async function load() {
  loading.value = true
  try {
    const data = await request.get('/admin/users', {
      params: { page: page.value, pageSize: pageSize.value, q: q.value, vipLevel: filterVip.value, status: filterStatus.value }
    })
    list.value = data.list || []
    total.value = data.total || 0
  } catch {} finally {
    loading.value = false
  }
}

function handleSearch() {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => { page.value = 1; load() }, 400)
}

async function toggleStatus(row) {
  const action = row.status ? '禁用' : '启用'
  await ElMessageBox.confirm(`确定要${action}用户「${row.nickName}」吗？`, '提示', { type: 'warning' })
  await request.post(`/admin/users/${row.id}/toggle-status`)
  ElMessage.success(`已${action}`)
  load()
}

onMounted(load)
</script>
