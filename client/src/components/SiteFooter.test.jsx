import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import SiteFooter from './SiteFooter'

describe('SiteFooter', () => {
  it('links Contact Support to the support page', () => {
    render(
      <MemoryRouter>
        <SiteFooter />
      </MemoryRouter>
    )

    expect(screen.getByRole('link', { name: 'Contact Support' })).toHaveAttribute('href', '/support')
    expect(screen.getByText(/D-2, Ring Rd, Block D, Raja Garden/)).toBeInTheDocument()
    expect(screen.getByText(/New Delhi, Delhi, 110015/)).toBeInTheDocument()
  })
})
