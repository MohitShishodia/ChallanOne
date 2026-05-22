import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import DataTable from './DataTable'

describe('DataTable', () => {
  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Name' },
    { key: 'status', label: 'Status' }
  ]

  const data = [
    { id: '1', name: 'Alice', status: 'active' },
    { id: '2', name: 'Bob', status: 'pending' }
  ]

  it('renders column headers', () => {
    render(<DataTable columns={columns} data={data} />)
    expect(screen.getByText('ID')).toBeInTheDocument()
    expect(screen.getByText('Name')).toBeInTheDocument()
    expect(screen.getByText('Status')).toBeInTheDocument()
  })

  it('renders row data', () => {
    render(<DataTable columns={columns} data={data} />)
    expect(screen.getByText('Alice')).toBeInTheDocument()
    expect(screen.getByText('Bob')).toBeInTheDocument()
  })

  it('shows empty message when no data', () => {
    render(<DataTable columns={columns} data={[]} emptyMessage="No records found" />)
    expect(screen.getByText('No records found')).toBeInTheDocument()
  })
})
