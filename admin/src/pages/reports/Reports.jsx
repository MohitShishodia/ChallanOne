// Reports & Analytics Page
import { useState, useEffect } from 'react'
import { Download, RefreshCw } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { formatCurrency, formatNumber } from '../../utils/formatters'
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from 'recharts'

export default function Reports() {
  const { authHeaders } = useAuth()
  const [period, setPeriod] = useState('monthly')
  const [revenueData, setRevenueData] = useState(null)
  const [customerData, setCustomerData] = useState(null)
  const [reconciliation, setReconciliation] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAll()
  }, [period])

  async function loadAll() {
    setLoading(true)
    try {
      const [revRes, custRes, reconcRes] = await Promise.all([
        fetch(`/api/admin/reports/revenue?period=${period}`, { headers: authHeaders() }),
        fetch('/api/admin/reports/customers', { headers: authHeaders() }),
        fetch('/api/admin/reports/reconciliation', { headers: authHeaders() })
      ])
      const [rev, cust, reconcData] = await Promise.all([revRes.json(), custRes.json(), reconcRes.json()])
      if (rev.success) setRevenueData(rev)
      if (cust.success) setCustomerData(cust)
      if (reconcData.success) setReconciliation(reconcData.summary)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const Tooltip_ = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null
    return (
      <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 8, padding: '8px 12px' }}>
        <p style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{label}</p>
        {payload.map(p => (
          <p key={p.name} style={{ fontSize: 13, fontWeight: 600, color: p.color }}>
            {p.name === 'revenue' ? formatCurrency(p.value) : formatNumber(p.value)}
          </p>
        ))}
      </div>
    )
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Reports & Insights</h1>
          <p className="page-subtitle">Platform analytics and financial reporting</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {['daily', 'monthly', 'yearly'].map(p => (
            <button key={p} className={`btn btn-sm ${period === p ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setPeriod(p)}>
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
          <button className="btn btn-secondary btn-sm" onClick={loadAll}>
            <RefreshCw size={13} />
          </button>
        </div>
      </div>

      {/* Revenue Summary Cards */}
      {revenueData && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
          {[
            { label: 'Total Revenue', value: formatCurrency(revenueData.totals?.revenue), color: '#2563eb', icon: '💰' },
            { label: 'Total Fees Collected', value: formatCurrency(revenueData.totals?.fees), color: '#10b981', icon: '📊' },
            { label: 'Total Transactions', value: formatNumber(revenueData.totals?.transactions), color: '#7c3aed', icon: '🔢' }
          ].map(item => (
            <div key={item.label} style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 12, padding: '20px 24px' }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>{item.icon}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: item.color }}>{item.value}</div>
              <div style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>{item.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Revenue Chart */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header"><span className="card-title">Revenue Over Time</span></div>
        <div className="card-body">
          {loading ? (
            <div className="skeleton" style={{ height: 260, borderRadius: 8 }} />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={revenueData?.data || []} margin={{ top: 5, right: 16, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="period" tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} tickFormatter={v => `₹${formatNumber(v)}`} />
                <Tooltip content={<Tooltip_ />} />
                <Legend />
                <Line type="monotone" dataKey="revenue" stroke="#2563eb" strokeWidth={2.5} dot={{ r: 3 }} name="revenue" />
                <Line type="monotone" dataKey="fees" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} name="fees" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Customer Acquisition */}
        <div className="card">
          <div className="card-header"><span className="card-title">Customer Acquisition</span></div>
          <div className="card-body">
            {loading ? (
              <div className="skeleton" style={{ height: 220, borderRadius: 8 }} />
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={customerData?.data?.slice(-12) || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="period" tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<Tooltip_ />} />
                  <Bar dataKey="newUsers" fill="#7c3aed" radius={[4, 4, 0, 0]} name="newUsers" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Reconciliation Summary */}
        <div className="card">
          <div className="card-header"><span className="card-title">Payment Reconciliation</span></div>
          <div className="card-body">
            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="skeleton" style={{ height: 36, borderRadius: 6 }} />
                ))}
              </div>
            ) : reconciliation && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { label: 'Total Transactions', value: formatNumber(reconciliation.totalTransactions), color: '#94a3b8' },
                  { label: 'Successful Payments', value: `${formatNumber(reconciliation.successful?.count)} (${formatCurrency(reconciliation.successful?.amount)})`, color: '#10b981' },
                  { label: 'Failed Payments', value: formatNumber(reconciliation.failed?.count), color: '#ef4444' },
                  { label: 'Refunded', value: `${formatNumber(reconciliation.refunded?.count)} (${formatCurrency(reconciliation.refunded?.amount)})`, color: '#f59e0b' },
                  { label: 'Net Revenue', value: formatCurrency(reconciliation.successful?.amount - (reconciliation.refunded?.amount || 0)), color: '#2563eb' }
                ].map(item => (
                  <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'var(--color-surface-2)', borderRadius: 8 }}>
                    <span style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>{item.label}</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: item.color }}>{item.value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
