import { describe, it, expect } from 'vitest'
import { API_BASE_URL, API } from './api'

describe('client API config', () => {
  it('exposes auth endpoints', () => {
    expect(API.auth.login).toContain('/api/auth/login')
    expect(API.auth.sendOtp).toContain('/api/auth/send-otp')
  })

  it('builds challan URL with encoded vehicle number', () => {
    expect(API.challan('UP 32 AB')).toContain(encodeURIComponent('UP 32 AB'))
  })

  it('exposes Delhi OTP endpoints', () => {
    expect(API.delhiOtp.createRun).toContain('/api/delhi-otp/runs')
    expect(API.delhiOtp.getRun('run-abc')).toContain('/api/delhi-otp/runs/run-abc')
    expect(API.delhiOtp.submitAction('run-abc')).toContain('/api/delhi-otp/runs/run-abc/actions')
  })

  it('has payment endpoints', () => {
    expect(API.payment.createOrder).toContain('/api/payment/create-order')
    expect(API.payment.verify).toContain('/api/payment/verify')
  })

  it('API_BASE_URL is defined', () => {
    expect(API_BASE_URL).toBeTruthy()
  })
})
