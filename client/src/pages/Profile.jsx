import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import { useAuth } from '../context/AuthContext'
import { API, API_BASE_URL } from '../config/api'
import { getUserPayments } from '../utils/userStorage'

const TABS = [
  { id: 'account', label: 'My Profile' },
  { id: 'pending', label: 'Pending Challans' },
  { id: 'payments', label: 'Payments Made' },
  { id: 'bookings', label: 'My Bookings' },
]

export default function Profile() {
  const { user, updateUser, logout } = useAuth()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const requestedTab = searchParams.get('tab')
  const activeTab = requestedTab === 'paid'
    ? 'payments'
    : !TABS.some((tab) => tab.id === requestedTab)
    ? 'account'
    : requestedTab

  const [form, setForm] = useState({ name: '', email: '' })
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [payments, setPayments] = useState([])
  const [editing, setEditing] = useState(false)

  useEffect(() => {
    if (!user) navigate('/login')
  }, [user, navigate])

  const fetchReceipts = useCallback(async () => {
    if (!user?.email) return
    try {
      const token = localStorage.getItem('authToken')
      const res = await fetch(`${API_BASE_URL}/api/payment/user-receipts`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      const data = await res.json()
      if (data.success && data.receipts?.length) {
        setPayments((prev) => {
          const userEmail = user.email.toLowerCase()
          const ownReceipts = data.receipts.filter(
            (receipt) => receipt.userEmail?.toLowerCase() === userEmail
          )
          const merged = [...ownReceipts, ...prev]
          const seen = new Set()
          return merged.filter((p) => {
            if (seen.has(p.id)) return false
            seen.add(p.id)
            return true
          })
        })
      }
    } catch {
      /* keep local */
    }
  }, [user?.email])

  useEffect(() => {
    if (user) {
      setForm({ name: user.name || '', email: user.email || '' })
      setPayments(getUserPayments().filter(
        (payment) => payment.userEmail?.toLowerCase() === user.email?.toLowerCase()
      ))
    }
    fetchReceipts()
  }, [user, fetchReceipts])

  const setTab = (id) => setSearchParams({ tab: id })

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setMessage('')
    const token = localStorage.getItem('authToken')
    try {
      const res = await fetch(API.auth.profile, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: form.name, email: form.email }),
      })
      const data = await res.json()
      if (data.success) {
        updateUser(data.user)
        setMessage('Profile updated successfully')
      } else {
        setMessage(data.message || 'Update failed')
      }
    } catch {
      setMessage('Could not update profile. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  if (!user) {
    return (
      <div className="screen">
        <PageHeader title="My Profile" />
        <div className="screen-content flex items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-red-100 border-t-brand-red" />
        </div>
      </div>
    )
  }

  const initial = (user.name || user.email || 'U').charAt(0).toUpperCase()
  const totalPaid = payments.reduce((sum, payment) => sum + (Number(payment.totalAmount) || 0), 0)
  const latestPayment = payments[0]

  return (
    <div className="screen">
      <PageHeader title="My Profile" subtitle="Manage your account and keep track of your activity." />

      <div className="screen-content">
        <div className="container-main py-5 md:py-8">
          <div className="grid items-start gap-5 lg:grid-cols-[220px_minmax(0,1fr)] xl:gap-7">
            <aside className="space-y-3">
              <section className="surface-card flex items-center gap-3 p-4 lg:hidden">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-lg font-bold text-brand-red ring-1 ring-red-100 lg:h-14 lg:w-14">
                  {initial}
                </div>
                <div className="min-w-0">
                  <h2 className="truncate text-[14px] font-bold text-slate-900">{user.name || 'User'}</h2>
                  <p className="mt-0.5 truncate text-[11px] text-slate-500">{user.email || 'Email not provided'}</p>
                  <p className="mt-1 text-[11px] text-slate-500">{user.phone ? `+91 ${user.phone}` : 'Phone not provided'}</p>
                </div>
                <span className="ml-auto shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-700">
                  Account active
                </span>
              </section>

              <nav aria-label="Profile sections" className="surface-card hidden space-y-1 p-2 lg:block">
                {TABS.map((tab) => (
                  <ProfileNavButton key={tab.id} tab={tab} active={activeTab === tab.id} onClick={() => setTab(tab.id)} />
                ))}
              </nav>

              <nav aria-label="Profile sections" className="flex gap-2 overflow-x-auto pb-1 lg:hidden">
                {TABS.map((tab) => (
                  <ProfileNavButton key={tab.id} tab={tab} active={activeTab === tab.id} onClick={() => setTab(tab.id)} compact />
                ))}
              </nav>

              <section className="hidden rounded-2xl border border-red-100 bg-red-50/70 p-4 lg:block">
                <p className="text-[13px] font-bold text-slate-900">Need a hand?</p>
                <p className="mt-1 text-[11px] leading-relaxed text-slate-600">Our support team can help with your account or payments.</p>
                <Link to="/support" className="mt-3 inline-flex text-[12px] font-bold text-brand-red hover:text-red-700">Contact support <span aria-hidden="true">→</span></Link>
              </section>

              <button
                type="button"
                onClick={handleLogout}
                className="hidden w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-[13px] font-semibold text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-brand-red lg:flex"
              >
                Log out
              </button>
            </aside>

            <main className="min-w-0 space-y-4">
              <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(230px,1.35fr)_repeat(3,minmax(135px,1fr))]">
                <div className="surface-card flex min-w-0 items-center gap-3 p-4 md:p-5">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-red-50 text-lg font-bold text-brand-red">
                    {initial}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-slate-400">Your account</p>
                    <h2 className="mt-1 truncate text-[15px] font-bold text-slate-900">{user.name || 'User'}</h2>
                    <p className="mt-0.5 truncate text-[11px] text-slate-500">{user.email || 'Manage your profile details'}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setMessage('')
                      setForm({ name: user.name || '', email: user.email || '' })
                      setEditing((current) => !current)
                    }}
                    className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-red-200 px-2.5 py-2 text-[11px] font-bold text-brand-red transition hover:bg-red-50"
                    aria-expanded={editing}
                  >
                    <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-9.9 9.9a2 2 0 01-.878.513l-3.2.914.914-3.2a2 2 0 01.513-.878l9.9-9.9z" />
                    </svg>
                    {editing ? 'Cancel' : 'Edit'}
                  </button>
                </div>
                <ProfileMetric label="Payments made" value={payments.length.toLocaleString('en-IN')} detail="Recorded transactions" tone="red" />
                <ProfileMetric label="Total paid" value={`₹${totalPaid.toLocaleString('en-IN')}`} detail="Across your payments" tone="green" />
                <ProfileMetric
                  label="Latest payment"
                  value={latestPayment ? formatPaymentDate(latestPayment.paidAt || latestPayment.savedAt) : '—'}
                  detail={latestPayment ? 'Most recent transaction' : 'No payments yet'}
                  tone="amber"
                />
              </section>

              {editing && (
                <section className="surface-card p-4 md:p-6" aria-label="Edit profile">
                  <div className="mb-5">
                    <h2 className="text-[16px] font-bold text-slate-900">Edit profile</h2>
                    <p className="mt-1 text-[12px] text-slate-500">Update your name and email address. Your mobile number cannot be changed here.</p>
                  </div>
                  <form onSubmit={handleSave} className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="field-label" htmlFor="profile-name">Full name</label>
                      <input
                        id="profile-name"
                        type="text"
                        required
                        minLength={2}
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="field-label" htmlFor="profile-email">Email address</label>
                      <input
                        id="profile-email"
                        type="email"
                        required
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="field-label" htmlFor="profile-phone">Mobile number</label>
                      <input
                        id="profile-phone"
                        type="tel"
                        disabled
                        value={user.phone ? `+91 ${user.phone}` : 'Not provided'}
                        className="input-field cursor-not-allowed bg-slate-100 opacity-70"
                      />
                    </div>
                    <div className="flex flex-wrap items-end gap-3">
                      <button type="submit" className="btn-primary" disabled={saving}>
                        {saving ? 'Saving…' : 'Save changes'}
                      </button>
                      <button type="button" className="btn-secondary" onClick={() => setEditing(false)}>Cancel</button>
                    </div>
                    {message && (
                      <p role="status" className={`text-[13px] sm:col-span-2 ${message.includes('success') ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {message}
                      </p>
                    )}
                  </form>
                </section>
              )}

              <nav aria-label="Activity sections" className="surface-card flex gap-1 overflow-x-auto p-1.5">
                {TABS.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setTab(tab.id)}
                    aria-current={activeTab === tab.id ? 'page' : undefined}
                    className={`shrink-0 rounded-lg px-3 py-2 text-[11px] font-semibold transition sm:px-4 sm:text-[12px] ${
                      activeTab === tab.id
                        ? 'bg-brand-red text-white shadow-sm'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>

              {activeTab === 'account' && (
                <div className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(240px,0.8fr)]">
                  <section className="surface-card min-w-0 p-4 md:p-5">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <h2 className="text-[15px] font-bold text-slate-900">Recent payments</h2>
                        <p className="mt-1 text-[11px] text-slate-500">Your latest successful transactions.</p>
                      </div>
                      <button type="button" onClick={() => setTab('payments')} className="shrink-0 text-[11px] font-bold text-brand-red hover:text-red-700">
                        View all
                      </button>
                    </div>
                    {payments.length ? (
                      <PaymentList payments={payments.slice(0, 4)} />
                    ) : (
                      <EmptyState
                        title="No payments yet"
                        description="Successful payments will show up here."
                        action={<Link to="/pay-challan" className="btn-primary mt-4 inline-flex">Check challan</Link>}
                      />
                    )}
                    <p className="mt-3 border-t border-slate-100 pt-3 text-[10px] leading-relaxed text-slate-400">
                      Payment activity is shown here; challan details are checked live when you search.
                    </p>
                  </section>

                  <section className="surface-card p-4 md:p-5">
                    <h2 className="text-[15px] font-bold text-slate-900">Quick access</h2>
                    <p className="mt-1 text-[11px] text-slate-500">Pick up where you left off.</p>
                    <div className="mt-4 grid gap-2">
                      <QuickLink to="/pay-challan" title="Check Challan" desc="Search for current challans" />
                      <QuickLink to="/vehicle-info" title="RC Details" desc="Look up registration details" />
                      <QuickLink to="/service-history" title="Service History" desc="View service records" />
                      <QuickLink to="/support" title="Help & Support" desc="Get assistance" />
                    </div>
                  </section>
                </div>
              )}

              {activeTab === 'payments' && (
                <TabPanel title="Payments made" subtitle="A summary of completed transactions.">
                  {payments.length ? (
                    <>
                      <PaymentList payments={payments} />
                      <p className="mt-3 border-t border-slate-100 pt-3 text-[11px] leading-relaxed text-slate-400">
                        Payment received by Challan One; government challan settlement is separate.
                      </p>
                    </>
                  ) : (
                    <EmptyState title="No payments yet" description="Your completed transactions will appear here." action={<Link to="/pay-challan" className="btn-primary mt-4 inline-flex">Check challan</Link>} />
                  )}
                </TabPanel>
              )}

              {activeTab === 'bookings' && (
                <TabPanel title="My bookings" subtitle="Payment activity linked to your account.">
                  {payments.length ? <PaymentList payments={payments} /> : <EmptyState title="No bookings yet" description="Your activity will appear here after your first successful payment." action={<Link to="/pay-challan" className="btn-primary mt-4 inline-flex">Get started</Link>} />}
                </TabPanel>
              )}

              {activeTab === 'pending' && (
                <TabPanel title="Pending challans" subtitle="Search for current challan information whenever you need it.">
                  <EmptyState
                    title="We don’t keep a challan-by-challan profile ledger"
                    description="Challan status can change. Search your vehicle to get the latest available details instead of relying on an outdated saved list."
                    action={<Link to="/pay-challan" className="btn-primary mt-4 inline-flex">Check challan</Link>}
                  />
                </TabPanel>
              )}

              <div className="lg:hidden">
                <button type="button" onClick={handleLogout} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-[13px] font-semibold text-slate-600 hover:bg-slate-50">
                  Log out
                </button>
              </div>
            </main>
          </div>
        </div>
      </div>
    </div>
  )
}

function TabPanel({ title, subtitle, children }) {
  return (
    <div className="surface-card p-4 md:p-5 animate-fade-up">
      <div>
        <h2 className="text-[15px] font-bold text-slate-900">{title}</h2>
        <p className="mt-1 text-[11px] text-slate-500">{subtitle}</p>
      </div>
      <div className="mt-3">{children}</div>
    </div>
  )
}

function PaymentList({ payments }) {
  return (
    <div className="mt-3 divide-y divide-slate-100">
      {payments.map((payment, index) => (
        <div key={payment.id || `${payment.paidAt || payment.savedAt || 'payment'}-${index}`} className="flex items-center justify-between gap-3 py-3 first:pt-1">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600" aria-hidden="true">
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </span>
            <div className="min-w-0">
              <p className="truncate text-[12px] font-semibold text-slate-800">Challan payment</p>
              <p className="text-[11px] text-slate-500">{formatPaymentDate(payment.paidAt || payment.savedAt)}</p>
            </div>
          </div>
          <span className="shrink-0 text-[12px] font-bold text-slate-900">
            ₹{(Number(payment.totalAmount) || 0).toLocaleString('en-IN')}
          </span>
        </div>
      ))}
    </div>
  )
}

function EmptyState({ title, description, action }) {
  return (
    <div className="my-4 rounded-xl border border-dashed border-slate-200 bg-slate-50/70 px-4 py-8 text-center">
      <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-400 shadow-sm" aria-hidden="true">
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h8m-8 4h8m-8 4h5M6 3.75h9l3 3V20.25H6z" />
        </svg>
      </span>
      <p className="mt-3 text-[13px] font-semibold text-slate-800">{title}</p>
      <p className="mx-auto mt-1 max-w-md text-[11px] leading-relaxed text-slate-500">{description}</p>
      {action}
    </div>
  )
}

function ProfileNavButton({ tab, active, onClick, compact = false }) {
  const iconPaths = {
    account: <><circle cx="12" cy="8" r="3.2" /><path d="M5.5 20c.5-3.4 2.7-5.2 6.5-5.2s6 1.8 6.5 5.2" /></>,
    pending: <><path d="M7 3.75h7l4 4V20.25H7z" /><path d="M14 3.75v4h4M10 12h5m-5 3h5" /></>,
    payments: <><rect x="3.5" y="5.5" width="17" height="13" rx="2" /><path d="M3.5 10h17m-13 4h3" /></>,
    bookings: <><rect x="4" y="5.5" width="16" height="15" rx="2" /><path d="M8 3.75v3.5m8-3.5v3.5M4 10h16m-12 4h2m3 0h2m-7 3h2" /></>,
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      className={`inline-flex items-center gap-2.5 rounded-lg text-left text-[12px] font-semibold transition ${
        compact ? 'shrink-0 px-3 py-2' : 'w-full px-3 py-2.5'
      } ${active ? 'bg-red-50 text-brand-red' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
    >
      <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {iconPaths[tab.id]}
      </svg>
      {tab.label}
    </button>
  )
}

function ProfileMetric({ label, value, detail, tone }) {
  const tones = {
    red: 'bg-red-50 text-brand-red',
    green: 'bg-emerald-50 text-emerald-700',
    amber: 'bg-amber-50 text-amber-700',
  }

  return (
    <div className="surface-card min-w-0 p-4 md:p-5">
      <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${tones[tone]}`} aria-hidden="true">
        <span className="text-[14px] font-bold">{tone === 'green' ? '✓' : tone === 'amber' ? '◷' : '↗'}</span>
      </div>
      <p className="mt-3 text-[10px] font-semibold text-slate-500">{label}</p>
      <p className={`mt-1 truncate text-[18px] font-extrabold tracking-tight ${tones[tone].split(' ').at(-1)}`}>{value}</p>
      <p className="mt-1 truncate text-[10px] text-slate-500">{detail}</p>
    </div>
  )
}

function formatPaymentDate(date) {
  if (!date) return 'Date unavailable'
  const parsed = new Date(date)
  return Number.isNaN(parsed.getTime()) ? 'Date unavailable' : parsed.toLocaleDateString('en-IN')
}

function QuickLink({ to, title, desc }) {
  return (
    <Link to={to} className="group flex items-center justify-between gap-3 rounded-xl border border-slate-100 px-3 py-2.5 transition hover:border-red-100 hover:bg-red-50/30">
      <span className="min-w-0">
        <span className="block truncate text-[12px] font-semibold text-slate-900">{title}</span>
        <span className="mt-0.5 block truncate text-[10px] text-slate-500">{desc}</span>
      </span>
      <span className="text-[14px] text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-brand-red" aria-hidden="true">→</span>
    </Link>
  )
}
