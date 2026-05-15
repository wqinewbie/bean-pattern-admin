/**
 * 格式化时间
 * @param {string|Date} time - 时间字符串或Date对象
 * @param {string} format - 格式类型: 'datetime'(默认) | 'date' | 'time'
 * @returns {string} 格式化后的时间字符串
 */
export function formatTime(time, format = 'datetime') {
  if (!time) return '-'

  const date = new Date(time)
  if (isNaN(date.getTime())) return '-'

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')

  if (format === 'date') {
    return `${year}-${month}-${day}`
  }

  if (format === 'time') {
    return `${hours}:${minutes}:${seconds}`
  }

  // datetime (默认)
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}
