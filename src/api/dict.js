import request from '../utils/request'

export function getDictOptions(dictType) {
  return request.get('/admin/dict/options', { params: { dictType } })
}

export function getDictOptionsBatch(dictTypes) {
  return request.get('/admin/dict/options/batch', {
    params: { dictTypes: dictTypes.join(',') }
  })
}
