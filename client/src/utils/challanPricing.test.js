import { describe, it, expect } from 'vitest'
import { resolveChallanAmount } from './challanPricing'
import { mapChallanRecord } from './challanUtils'

describe('challanPricing - resolveChallanAmount', () => {
  it('uses API amount when wasZeroAmount is false', () => {
    expect(resolveChallanAmount({ amount: 500, wasZeroAmount: false })).toBe(500)
    expect(resolveChallanAmount({ amount: 750 })).toBe(750)
  })

  it('applies fixed fines when wasZeroAmount is true', () => {
    expect(resolveChallanAmount({ amount: 0, wasZeroAmount: true, offenceDetails: 'Red light jump' })).toBe(1000)
    expect(resolveChallanAmount({ amount: 0, wasZeroAmount: true, offenceDetails: 'No entry violation' })).toBe(20000)
    expect(resolveChallanAmount({ amount: 0, wasZeroAmount: true, offenceDetails: 'Drink and drive' })).toBe(10000)
    expect(resolveChallanAmount({ amount: 0, wasZeroAmount: true, offenceDetails: 'Not using seat belt' })).toBe(1000)
    expect(resolveChallanAmount({ amount: 0, wasZeroAmount: true, offenceDetails: 'Overspeeding' })).toBe(2000)
  })
})

describe('challanUtils - zero amount mapping', () => {
  it('maps wasZeroAmount challans through mapChallanRecord', () => {
    const mapped = mapChallanRecord(
      {
        noticeNumber: 'NT-1',
        amount: 0,
        wasZeroAmount: true,
        offenceDetails: 'Signal jump at red light',
      },
      'DL01',
      0
    )
    expect(mapped.amount).toBe(1000)
  })
})
