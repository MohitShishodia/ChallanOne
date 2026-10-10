import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import ChallanResults from './ChallanResults'

const challan = {
  id: 'UP123456789',
  noticeId: 'UP123456789',
  offenceDetails: 'Speed Limit Exceeded',
  amount: 500,
  status: 'PENDING',
  date: '29 Oct 2024',
  time: '08:51',
  location: 'Yamuna Expressway',
  displayType: 'E-Challan',
}

function renderChallanResults() {
  return render(
    <ChallanResults
      data={{
        vehicle: { number: 'UP32AB1234' },
        challans: [challan],
      }}
      selectedChallans={[]}
      onToggleChallan={vi.fn()}
      onSelectAllPending={vi.fn()}
      onDeselectAll={vi.fn()}
      onPay={vi.fn()}
      onBack={vi.fn()}
      paymentLoading={false}
      filters={{ activeTab: 'all' }}
      onFiltersChange={vi.fn()}
    />
  )
}

describe('ChallanResults', () => {
  it('renders challan results as compact cards with location and state', () => {
    const { container } = renderChallanResults()

    expect(screen.getByText('Speed Limit Exceeded')).toBeInTheDocument()
    expect(screen.getByText('Challan No:')).toBeInTheDocument()
    expect(screen.getByText('UP123456789')).toBeInTheDocument()
    expect(screen.getByText('UP')).toBeInTheDocument()
    expect(screen.getByText('Yamuna Expressway')).toBeInTheDocument()
    expect(container.querySelectorAll('.challan-result-card')).toHaveLength(1)
    expect(container.querySelector('.challan-violation-icon')).toHaveClass('h-12', 'w-12')
    expect(container.querySelector('.challan-violation-icon svg')).toHaveClass('h-6', 'w-6')
  })
})
