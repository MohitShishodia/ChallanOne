import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes, Link } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import ScrollToTop from './ScrollToTop'

describe('ScrollToTop', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('scrolls to the top when the route changes', () => {
    const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => {})

    render(
      <MemoryRouter initialEntries={['/about']}>
        <ScrollToTop />
        <Routes>
          <Route path="/about" element={<Link to="/support">Go to support</Link>} />
          <Route path="/support" element={<p>Support page</p>} />
        </Routes>
      </MemoryRouter>
    )

    scrollTo.mockClear()
    fireEvent.click(screen.getByRole('link', { name: 'Go to support' }))

    expect(screen.getByText('Support page')).toBeInTheDocument()
    expect(scrollTo).toHaveBeenCalledWith(0, 0)
  })
})