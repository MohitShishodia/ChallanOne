import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Profile from './Profile'
import { renderWithRouter } from '../test/testUtils'

describe('Profile', () => {
  beforeEach(() => {
    localStorage.clear()
    const tokenPayload = btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600 }))
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
    localStorage.setItem('authToken', `header.${tokenPayload}.signature`)
    localStorage.setItem('user', JSON.stringify({
      id: 'user-1',
      name: 'Mohit Shishodia',
      email: 'mohit@example.com',
      phone: '9876543210',
    }))
    localStorage.setItem('challanone_payments', JSON.stringify([
      {
        id: 'payment-1',
        userId: 'user-1',
        userEmail: 'mohit@example.com',
        totalAmount: 1250,
        paidAt: '2026-10-12T10:00:00.000Z',
        vehicleNumber: 'UP32AB1234',
      },
      {
        id: 'payment-2',
        userEmail: 'other@example.com',
        totalAmount: 900,
        paidAt: '2026-10-10T10:00:00.000Z',
      },
    ]))
    globalThis.fetch = vi.fn().mockImplementation((_url, options = {}) => Promise.resolve({
      json: async () => options.method === 'PATCH'
        ? {
            success: true,
            user: { id: 'user-1', name: 'Mohit Updated', email: 'updated@example.com', phone: '9876543210' },
          }
        : { success: true, receipts: [] },
    }))
  })

  it('shows a payment overview without exposing vehicle or challan details', async () => {
    renderWithRouter(<Profile />, { route: '/profile', path: '/profile' })

    expect(await screen.findByText('Payments made')).toBeInTheDocument()
    expect(screen.getAllByText('₹1,250').length).toBeGreaterThan(0)
    expect(screen.getByText('Recent payments')).toBeInTheDocument()
    expect(screen.getByText('Challan payment')).toBeInTheDocument()
    expect(screen.queryByText('UP32AB1234')).not.toBeInTheDocument()
  })

  it('lets the user edit and save their profile details', async () => {
    const user = userEvent.setup()
    renderWithRouter(<Profile />, { route: '/profile', path: '/profile' })

    await user.click(screen.getByRole('button', { name: 'Edit' }))
    const editor = screen.getByRole('region', { name: 'Edit profile' })
    await user.clear(screen.getByLabelText('Full name'))
    await user.type(screen.getByLabelText('Full name'), 'Mohit Updated')
    await user.clear(screen.getByLabelText('Email address'))
    await user.type(screen.getByLabelText('Email address'), 'updated@example.com')
    await user.click(within(editor).getByRole('button', { name: 'Save changes' }))

    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({ name: 'Mohit Updated', email: 'updated@example.com' }),
      })
    )
    expect(await screen.findByText('Profile updated successfully')).toBeInTheDocument()
    expect(screen.getAllByRole('heading', { name: 'Mohit Updated' }).length).toBeGreaterThan(0)
  })

  it('does not show an itemized challan ledger', async () => {
    renderWithRouter(<Profile />, { route: '/profile?tab=pending', path: '/profile' })

    expect(await screen.findByText('We don’t keep a challan-by-challan profile ledger')).toBeInTheDocument()
    expect(screen.queryByText('UP32AB1234')).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Check challan/i })).toHaveAttribute('href', '/pay-challan')
  })
})
