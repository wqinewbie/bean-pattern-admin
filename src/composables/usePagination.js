import { ref, watch } from 'vue'

/**
 * 统一分页状态管理
 * @param {Function} loadFn - 加载数据的异步函数
 * @param {Object} options
 * @param {number} options.pageSize - 默认每页条数 (默认 10)
 * @param {boolean} options.immediate - 是否立即加载 (默认 false，配合 onMounted 使用)
 */
export function usePagination(loadFn, { pageSize = 10 } = {}) {
  const page = ref(1)
  const size = ref(pageSize)
  const total = ref(0)
  const loading = ref(false)

  async function load() {
    loading.value = true
    try {
      await loadFn()
    } catch (e) {
      console.error('Pagination load failed:', e)
    } finally {
      loading.value = false
    }
  }

  function onPageChange(p) {
    page.value = p
    load()
  }

  function onSizeChange(s) {
    size.value = s
    page.value = 1
    load()
  }

  function refresh() {
    page.value = 1
    load()
  }

  return {
    page,
    pageSize: size,
    total,
    loading,
    load,
    onPageChange,
    onSizeChange,
    refresh
  }
}
