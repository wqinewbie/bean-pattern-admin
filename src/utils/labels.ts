const SOURCE_TYPE_LABELS: Record<string, string> = {
  'AI_GENERATE': 'AI生成',
  'IMAGE_CONVERT': '图片转换',
  'BLANK_CANVAS': '空白画板',
}

export function getSourceTypeLabel(type: string | null | undefined): string {
  return (type && SOURCE_TYPE_LABELS[type]) || type || '未知'
}
