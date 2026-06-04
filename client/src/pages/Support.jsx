import { useState } from 'react'
import { SupportIllustration } from '../components/Illustrations'
import PageTitleBar from '../components/PageTitleBar'
import { submitSupportMessage } from '../utils/supportApi'
import { WHATSAPP, whatsappUrl } from '../constants/brand'

export default function Support() {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' })
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
        name: formData.name,
        email: formData.email,
        message: formData.message,
        source: 'support',
      })
      setTicketId(data.ticketId || '')
      setSubmitted(true)
    } catch (err) {
      setError(err.message || 'Failed to send message')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="screen">
      <div className="screen-content">
        <PageTitleBar
          title="Contact Us"
          subtitle="We're here to help you with anything"
        />

        <div className="container-main page-section">
          <div className="grid md:grid-cols-2 gap-4 md:gap-10 max-w-5xl mx-auto">
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
                    Our team will contact you within 2 hours.
                  </p>
                  {ticketId && (
                    <p className="mt-2 text-[12px] text-slate-500">
                      Reference: <span className="font-mono font-semibold text-brand-red">{ticketId.slice(-8)}</span>
                    </p>
                  )}
                  <button
                    onClick={() => {
                      setSubmitted(false)
                      setFormData({ name: '', email: '', message: '' })
                      setTicketId('')
                    }}
                    className="btn-primary mt-4"
                  >
                    Submit Another Request
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="surface-card p-4 md:p-6 space-y-3 md:space-y-4 animate-fade-up">
                  <h3 className="text-[15px] md:text-[17px] font-bold text-slate-900">Send us a message</h3>
                  {error && <p className="text-[13px] text-rose-600">{error}</p>}
                  <div>
                    <label className="field-label">Full Name</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Enter your full name"
                      required
                      className="input-field"
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
                      placeholder="Type your message..."
                      required
                      minLength={10}
                      className="input-field resize-none"
                    />
                  </div>
                  <button type="submit" className="btn-primary w-full" disabled={loading}>
                    {loading ? 'Sending…' : 'Send Message'}
                  </button>
                </form>
              )}
            </div>

            <div className="space-y-4">
              <div className="page-hero-banner animate-fade-up">
                <SupportIllustration />
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
