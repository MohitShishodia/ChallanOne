import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import { useAuth } from '../context/AuthContext'
import { API, API_BASE_URL } from '../config/api'
import { getPendingChallans, getUserPayments } from '../utils/userStorage'

const TABS = [
  { id: 'account', label: 'My Account' },
  { id: 'bookings', label: 'My Bookings' },
  { id: 'payments', label: 'Payments Made' },
  { id: 'pending', label: 'Pending Challans' },
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
  const [pending, setPending] = useState([])

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
      setPending(getPendingChallans())
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

  return (
    <div className="screen">
      <PageHeader title="My Profile" />

      <div className="screen-content">
        <div className="container-main page-section">
          <div className="grid lg:grid-cols-[240px_1fr] gap-4 md:gap-8">
            <aside className="space-y-3">
              <div className="profile-card-mobile lg:hidden">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-brand-red text-lg font-bold">
                  {initial}
                </div>
                <div className="min-w-0 flex-1 text-left">
                  <h2 className="text-[15px] font-bold truncate">{user.name || 'User'}</h2>
                  <p className="text-[11px] text-white/70 truncate">{user.email}</p>
                  <p className="text-[10px] text-white/50">+91 {user.phone || '—'}</p>
                </div>
              </div>

              <div className="hidden lg:block surface-card p-5 text-center bg-gradient-to-br from-brand-black to-red-900 border-0 text-white">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white text-brand-red text-2xl font-bold">
                  {initial}
                </div>
                <h2 className="mt-3 text-[18px] font-bold">{user.name || 'User'}</h2>
                <p className="text-[13px] text-white/70 truncate">{user.email}</p>
                <p className="text-[12px] text-white/50 mt-1">+91 {user.phone || '—'}</p>
              </div>

              <nav className="surface-card p-2 hidden lg:block">
                {TABS.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setTab(tab.id)}
                    className={`w-full text-left rounded-xl px-4 py-3 text-[14px] font-medium transition ${
                      activeTab === tab.id ? 'bg-red-50 text-brand-red' : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>

              <div className="lg:hidden flex gap-1.5 overflow-x-auto no-scrollbar pb-0.5 -mx-1 px-1">
                {TABS.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setTab(tab.id)}
                    className={`shrink-0 rounded-full px-3 py-1.5 text-[12px] font-semibold transition ${
                      activeTab === tab.id ? 'bg-brand-red text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </aside>

            <div className="min-w-0 space-y-4">
              {activeTab === 'account' && (
                <div className="surface-card p-4 md:p-6 animate-fade-up">
                  <h3 className="text-[16px] md:text-[20px] font-bold text-slate-900">Edit Profile</h3>
                  <p className="text-[13px] text-slate-500 mt-1">Update your details. Phone number cannot be changed.</p>
                  <form onSubmit={handleSave} className="mt-5 space-y-4 max-w-md">
                    <div>
                      <label className="field-label">Full Name</label>
                      <input
                        type="text"
                        required
                        minLength={2}
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="field-label">Email</label>
                      <input
                        type="email"
                        required
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="field-label">Mobile Number</label>
                      <input
                        type="tel"
                        disabled
                        value={user.phone ? `+91 ${user.phone}` : 'Not provided'}
                        className="input-field opacity-70 cursor-not-allowed bg-slate-100"
                      />
                      <p className="text-[11px] text-slate-400 mt-1">Contact support to change your phone number.</p>
                    </div>
                    {message && (
                      <p className={`text-[13px] ${message.includes('success') ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {message}
                      </p>
                    )}
                    <button type="submit" className="btn-primary" disabled={saving}>
                      {saving ? 'Saving…' : 'Save Changes'}
                    </button>
                  </form>

                  <div className="mt-8 pt-6 border-t border-slate-100 grid sm:grid-cols-2 gap-3">
                    <QuickLink to="/service-history" title="Service History" desc="View vehicle records" />
                    <QuickLink to="/pay-challan" title="Check Challan" desc="Search new challans" />
                    <QuickLink to="/vehicle-info" title="RC Details" desc="Registration lookup" />
                    <QuickLink to="/support" title="Help & Support" desc="Get assistance" />
                  </div>
                </div>
              )}

              {activeTab === 'bookings' && (
                <TabPanel title="My Bookings" empty={payments.length === 0} emptyText="No bookings yet. Make a payment to see your orders here.">
                  {payments.map((p) => (
                    <BookingRow key={p.id} payment={p} />
                  ))}
                </TabPanel>
              )}

              {activeTab === 'payments' && (
                <TabPanel title="Payments Made" empty={payments.length === 0} emptyText="No payments yet." cta="/pay-challan">
                  {payments.map((payment) => (
                    <div key={payment.id} className="py-3 border-b border-slate-100 last:border-0">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-semibold text-slate-900">{payment.vehicleNumber}</p>
                          <p className="text-[12px] text-slate-500">
                            {payment.challans?.length || 0} challan(s) · {payment.paidAt ? new Date(payment.paidAt).toLocaleDateString('en-IN') : '—'}
                          </p>
                        </div>
                        <span className="shrink-0 text-brand-red font-bold">₹{payment.totalAmount?.toLocaleString()}</span>
                      </div>
                      {payment.challans?.length > 0 && (
                        <p className="mt-2 text-[12px] text-slate-600">
                          Challans: {payment.challans.map((challan) => challan.noticeId || challan.challanNumber || challan.id).filter(Boolean).join(', ')}
                        </p>
                      )}
                      <p className="mt-1 text-[11px] text-slate-400">Payment received by ChallanOne; government challan settlement is separate.</p>
                    </div>
                  ))}
                </TabPanel>
              )}

              {activeTab === 'pending' && (
                <TabPanel title="Pending Challans" empty={pending.length === 0} emptyText="No saved pending challans." cta="/pay-challan">
                  {pending.map((entry) => (
                    <div key={entry.vehicleNumber} className="py-3 border-b border-slate-100 last:border-0">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-slate-900">{entry.vehicleNumber}</p>
                        <Link to={`/pay-challan?vehicle=${encodeURIComponent(entry.vehicleNumber)}`} className="btn-link text-[13px]">
                          Pay now
                        </Link>
                      </div>
                      <p className="text-[12px] text-slate-500 mt-0.5">
                        {entry.challans?.length || 0} pending · Updated {new Date(entry.updatedAt).toLocaleDateString('en-IN')}
                      </p>
                    </div>
                  ))}
                </TabPanel>
              )}

              <button onClick={handleLogout} className="btn-secondary border-rose-100 text-rose-600 hover:bg-rose-50 w-full max-w-md">
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function TabPanel({ title, children, empty, emptyText, cta }) {
  return (
    <div className="surface-card p-5 md:p-6 animate-fade-up">
      <h3 className="h-section">{title}</h3>
      {empty ? (
        <div className="py-10 text-center">
          <p className="text-[14px] text-slate-500">{emptyText}</p>
          {cta && <Link to={cta} className="btn-primary mt-4 inline-flex">Get Started</Link>}
        </div>
      ) : (
        <div className="mt-4">{children}</div>
      )}
    </div>
  )
}

function BookingRow({ payment }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0 gap-3">
      <div className="min-w-0">
        <p className="font-semibold text-slate-900 truncate">{payment.vehicleNumber}</p>
        <p className="text-[12px] text-slate-500">Order {payment.id}</p>
      </div>
      <div className="text-right shrink-0">
        <p className="font-bold text-brand-red">₹{payment.totalAmount?.toLocaleString()}</p>
      </div>
    </div>
  )
}

function QuickLink({ to, title, desc }) {
  return (
    <Link to={to} className="rounded-xl border border-slate-100 p-4 hover:border-red-100 hover:bg-red-50/30 transition">
      <p className="text-[14px] font-semibold text-slate-900">{title}</p>
      <p className="text-[12px] text-slate-500">{desc}</p>
    </Link>
  )
}
