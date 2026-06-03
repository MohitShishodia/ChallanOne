import { useState } from 'react'
import { Link } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import { useAuth } from '../context/AuthContext'
import { getServiceHistory } from '../utils/userStorage'
import { whatsappUrl } from '../constants/brand'

export default function ServiceHistory() {
  const { user } = useAuth()
  const [vehicle, setVehicle] = useState('')
  const [searched, setSearched] = useState('')

  const records = searched ? getServiceHistory(searched) : getServiceHistory()

  const handleSearch = (e) => {
    e.preventDefault()
    const v = vehicle.trim().toUpperCase()
    if (!v) return
    setSearched(v)
  }

  const clearSearch = () => {
    setSearched('')
    setVehicle('')
  }

  return (
    <div className="screen">
      <PageHeader title="Service History" />

      <div className="screen-content">
        <div className="container-narrow py-8 md:py-12 space-y-6">
          <div>
            <h1 className="h-section">Your Car Service History</h1>
            <p className="mt-1 text-[14px] text-slate-500">
              View past service visits and maintenance records for your vehicle.
            </p>
          </div>

          <form onSubmit={handleSearch} className="surface-card p-5 flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={vehicle}
              onChange={(e) => setVehicle(e.target.value.toUpperCase())}
              placeholder="Enter vehicle number (e.g. DL01AB1234)"
              className="input-field flex-1 uppercase"
              maxLength={12}
            />
            <button type="submit" className="btn-primary shrink-0">
              Search
            </button>
          </form>

          {searched && (
            <div className="flex items-center justify-between gap-3">
              <p className="text-[13px] text-slate-500">
                Service records for <span className="font-semibold text-slate-900">{searched}</span>
              </p>
              <button type="button" onClick={clearSearch} className="text-[13px] font-semibold text-brand-red hover:underline shrink-0">
                Clear
              </button>
            </div>
          )}

          {records.length === 0 ? (
            <EmptyState
              searched={!!searched}
              vehicle={searched}
            />
          ) : (
            <div className="surface-card divide-y divide-slate-100">
              {records.map((s) => (
                <ServiceRow key={s.id} record={s} />
              ))}
            </div>
          )}

          {!user && (
            <div className="trust-card">
              <p>
                <Link to="/login" className="font-semibold text-brand-red hover:underline">Sign in</Link>
                {' '}to keep your service history saved across devices.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function ServiceRow({ record }) {
  const serviceType = record.serviceType || record.title || 'General service'
  const status = record.status || 'Completed'

  return (
    <div className="p-4 md:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[15px] font-semibold text-slate-900">{serviceType}</p>
          <p className="text-[12px] text-slate-500 mt-0.5">
            {record.vehicleNumber}
            {record.date && ` · ${new Date(record.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`}
          </p>
        </div>
        <span className={`pill shrink-0 ${status === 'Completed' ? 'pill-success' : 'pill-warning'}`}>
          {status}
        </span>
      </div>
      {record.notes && (
        <p className="text-[13px] text-slate-600 mt-2 leading-relaxed">{record.notes}</p>
      )}
      {record.odometer && (
        <p className="text-[12px] text-slate-500 mt-1">Odometer: {record.odometer} km</p>
      )}
    </div>
  )
}

function EmptyState({ searched, vehicle }) {
  return (
    <div className="surface-card p-8 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-brand-red">
        <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655-5.653a2.548 2.548 0 010-3.586l.745-.745a2.548 2.548 0 013.586 0l1.12 1.12M7.765 7.765l-1.12-1.12" />
        </svg>
      </div>
      <p className="text-[15px] font-semibold text-slate-900">
        {searched ? `No service records for ${vehicle}` : 'No service records yet'}
      </p>
      <p className="text-[13px] text-slate-500 mt-1 max-w-sm mx-auto">
        {searched
          ? 'Try another vehicle number or contact our team if you recently had a service with us.'
          : 'Search by vehicle number to view service visits logged with Challan One.'}
      </p>
      <a
        href={whatsappUrl('Hi! I would like to check my car service history.')}
        target="_blank"
        rel="noopener noreferrer"
        className="btn-primary mt-5 inline-flex"
      >
        Contact Support
      </a>
    </div>
  )
}
