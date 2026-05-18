import { ref, type Ref } from 'vue'

interface PaginationOptions {
  pageSize?: number
}

interface PaginationResult {
  page: Ref<number>
  pageSize: Ref<number>
  total: Ref<number>
  loading: Ref<boolean>
  load: () => Promise<void>
  onPageChange: (p: number) => void
  onSizeChange: (s: number) => void
  refresh: () => void
}

export function usePagination(loadFn: () => Promise<void>, { pageSize = 10 }: PaginationOptions = {}): PaginationResult {
  const page = ref(1)
  const size = ref(pageSize)
  const total = ref(0)
  const loading = ref(false)

  async function load() {
    loading.value = true
    try { await loadFn() } catch (e) { console.error('Pagination load failed:', e) } finally { loading.value = false }
  }

  function onPageChange(p: number) { page.value = p; load() }
  function onSizeChange(s: number) { size.value = s; page.value = 1; load() }
  function refresh() { page.value = 1; load() }

  return { page, pageSize: size, total, loading, load, onPageChange, onSizeChange, refresh }
}
