import { describe, it, expect } from 'vitest'
import { apiUrl } from './api'

describe('admin apiUrl', () => {
  it('prefixes path with base URL', () => {
    const url = apiUrl('/api/admin/challans')
    expect(url).toContain('/api/admin/challans')
  })

  it('handles paths without leading slash edge case', () => {
    expect(apiUrl('api/admin/dashboard')).toContain('api/admin/dashboard')
  })
})
