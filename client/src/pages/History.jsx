import { Link } from 'react-router-dom'
import PageHeader from '../components/PageHeader'

const recent = [
  { number: 'UP32AB1234', date: '13 May 2024, 10:30 AM', pillClass: 'pill-pending', pillLabel: '2 Pending' },
  { number: 'DL1CDC5678', date: '11 May 2024, 04:30 PM', pillClass: 'pill-success', pillLabel: 'No Challan' },
  { number: 'MH01EF9012', date: '02 May 2024, 09:00 AM', pillClass: 'pill-info',    pillLabel: 'RC Lookup' },
  { number: 'KA01AB2345', date: '28 Apr 2024, 06:45 PM', pillClass: 'pill-success', pillLabel: 'Paid' },
]

export default function History() {
  return (
    <div className="screen">
      <PageHeader title="History" />

      <div className="screen-content">
        <div className="container-narrow py-8 md:py-12 space-y-6">
          <div>
            <h1 className="h-section">Your Searches</h1>
            <p className="mt-1 text-[14px] text-slate-500">Recent challan and RC lookups in one place.</p>
          </div>

          <div className="surface-card divide-y divide-slate-100 animate-fade-up">
            {recent.map((r) => (
              <Link
                key={r.number}
                to={`/pay-challan?vehicle=${encodeURIComponent(r.number)}`}
                className="flex items-center justify-between p-4 transition hover:bg-slate-50"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 2m6-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[14px] font-semibold text-slate-900 truncate">{r.number}</p>
                    <p className="text-[12px] text-slate-500 mt-0.5 truncate">{r.date}</p>
                  </div>
                </div>
                <span className={`pill ${r.pillClass}`}>{r.pillLabel}</span>
              </Link>
            ))}
          </div>

          <div className="trust-card animate-fade-up">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p>
              History is private to your device. Sign in to keep your searches synced across devices.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
