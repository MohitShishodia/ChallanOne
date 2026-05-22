import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useDebounce } from './useDebounce'

describe('useDebounce', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('hello', 400))
    expect(result.current).toBe('hello')
  })

  it('updates debounced value after delay', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'a', delay: 400 } }
    )

    rerender({ value: 'ab', delay: 400 })
    expect(result.current).toBe('a')

    act(() => {
      vi.advanceTimersByTime(400)
    })

    expect(result.current).toBe('ab')
  })

  it('resets timer on rapid changes', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 300),
      { initialProps: { value: 'one' } }
    )

    rerender({ value: 'two' })
    act(() => vi.advanceTimersByTime(200))
    rerender({ value: 'three' })
    act(() => vi.advanceTimersByTime(200))
    expect(result.current).toBe('one')

    act(() => vi.advanceTimersByTime(100))
    expect(result.current).toBe('three')
  })
})
