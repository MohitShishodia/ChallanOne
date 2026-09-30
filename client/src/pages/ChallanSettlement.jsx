import { useState } from 'react'
import PageTitleBar from '../components/PageTitleBar'
import { submitSupportMessage } from '../utils/supportApi'
import { WHATSAPP, whatsappUrl } from '../constants/brand'

export default function ChallanSettlement() {
  const [formData, setFormData] = useState({ rcNumber: '', email: '', message: '' })
  const [submitted, setSubmitted] = useState(false)
  const [ticketId, setTicketId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleInputChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const data = await submitSupportMessage({
        name: formData.rcNumber,
        email: formData.email,
        message: formData.message,
        source: 'challan-settlement',
      })
      setTicketId(data.ticketId || '')
      setSubmitted(true)
    } catch (err) {
      setError(err.message || 'Failed to send request')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="screen">
      <div className="screen-content">
        <PageTitleBar
          title="Challan Settlement"
          subtitle="Submit your challan settlement request and we'll handle the rest"
        />

        <div className="container-main page-section">
          <div className="grid md:grid-cols-2 gap-4 md:gap-10 lg:gap-14">
            <div>
              {submitted ? (
                <div className="surface-card p-6 md:p-8 text-center animate-fade-up">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-[16px] font-bold text-slate-900">Request Submitted</h3>
                  <p className="mt-1 text-[13px] text-slate-500">
                    Our team will review your challan settlement request and contact you within 2 hours.
                  </p>
                  {ticketId && (
                    <p className="mt-2 text-[12px] text-slate-500">
                      Reference: <span className="font-mono font-semibold text-brand-red">{ticketId.slice(-8)}</span>
                    </p>
                  )}
                  <button
                    onClick={() => {
                      setSubmitted(false)
                      setFormData({ rcNumber: '', email: '', message: '' })
                      setTicketId('')
                    }}
                    className="btn-primary mt-4"
                  >
                    Submit Another Request
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="surface-card p-4 md:p-6 space-y-3 md:space-y-4 animate-fade-up">
                  <h3 className="text-[15px] md:text-[17px] font-bold text-slate-900">Submit Challan Settlement Request</h3>
                  {error && <p className="text-[13px] text-rose-600">{error}</p>}
                  <div>
                    <label className="field-label">RC Number</label>
                    <input
                      type="text"
                      name="rcNumber"
                      value={formData.rcNumber}
                      onChange={handleInputChange}
                      placeholder="Enter your RC number (e.g. DL01AB1234)"
                      required
                      className="input-field"
                      style={{ textTransform: 'uppercase' }}
                    />
                  </div>
                  <div>
                    <label className="field-label">Email Address</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="Enter your email"
                      required
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="field-label">Message</label>
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleInputChange}
                      rows={4}
                      placeholder="Describe your challan settlement request..."
                      required
                      minLength={10}
                      className="input-field resize-none"
                    />
                  </div>
                  <button type="submit" className="btn-primary w-full" disabled={loading}>
                    {loading ? 'Sending…' : 'Submit Request'}
                  </button>
                </form>
              )}
            </div>

            <div className="space-y-4">
              <div className="page-hero-banner animate-fade-up">
                <SettlementIllustration />
              </div>

              <div className="surface-card p-4 space-y-3 animate-fade-up text-[13px]">
                <ContactRow label="Email" value="support@challanone.com" />
                <ContactRow label="Phone" value={WHATSAPP.display} />
                <ContactRow label="WhatsApp" value="Chat with expert" href={whatsappUrl()} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function ContactRow({ label, value, href }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-slate-500">{label}</span>
      {href ? (
        <a href={href} target="_blank" rel="noopener noreferrer" className="font-semibold text-brand-red hover:underline">
          {value}
        </a>
      ) : (
        <span className="font-semibold text-slate-900 text-right">{value}</span>
      )}
    </div>
  )
}

function SettlementIllustration() {
  return (
    <svg
      viewBox="0 0 400 260"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      style={{ width: '100%', height: 'auto', display: 'block' }}
    >
      <rect width="400" height="260" rx="20" fill="#FFF1F2" />
      {/* Document */}
      <rect x="130" y="40" width="140" height="180" rx="10" fill="#ffffff" stroke="#E2E8F0" strokeWidth="2" />
      {/* Header stripe */}
      <rect x="130" y="40" width="140" height="36" rx="10" fill="#DC2626" />
      <rect x="130" y="66" width="140" height="10" fill="#DC2626" />
      <text x="200" y="64" textAnchor="middle" fill="#ffffff" fontWeight="700" fontSize="13">CHALLAN</text>
      {/* Lines */}
      <rect x="150" y="90" width="100" height="6" rx="3" fill="#E2E8F0" />
      <rect x="150" y="106" width="80" height="6" rx="3" fill="#E2E8F0" />
      <rect x="150" y="122" width="90" height="6" rx="3" fill="#E2E8F0" />
      <rect x="150" y="138" width="70" height="6" rx="3" fill="#E2E8F0" />
      {/* Checkmark circle */}
      <circle cx="200" cy="180" r="24" fill="#ECFDF5" stroke="#059669" strokeWidth="2" />
      <path d="M189 180l7 7 15-15" stroke="#059669" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      {/* Decorative circles */}
      <circle cx="80" cy="80" r="30" fill="#FEE2E2" opacity="0.6" />
      <circle cx="340" cy="180" r="25" fill="#DBEAFE" opacity="0.5" />
      <circle cx="60" cy="200" r="15" fill="#FEF3C7" opacity="0.6" />
    </svg>
  )
}
