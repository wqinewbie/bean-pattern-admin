const SOURCE_TYPE_LABELS = {
  'AI_GENERATE': 'AI生成',
  'IMAGE_CONVERT': '图片转换',
  'BLANK_CANVAS': '空白画板',
}

export function getSourceTypeLabel(type) {
  return SOURCE_TYPE_LABELS[type] || type || '未知'
}
