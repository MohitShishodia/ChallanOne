import { useEffect, useState } from 'react'
import {
  getRecentSearches,
  formatRecentSearchTime,
} from '../utils/recentSearches'

/**
 * Recent vehicle searches list (local to this device).
 *
 * @param {{
 *   type?: 'challan' | 'rc',
 *   onSelect: (vehicleNumber: string) => void,
 *   refreshKey?: number | string | boolean,
 *   limit?: number,
 *   className?: string,
 * }} props
 */
export default function RecentSearches({
  type,
  onSelect,
  refreshKey = 0,
  limit = 5,
  className = '',
}) {
  const [items, setItems] = useState([])
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    setItems(getRecentSearches({ type, limit: 20 }))
  }, [type, refreshKey])

  if (!items.length) return null

  const visible = expanded ? items : items.slice(0, limit)
  const canExpand = items.length > limit

  return (
    <div className={`surface-card overflow-hidden border-slate-200/80 ${className}`}>
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
        <h3 className="text-[14px] font-bold text-slate-900">Recent Searches</h3>
        {canExpand && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="text-[12px] font-semibold text-brand-red transition hover:text-red-700"
          >
            {expanded ? 'Show Less' : 'View All'}
          </button>
        )}
      </div>

      <ul className="divide-y divide-slate-100">
        {visible.map((item) => (
          <li key={`${item.vehicleNumber}-${item.searchedAt}`}>
            <button
              type="button"
              onClick={() => onSelect?.(item.vehicleNumber)}
              className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-slate-50 active:bg-red-50/40"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2m6-2a10 10 0 11-20 0 10 10 0 0120 0z" />
                </svg>
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-bold tracking-wide text-slate-900">
                  {item.vehicleNumber}
                </span>
                <span className="mt-0.5 block text-[11px] text-slate-400">
                  {formatRecentSearchTime(item.searchedAt)}
                </span>
              </span>
              <svg className="h-4 w-4 shrink-0 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function SearchLoadingButton({
  loading,
  children,
  loadingLabel = 'Searching…',
  className = '',
  type = 'button',
  ...props
}) {
  return (
    <button
      type={type}
      disabled={loading || props.disabled}
      className={`btn-primary w-full inline-flex items-center justify-center gap-2 ${className}`}
      {...props}
    >
      {loading ? (
        <>
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          {loadingLabel}
        </>
      ) : (
        children
      )}
    </button>
  )
}
