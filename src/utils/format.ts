export function formatTime(time: string | Date | null | undefined, format: 'datetime' | 'date' | 'time' = 'datetime'): string {
  if (!time) return '-'
  const date = new Date(time)
  if (isNaN(date.getTime())) return '-'

  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  const hh = String(date.getHours()).padStart(2, '0')
  const mm = String(date.getMinutes()).padStart(2, '0')
  const ss = String(date.getSeconds()).padStart(2, '0')

  if (format === 'date') return `${y}-${m}-${d}`
  if (format === 'time') return `${hh}:${mm}:${ss}`
  return `${y}-${m}-${d} ${hh}:${mm}:${ss}`
}
