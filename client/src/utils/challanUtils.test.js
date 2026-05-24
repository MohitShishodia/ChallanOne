import { describe, it, expect } from 'vitest'
import {
  FLOW_TYPES,
  getChallanDisplayType,
  shouldExcludeChallan,
  shouldShowExternalChallan,
  transformExternalChallans,
  calculatePaymentTotal,
  sumChallanFineAmounts,
  formatChallanDate,
  getNoticeId,
  getOffenceDetails,
  resolveChallanStatus,
  mapChallanRecord
} from './challanUtils'

describe('challanUtils - FLOW_TYPES', () => {
  it('defines all flow types', () => {
    expect(FLOW_TYPES.SELECT).toBe('SELECT')
    expect(FLOW_TYPES.DELHI_OTP).toBe('DELHI_OTP')
    expect(FLOW_TYPES.ALL_CHALLANS).toBe('ALL_CHALLANS')
  })
})

describe('challanUtils - shouldExcludeChallan', () => {
  it('hides virtual court challans', () => {
    expect(shouldExcludeChallan({ sentToVirtualCourt: true, challanStatus: 'pending' })).toBe(true)
  })

  it('shows paid challans', () => {
    expect(shouldExcludeChallan({ challanStatus: 'paid' })).toBe(false)
    expect(shouldShowExternalChallan({ challanStatus: 'paid' })).toBe(true)
  })

  it('shows pending unpaid', () => {
    expect(shouldExcludeChallan({ challanStatus: 'pending' })).toBe(false)
  })
})

describe('challanUtils - notice and offence mapping', () => {
  it('prefers notice fields over challan number', () => {
    expect(getNoticeId({ noticeNumber: 'NT-99', challanNumber: 'CH-1' })).toBe('NT-99')
  })

  it('maps offence details from API fields', () => {
    expect(getOffenceDetails({ offenceDetails: 'Red light jump' })).toBe('Red light jump')
    expect(getOffenceDetails({ offenseDetails: 'Not using Seat-belt' })).toBe('Not using Seat-belt')
    expect(getOffenceDetails({ violationType: 'Overspeed' })).toBe('Overspeed')
  })

  it('resolves PAID status', () => {
    expect(resolveChallanStatus({ paymentStatus: 'PAID' })).toBe('PAID')
    expect(resolveChallanStatus({ challanStatus: 'pending' })).toBe('PENDING')
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
          noticeNumber: 'NT-001',
          challanNumber: 'CH-001',
          amount: 500,
          challanStatus: 'pending',
          challanType: 'ONLINE',
          challanPlace: 'Lucknow',
          challanDate: '2024-05-01T10:00:00',
          offenceDetails: 'Signal violation',
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
          noticeNumber: 'NT-003',
          challanNumber: 'CH-003',
          amount: 200,
          challanStatus: 'paid',
          challanType: 'ONLINE',
          offenceDetails: 'Parking violation'
        }
      ],
      disposedChallans: []
    }
  }

  it('filters virtual court but includes paid challans', () => {
    const result = transformExternalChallans(apiResult)
    expect(result.challans).toHaveLength(2)
    expect(result.challans[0].noticeId).toBe('NT-001')
    expect(result.challans[0].offenceDetails).toBe('Signal violation')
    expect(result.challans[0].time).toBeTruthy()
    expect(result.pendingCount).toBe(1)
    expect(result.paidCount).toBe(1)
    expect(result.challans.find((c) => c.status === 'PAID')?.noticeId).toBe('NT-003')
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

describe('challanUtils - mapChallanRecord', () => {
  it('uses notice id as selection id', () => {
    const mapped = mapChallanRecord({ noticeNumber: 'NT-55', amount: 100 }, 'DL01', 0)
    expect(mapped.id).toBe('NT-55')
    expect(mapped.noticeId).toBe('NT-55')
  })

  it('maps court details from API', () => {
    const mapped = mapChallanRecord(
      {
        noticeNumber: 'NT-1',
        amount: 1000,
        courtChallan: true,
        courtName: 'Rohini Court',
        courtAddress: 'Rohini Courts, Delhi',
        sentToRegCourt: true,
        challanPlace: 'ROAD NO.28'
      },
      'DL01',
      0
    )
    expect(mapped.courtName).toBe('Rohini Court')
    expect(mapped.courtAddress).toBe('Rohini Courts, Delhi')
    expect(mapped.location).toBe('ROAD NO.28')
    expect(mapped.sentToRegCourt).toBe(true)
  })
})

describe('challanUtils - sumChallanFineAmounts', () => {
  it('sums fine amounts only', () => {
    expect(sumChallanFineAmounts([{ amount: 500 }, { amount: 1000 }])).toBe(1500)
  })
})

describe('challanUtils - calculatePaymentTotal', () => {
  it('excludes court fees by default', () => {
    const challans = [
      { amount: 500, courtFee: 0 },
      { amount: 1000, courtFee: 50 }
    ]
    const totals = calculatePaymentTotal(challans, 20)
    expect(totals.subtotal).toBe(1500)
    expect(totals.courtFeeTotal).toBe(0)
    expect(totals.total).toBe(1520)
  })

  it('includes court fees when requested', () => {
    const challans = [{ amount: 1000, courtFee: 50 }]
    const totals = calculatePaymentTotal(challans, 20, { includeCourtFees: true })
    expect(totals.courtFeeTotal).toBe(50)
    expect(totals.total).toBe(1070)
  })
})

describe('challanUtils - formatChallanDate', () => {
  it('returns N/A for empty input', () => {
    expect(formatChallanDate(null)).toBe('N/A')
  })
})
