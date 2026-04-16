<template>
  <div>
    <el-card shadow="never" style="margin-bottom:16px">
      <el-button type="primary" @click="openModal(null)"><el-icon><Plus/></el-icon> 新增教程</el-button>
    </el-card>

    <el-card shadow="never">
      <el-table :data="list" v-loading="loading" stripe>
        <el-table-column prop="sortOrder" label="排序" width="70" />
        <el-table-column prop="title" label="标题" min-width="140" />
        <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
        <el-table-column label="视频地址" min-width="200">
          <template #default="{row}">
            <span style="color:#409EFF;font-size:12px" :title="row.videoUrl">{{ row.videoUrl ? (row.videoUrl.length > 30 ? row.videoUrl.substring(0,30)+'...' : row.videoUrl) : '无' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="90">
          <template #default="{row}">
            <el-tag :type="row.status ? 'success' : 'info'" size="small">{{ row.status ? '上线' : '下线' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{row}">
            <el-button size="small" @click="openModal(row)">编辑</el-button>
            <el-button size="small" :type="row.status ? 'danger' : 'success'" @click="toggle(row)">{{ row.status ? '下线' : '上线' }}</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="form.id ? '编辑教程' : '新增教程'" width="620px">
      <el-form :model="form" label-width="90px">
        <el-form-item label="标题" required>
          <el-input v-model="form.title" placeholder="如：新手必看：如何拼出完美立体豆？" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="form.description" type="textarea" :rows="2" placeholder="简短描述教程内容" />
        </el-form-item>
        <el-form-item label="视频地址" required>
          <el-input v-model="form.videoUrl" placeholder="外部视频链接地址" />
          <div style="margin-top:8px;color:#909399;font-size:12px">
            支持微信视频号、B站等可直接访问的视频链接
          </div>
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="form.sortOrder" :min="1" :max="999" />
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
import { ElMessage } from 'element-plus'
import request from '../utils/request'

const list = ref([])
const loading = ref(false)
const dialogVisible = ref(false)
const form = ref({})

async function load() {
  loading.value = true
  try { list.value = await request.get('/admin/tutorials') || [] }
  catch {} finally { loading.value = false }
}

function openModal(row) {
  form.value = row
    ? { ...row }
    : { title: '', description: '', videoUrl: '', sortOrder: 1 }
  dialogVisible.value = true
}

async function save() {
  if (!form.value.title) {
    ElMessage.warning('请填写标题')
    return
  }
  if (!form.value.videoUrl) {
    ElMessage.warning('请填写视频地址')
    return
  }
  if (form.value.id) {
    await request.put(`/admin/tutorials/${form.value.id}`, form.value)
  } else {
    await request.post('/admin/tutorials', form.value)
  }
  ElMessage.success('保存成功')
  dialogVisible.value = false
  load()
}

async function toggle(row) {
  await request.post(`/admin/tutorials/${row.id}/toggle`)
  ElMessage.success(row.status ? '已下线' : '已上线')
  load()
}

onMounted(load)
</script>
