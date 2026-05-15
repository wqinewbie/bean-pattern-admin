import { computed, ref } from 'vue'
import { getDictOptions, getDictOptionsBatch } from '../api/dict'

const dictCache = new Map()
const pendingRequests = new Map()

function normalizeOptions(options) {
  return Array.isArray(options) ? options : []
}

export async function loadDictOptions(dictType, force = false) {
  if (!force && dictCache.has(dictType)) {
    return dictCache.get(dictType)
  }

  if (!force && pendingRequests.has(dictType)) {
    return pendingRequests.get(dictType)
  }

  const request = getDictOptions(dictType)
    .then(options => {
      const normalized = normalizeOptions(options)
      dictCache.set(dictType, normalized)
      return normalized
    })
    .finally(() => pendingRequests.delete(dictType))

  pendingRequests.set(dictType, request)
  return request
}

export async function loadDictOptionsBatch(dictTypes, force = false) {
  const uniqueTypes = [...new Set(dictTypes.filter(Boolean))]
  const missedTypes = force ? uniqueTypes : uniqueTypes.filter(type => !dictCache.has(type))

  if (missedTypes.length) {
    const data = await getDictOptionsBatch(missedTypes)
    Object.entries(data || {}).forEach(([type, options]) => {
      dictCache.set(type, normalizeOptions(options))
    })
  }

  return uniqueTypes.reduce((result, type) => {
    result[type] = dictCache.get(type) || []
    return result
  }, {})
}

export function clearDictCache(dictType) {
  if (dictType) {
    dictCache.delete(dictType)
    return
  }
  dictCache.clear()
}

export function getDictLabel(options, value, fallback = '-') {
  const option = normalizeOptions(options).find(item => String(item.value) === String(value))
  return option?.label ?? fallback
}

export function getDictOption(options, value) {
  return normalizeOptions(options).find(item => String(item.value) === String(value)) || null
}

export function getDictTagType(options, value, fallback = 'info') {
  const option = getDictOption(options, value)
  return option?.tagType || option?.color || fallback
}

export function withAllOption(options, label = '全部', value = '') {
  return [{ label, value }, ...normalizeOptions(options)]
}

export function useDict(dictType, options = {}) {
  const list = ref([])
  const loading = ref(false)
  const error = ref(null)

  async function load(force = false) {
    loading.value = true
    error.value = null
    try {
      list.value = await loadDictOptions(dictType, force)
    } catch (err) {
      error.value = err
      list.value = []
    } finally {
      loading.value = false
    }
  }

  if (options.immediate !== false) {
    load()
  }

  return {
    options: list,
    optionsWithAll: computed(() => withAllOption(list.value, options.allLabel || '全部', options.allValue ?? '')),
    loading,
    error,
    load,
    label: value => getDictLabel(list.value, value, options.fallbackLabel || '-'),
    option: value => getDictOption(list.value, value),
    tagType: value => getDictTagType(list.value, value, options.fallbackTagType || 'info')
  }
}
