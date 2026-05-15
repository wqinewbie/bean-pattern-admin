import request from '../utils/request'

export function getDictOptions(dictType) {
  return request.get('/admin/dict/options', { params: { dictType } })
}

export function getDictOptionsBatch(dictTypes) {
  return request.get('/admin/dict/options/batch', {
    params: { dictTypes: dictTypes.join(',') }
  })
}

export function getDictItems() {
  return request.get('/admin/dict/items')
}

export function getDictItem(id) {
  return request.get(`/admin/dict/items/${id}`)
}

export function createDictItem(data) {
  return request.post('/admin/dict/items', data)
}

export function updateDictItem(id, data) {
  return request.put(`/admin/dict/items/${id}`, data)
}

export function deleteDictItem(id) {
  return request.delete(`/admin/dict/items/${id}`)
}

export function reloadDictCache() {
  return request.post('/admin/dict/reload-cache')
}
