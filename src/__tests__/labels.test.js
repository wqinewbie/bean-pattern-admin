import { describe, it, expect } from 'vitest'
import { getSourceTypeLabel } from '../utils/labels'

describe('labels', () => {
  it('getSourceTypeLabel returns correct labels', () => {
    expect(getSourceTypeLabel('AI_GENERATE')).toBe('AI生成')
    expect(getSourceTypeLabel('IMAGE_CONVERT')).toBe('图片转换')
    expect(getSourceTypeLabel('BLANK_CANVAS')).toBe('空白画板')
  })

  it('getSourceTypeLabel returns unknown type as-is', () => {
    expect(getSourceTypeLabel('UNKNOWN')).toBe('UNKNOWN')
  })

  it('getSourceTypeLabel returns 未知 for falsy values', () => {
    expect(getSourceTypeLabel(null)).toBe('未知')
    expect(getSourceTypeLabel(undefined)).toBe('未知')
    expect(getSourceTypeLabel('')).toBe('未知')
  })
})
