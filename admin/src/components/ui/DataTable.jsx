// Reusable DataTable with sort, pagination, search
import { useState } from 'react'
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react'

export default function DataTable({
  columns = [],
  data = [],
  loading = false,
  pagination = null,
  onPageChange,
  onSort,
  sortField,
  sortOrder,
  emptyMessage = 'No data found',
  emptyIcon = '📋'
}) {
  const handleSort = (field) => {
    if (!onSort) return
    const newOrder = sortField === field && sortOrder === 'desc' ? 'asc' : 'desc'
    onSort(field, newOrder)
  }

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <ChevronsUpDown size={13} style={{ opacity: 0.3 }} />
    return sortOrder === 'asc'
      ? <ChevronUp size={13} style={{ color: 'var(--color-accent)' }} />
      : <ChevronDown size={13} style={{ color: 'var(--color-accent)' }} />
  }

  return (
    <div className="table-container">
      <div className="table-scroll">
        <table className="data-table">
          <thead>
            <tr>
              {columns.map(col => (
                <th
                  key={col.key}
                  className={col.sortable ? 'sortable' : ''}
                  onClick={() => col.sortable && handleSort(col.key)}
                  style={{ width: col.width }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    {col.label}
                    {col.sortable && <SortIcon field={col.key} />}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i}>
                  {columns.map((col, j) => (
                    <td key={j}>
                      <div className="skeleton" style={{ height: 16, width: '80%', borderRadius: 4 }} />
                    </td>
                  ))}
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length}>
                  <div className="empty-state">
                    <div style={{ fontSize: 36, marginBottom: 12 }}>{emptyIcon}</div>
                    <div className="empty-state-title">{emptyMessage}</div>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((row, i) => (
                <tr key={row.id || i}>
                  {columns.map(col => (
                    <td key={col.key}>
                      {col.render ? col.render(row[col.key], row) : (row[col.key] ?? '—')}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && (
        <div className="pagination">
          <span>
            Showing {Math.min((pagination.page - 1) * pagination.limit + 1, pagination.total)}–
            {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
          </span>
          <div className="pagination-btns">
            <button
              className="pagination-btn"
              disabled={pagination.page <= 1}
              onClick={() => onPageChange?.(pagination.page - 1)}
            >
              ← Prev
            </button>
            {Array.from({ length: Math.min(pagination.totalPages, 5) }, (_, i) => {
              const p = i + 1
              return (
                <button
                  key={p}
                  className={`pagination-btn ${pagination.page === p ? 'active' : ''}`}
                  onClick={() => onPageChange?.(p)}
                >
                  {p}
                </button>
              )
            })}
            <button
              className="pagination-btn"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => onPageChange?.(pagination.page + 1)}
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
