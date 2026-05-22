import { describe, it, expect } from 'vitest'
import {
  FLOW_TYPES,
  getChallanDisplayType,
  shouldShowExternalChallan,
  transformExternalChallans,
  calculatePaymentTotal,
  formatChallanDate
} from './challanUtils'

describe('challanUtils - FLOW_TYPES', () => {
  it('defines all flow types', () => {
    expect(FLOW_TYPES.SELECT).toBe('SELECT')
    expect(FLOW_TYPES.DELHI_OTP).toBe('DELHI_OTP')
    expect(FLOW_TYPES.ALL_CHALLANS).toBe('ALL_CHALLANS')
  })
})

describe('challanUtils - shouldShowExternalChallan', () => {
  it('hides virtual court challans', () => {
    expect(shouldShowExternalChallan({ sentToVirtualCourt: true, challanStatus: 'pending' })).toBe(false)
  })

  it('hides paid and disposed', () => {
    expect(shouldShowExternalChallan({ challanStatus: 'paid' })).toBe(false)
    expect(shouldShowExternalChallan({ challanStatus: 'disposed' })).toBe(false)
  })

  it('shows pending unpaid', () => {
    expect(shouldShowExternalChallan({ challanStatus: 'pending' })).toBe(true)
  })
})

describe('challanUtils - getChallanDisplayType', () => {
  it('returns Court Challan when courtChallan is true', () => {
    expect(getChallanDisplayType({ courtChallan: true, challanType: 'ONLINE' })).toBe('Court Challan')
  })

  it('returns Physical Challan for OFFLINE', () => {
    expect(getChallanDisplayType({ courtChallan: false, challanType: 'OFFLINE' })).toBe('Physical Challan')
  })

  it('returns E-Challan for ONLINE', () => {
    expect(getChallanDisplayType({ courtChallan: false, challanType: 'ONLINE' })).toBe('E-Challan')
  })
})

describe('challanUtils - transformExternalChallans', () => {
  const apiResult = {
    success: true,
    source: 'CHALLANWALA',
    vehicleNumber: 'UP32AB1234',
    data: {
      pendingChallans: [
        {
          challanNumber: 'CH-001',
          amount: 500,
          challanStatus: 'pending',
          challanType: 'ONLINE',
          challanPlace: 'Lucknow',
          challanDate: '2024-05-01T10:00:00',
          sentToVirtualCourt: false,
          courtChallan: false
        },
        {
          challanNumber: 'CH-002',
          amount: 1000,
          challanStatus: 'pending',
          challanType: 'OFFLINE',
          challanPlace: 'Court',
          sentToVirtualCourt: true,
          courtChallan: false
        }
      ],
      paidChallans: [
        {
          challanNumber: 'CH-003',
          amount: 200,
          challanStatus: 'paid',
          challanType: 'ONLINE'
        }
      ],
      disposedChallans: []
    }
  }

  it('filters virtual court and paid challans', () => {
    const result = transformExternalChallans(apiResult)
    expect(result.challans).toHaveLength(1)
    expect(result.challans[0].id).toBe('CH-001')
    expect(result.pendingCount).toBe(1)
  })

  it('sets vehicle from API response', () => {
    const result = transformExternalChallans(apiResult)
    expect(result.vehicle.number).toBe('UP32AB1234')
  })

  it('marks hasRawChallans when any challan exists', () => {
    const result = transformExternalChallans(apiResult)
    expect(result.hasRawChallans).toBe(true)
  })
})

describe('challanUtils - calculatePaymentTotal', () => {
  it('sums amount, court fees, and convenience fee', () => {
    const challans = [
      { amount: 500, courtFee: 0 },
      { amount: 1000, courtFee: 50 }
    ]
    const totals = calculatePaymentTotal(challans, 20)
    expect(totals.subtotal).toBe(1500)
    expect(totals.courtFeeTotal).toBe(50)
    expect(totals.total).toBe(1570)
  })
})

describe('challanUtils - formatChallanDate', () => {
  it('returns N/A for empty input', () => {
    expect(formatChallanDate(null)).toBe('N/A')
  })
})
