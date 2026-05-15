import { useState } from 'react'
import { SupportIllustration } from '../components/Illustrations'

export default function Support() {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' })
  const [submitted, setSubmitted] = useState(false)
  const [ticketId, setTicketId] = useState('')

  const handleInputChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value })

  const handleSubmit = (e) => {
    e.preventDefault()
    setTicketId(`TKT-${Date.now().toString().slice(-8)}`)
    setSubmitted(true)
  }

  return (
    <div className="screen">
      <div className="screen-content">
        {/* Page title */}
        <div className="bg-gradient-to-r from-blue-50 to-sky-50 border-b border-slate-100">
          <div className="container-main py-6 md:py-10">
            <h1 className="h-section">Contact Us</h1>
            <p className="mt-1 text-[14px] md:text-[15px] text-slate-500">We're here to help you with anything</p>
          </div>
        </div>

        <div className="container-main py-8 md:py-12">
          <div className="grid md:grid-cols-2 gap-8 md:gap-12 max-w-5xl mx-auto">
            {/* Left column */}
            <div className="space-y-6">
              <div className="hero-illu animate-fade-up" style={{ maxHeight: '280px' }}>
                <SupportIllustration className="w-full" />
              </div>

              <div className="space-y-1 animate-fade-up">
                <h2 className="text-[22px] font-bold text-slate-900">Get In Touch</h2>
                <p className="text-[14px] text-slate-500">Reach out through any of these channels</p>
              </div>

              <div className="surface-card p-5 space-y-4 animate-fade-up">
                <ContactRow
                  tone="blue"
                  label="Email"
                  value="support@challanone.com"
                  icon={
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  }
                />
                <ContactRow
                  tone="blue"
                  label="Phone"
                  value="+91 12345 67890"
                  icon={
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.04 11.04 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  }
                />
                <ContactRow
                  tone="blue"
                  label="Office"
                  value="193, Tech Park, Sector 62, Noida, Uttar Pradesh - 201301"
                  icon={
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 11a3 3 0 100-6 3 3 0 000 6z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7-7.5 11-7.5 11s-7.5-4-7.5-11a7.5 7.5 0 1115 0z" />
                    </svg>
                  }
                />
              </div>

              <div className="surface-card overflow-hidden animate-fade-up">
                <MapPreview />
              </div>
            </div>

            {/* Right column - Form */}
            <div>
              {submitted ? (
                <div className="surface-card p-8 text-center animate-fade-up">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                    <svg className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-[18px] font-bold text-slate-900">Request Submitted</h3>
                  <p className="mt-1 text-[14px] text-slate-500">
                    Our team will contact you within 2 hours.
                  </p>
                  <p className="mt-3 text-[13px] text-slate-500">
                    Ticket ID:&nbsp;
                    <span className="font-mono font-semibold text-blue-600">{ticketId}</span>
                  </p>
                  <button onClick={() => { setSubmitted(false); setFormData({ name: '', email: '', message: '' }) }} className="btn-primary mt-5">
                    Submit Another Request
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="surface-card p-6 space-y-4 animate-fade-up">
                  <h3 className="text-[17px] font-bold text-slate-900">Send us a message</h3>
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
                      rows={5}
                      placeholder="Type your message..."
                      required
                      className="input-field resize-none"
                    />
                  </div>
                  <button type="submit" className="btn-primary w-full">Send Message</button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function ContactRow({ tone, label, value, icon }) {
  const tones = {
    blue: 'bg-blue-50 text-blue-600',
  }
  return (
    <div className="flex items-start gap-3">
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tones[tone]}`}>
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[12px] font-medium text-slate-500">{label}</p>
        <p className="text-[14px] font-semibold text-slate-900 break-words">{value}</p>
      </div>
    </div>
  )
}

function MapPreview() {
  return (
    <div className="relative h-44 w-full">
      <svg viewBox="0 0 400 160" className="h-full w-full" xmlns="http://www.w3.org/2000/svg" aria-hidden>
        <rect width="400" height="160" fill="#E0E7FF" />
        {/* Map blocks */}
        <g fill="#FFFFFF" opacity="0.85">
          <rect x="10" y="20" width="80" height="40" rx="4" />
          <rect x="100" y="14" width="120" height="34" rx="4" />
          <rect x="230" y="22" width="60" height="46" rx="4" />
          <rect x="300" y="14" width="90" height="34" rx="4" />
          <rect x="10" y="80" width="100" height="60" rx="4" />
          <rect x="120" y="76" width="60" height="40" rx="4" />
          <rect x="120" y="124" width="100" height="22" rx="4" />
          <rect x="230" y="80" width="160" height="64" rx="4" />
        </g>
        {/* Roads */}
        <g stroke="#A5B4FC" strokeWidth="3" strokeLinecap="round">
          <line x1="0" y1="70" x2="400" y2="70" />
          <line x1="220" y1="0" x2="220" y2="160" />
        </g>
        {/* Pin */}
        <g transform="translate(258 60)">
          <path d="M0 14 C-12 14 -16 4 -16 -2 C-16 -12 -8 -22 0 -22 C8 -22 16 -12 16 -2 C16 4 12 14 0 14 Z" fill="#EF4444" />
          <circle cx="0" cy="-4" r="5" fill="#FFFFFF" />
        </g>
      </svg>
      <div className="absolute right-2 bottom-2 rounded-md bg-white/90 px-3 py-1.5 text-[11px] font-semibold text-slate-600 shadow">
        Open in Maps
      </div>
    </div>
  )
}
