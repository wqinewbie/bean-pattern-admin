<template>
  <div>
    <el-card shadow="never" style="margin-bottom:16px">
      <el-button type="primary" @click="openModal(null)"><el-icon><Plus/></el-icon> 新增Banner</el-button>
    </el-card>

    <el-card shadow="never">
      <el-table :data="list" v-loading="loading" stripe>
        <el-table-column prop="sortOrder" label="排序" width="70" />
        <el-table-column prop="title" label="标题" min-width="140" />
        <el-table-column prop="subTitle" label="副标题" min-width="160" />
        <el-table-column prop="tagText" label="标签" width="100" />
        <el-table-column label="跳转" min-width="260">
          <template #default="{row}">
            <el-tag size="small" type="info" style="margin-right:8px">{{ row.linkType || 'NONE' }}</el-tag>
            <span style="color:#606266">{{ row.linkValue || '无' }}</span>
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

    <el-dialog v-model="dialogVisible" :title="form.id ? '编辑Banner' : '新增Banner'" width="620px">
      <el-form :model="form" label-width="90px">
        <el-form-item label="标题"><el-input v-model="form.title" /></el-form-item>
        <el-form-item label="副标题"><el-input v-model="form.subTitle" /></el-form-item>
        <el-form-item label="图片URL"><el-input v-model="form.imageUrl" /></el-form-item>
        <el-form-item label="标签"><el-input v-model="form.tagText" /></el-form-item>
        <el-form-item label="排序"><el-input-number v-model="form.sortOrder" :min="1" /></el-form-item>

        <el-form-item label="跳转类型">
          <el-select v-model="form.linkType" style="width:100%">
            <el-option label="不跳转（NONE）" value="NONE" />
            <el-option label="小程序页面（PAGE）" value="PAGE" />
            <el-option label="外链复制（URL）" value="URL" />
          </el-select>
        </el-form-item>

        <el-form-item label="跳转值" v-if="form.linkType === 'PAGE'">
          <div style="width:100%">
            <el-select v-model="form.linkValue" filterable allow-create default-first-option style="width:100%" placeholder="选择页面或手动输入带参数URL">
              <el-option v-for="item in pageOptions" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
            <div style="margin-top:8px;color:#909399;font-size:12px;line-height:1.6">
              <div><b>常用示例：</b><code>/pages/my-patterns/my-patterns</code></div>
              <div><b>带参数：</b><code>/pages/generate/generate?imageUrl=https%3A%2F%2Fxx.com%2Fa.png</code></div>
              <div>提示：参数里的链接请先 encodeURIComponent</div>
            </div>
          </div>
        </el-form-item>

        <el-form-item label="跳转值" v-else>
          <el-input v-model="form.linkValue" placeholder="按下方示例填写" />
          <div style="margin-top:8px;color:#909399;font-size:12px;line-height:1.6">
            <div v-if="form.linkType === 'URL'"><b>URL 示例：</b><code>https://mp.weixin.qq.com/s/xxxx</code>（小程序会复制链接）</div>
            <div v-else><b>NONE：</b>留空即可</div>
          </div>
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

const pageOptions = [
  { label: '首页', value: '/pages/home/home' },
  { label: '图片转图纸', value: '/pages/convert/convert' },
  { label: 'AI生成', value: '/pages/ai-generate/ai-generate' },
  { label: '我的', value: '/pages/profile/profile' },
  { label: '生成页', value: '/pages/generate/generate' },
  { label: '历史记录', value: '/pages/history/history' },
  { label: '我的图纸', value: '/pages/my-patterns/my-patterns' },
  { label: '空白画板', value: '/pages/draw/draw' },
  { label: '生成中', value: '/pages/generating/generating' },
  { label: '结果页', value: '/pages/result/result' },
  { label: '专注模式', value: '/pages/focus-mode/focus-mode' },
  { label: 'VIP', value: '/pages/vip/vip' }
]

async function load() {
  loading.value = true
  try { list.value = await request.get('/api/admin/banners') || [] }
  catch {} finally { loading.value = false }
}

function openModal(row) {
  form.value = row
    ? { ...row }
    : { title: '', subTitle: '', imageUrl: '', tagText: '', sortOrder: 1, linkType: 'NONE', linkValue: '' }
  dialogVisible.value = true
}

async function save() {
  if (form.value.id) {
    await request.put(`/api/admin/banners/${form.value.id}`, form.value)
  } else {
    await request.post('/api/admin/banners', form.value)
  }
  ElMessage.success('保存成功')
  dialogVisible.value = false
  load()
}

async function toggle(row) {
  await request.post(`/api/admin/banners/${row.id}/toggle`)
  ElMessage.success(row.status ? '已下线' : '已上线')
  load()
}

onMounted(load)
</script>
