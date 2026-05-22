import { describe, it, expect, vi, afterEach } from 'vitest'
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  formatRelativeTime,
  formatNumber,
  truncate,
  capitalize
} from './formatters'

describe('admin formatters', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('formatCurrency formats INR amount', () => {
    const result = formatCurrency(1500)
    expect(result).toMatch(/1,?500|₹/)
  })

  it('formatCurrency handles zero', () => {
    expect(formatCurrency(0)).toBeTruthy()
  })

  it('formatDate returns em dash for empty', () => {
    expect(formatDate(null)).toBe('—')
  })

  it('formatDate formats valid date', () => {
    const result = formatDate('2024-06-15')
    expect(result).not.toBe('—')
  })

  it('formatDateTime returns em dash for empty', () => {
    expect(formatDateTime(undefined)).toBe('—')
  })

  it('formatRelativeTime returns Just now for recent', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-06-15T12:00:00'))
    expect(formatRelativeTime('2024-06-15T11:59:30')).toBe('Just now')
  })

  it('formatNumber abbreviates thousands', () => {
    expect(formatNumber(5500)).toBe('5.5K')
  })

  it('formatNumber abbreviates millions', () => {
    expect(formatNumber(2500000)).toBe('2.5M')
  })

  it('truncate shortens long strings', () => {
    const long = 'a'.repeat(50)
    expect(truncate(long, 10)).toBe('aaaaaaaaaa…')
  })

  it('truncate returns em dash for empty', () => {
    expect(truncate('')).toBe('—')
  })

  it('capitalize capitalizes first letter', () => {
    expect(capitalize('pending')).toBe('Pending')
  })

  it('capitalize returns empty for falsy', () => {
    expect(capitalize('')).toBe('')
  })
})
