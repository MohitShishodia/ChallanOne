import { fireEvent, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import Navbar from './Navbar'
import { renderWithRouter } from '../test/testUtils'

describe('Navbar', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('opens the Services menu with all three service links', () => {
    renderWithRouter(<Navbar />)

    const headerLinks = Array.from(document.querySelector('.nav-links').children)
    expect(headerLinks.findIndex((element) => element.textContent.includes('RC Details')))
      .toBeLessThan(headerLinks.findIndex((element) => element.textContent.includes('Services')))

    fireEvent.click(screen.getByText('Services'))

    const servicesMenu = within(screen.getByText('Services').closest('details'))
    expect(servicesMenu.getByRole('link', { name: 'Check Challan' })).toHaveAttribute('href', '/pay-challan')
    expect(servicesMenu.getByRole('link', { name: 'RC Details' })).toHaveAttribute('href', '/rc-details')
    expect(servicesMenu.getByRole('link', { name: 'Service History' })).toHaveAttribute('href', '/service-history')
    expect(screen.getAllByRole('link', { name: 'Check Challan' })).toHaveLength(2)
    expect(screen.getAllByRole('link', { name: 'RC Details' })).toHaveLength(2)
  })

  it('opens Services in the mobile navigation drawer', () => {
    vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
    renderWithRouter(<Navbar />)

    fireEvent.click(screen.getByRole('button', { name: 'Open menu' }))
    fireEvent.click(screen.getAllByText('Services').at(-1))

    const mobileMenu = within(screen.getByRole('dialog', { name: 'Navigation menu' }))
    expect(mobileMenu.getAllByRole('link', { name: 'Check Challan' })).toHaveLength(2)
    expect(mobileMenu.getAllByRole('link', { name: 'RC Details' })).toHaveLength(2)
    expect(mobileMenu.getByRole('link', { name: 'Service History' })).toHaveAttribute('href', '/service-history')

    fireEvent.click(screen.getByRole('button', { name: 'Close menu' }))
  })
})
