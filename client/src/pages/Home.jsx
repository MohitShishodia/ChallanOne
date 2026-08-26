import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { whatsappUrl } from '../constants/brand'
import { submitSupportMessage } from '../utils/supportApi'
import HeroSearchWidget from '../components/HeroSearchWidget'
import './Home.css'

export default function Home() {
  const [heroSlide, setHeroSlide] = useState(0)

  useEffect(() => {
    const timer = window.setInterval(() => {
      setHeroSlide((current) => (current + 1) % heroImages.length)
    }, 4500)

    return () => window.clearInterval(timer)
  }, [])

  return (
    <div className="screen">
      <div className="screen-content home-wrap">
        {/* ══════════════ HERO ══════════════ */}
        <section className="hero">
          <div className="container-main hero-inner">
            {/* Left */}
            <div className="animate-fade-up">
              <div className="hero-badge">
                <svg viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" clipRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.7-9.3a1 1 0 00-1.4-1.4L9 10.6 7.7 9.3a1 1 0 00-1.4 1.4l2 2a1 1 0 001.4 0l4-4z" />
                </svg>
                India's Most Trusted Vehicle Verification Platform
              </div>

              <h1 className="hero-title">
                Check Vehicle Challan, RC Details &amp; Service History{' '}
                <span className="accent">in Seconds</span>
              </h1>

              <p className="hero-sub">
                Fast, secure and reliable platform for checking traffic challans and vehicle registration details across India.
              </p>

              <div className="hero-pills">
                <span className="hero-pill hero-pill--red">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M13 2L4.5 13H11l-1 9 8.5-11H12l1-9z" /></svg>
                  Instant Results
                </span>
                <span className="hero-pill hero-pill--green">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.6 2A9 9 0 11 5.6 7" /></svg>
                  100% Secure
                </span>
                <span className="hero-pill hero-pill--blue">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 21s-7-5.686-7-11a7 7 0 1114 0c0 5.314-7 11-7 11z" /><circle cx="12" cy="10" r="2.5" /></svg>
                  PAN India Coverage
                </span>
              </div>

              <div className="hero-search">
                <HeroSearchWidget />
              </div>
            </div>

            {/* Right - automatic image slider */}
            <div className="hero-visual hero-slider animate-fade-up">
              <div className="hero-slides">
                {heroImages.map((image, index) => (
                  <img
                    key={image.src}
                    src={image.src}
                    alt={image.alt}
                    className={`hero-slide${index === heroSlide ? ' hero-slide--active' : ''}`}
                    aria-hidden={index !== heroSlide}
                  />
                ))}
              </div>
              <div className="hero-slider-dots" aria-label="Choose home page image">
                {heroImages.map((image, index) => (
                  <button
                    key={image.src}
                    type="button"
                    className={`hero-slider-dot${index === heroSlide ? ' hero-slider-dot--active' : ''}`}
                    aria-label={`Show image ${index + 1}`}
                    aria-current={index === heroSlide ? 'true' : undefined}
                    onClick={() => setHeroSlide(index)}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════ PARTNERS / TRUST BAR ══════════════ */}
        <section className="partners">
          <div className="container-main partners-inner">
            <div className="partners-lead">
              <p className="partners-lead-title">
                Trusted by <span>1,20,000+</span> Vehicle Owners
              </p>
              <p className="partners-stars">★★★★★</p>
            </div>
            <div className="partners-logos">
              {partners.map((p) => (
                <span className="partner-logo" key={p.label}>
                  <span className="dot">{p.icon}</span>
                  {p.label}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════ STATS ══════════════ */}
        <section className="stats-band">
          <div className="container-main">
            <div className="stats-grid">
              {stats.map((s) => (
                <div className="stat-card" key={s.label}>
                  <span className={`stat-ic stat-ic--${s.tone}`}>{s.icon}</span>
                  <div>
                    <p className="stat-num">{s.num}</p>
                    <p className="stat-label">{s.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════ FEATURES ══════════════ */}
        <section className="sec">
          <div className="container-main">
            <div className="sec-head">
              <h2 className="sec-title">Everything You Need, All in One Place</h2>
              <p className="sec-sub">Powerful features to help you stay compliant and avoid penalties</p>
            </div>
            <div className="feat-grid">
              {features.map((f) => (
                <Link to={f.to} className="feat-card" key={f.title}>
                  <span className={`feat-ic feat-ic--${f.tone}`}>{f.icon}</span>
                  <p className="feat-title">{f.title}</p>
                  <p className="feat-desc">{f.desc}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════ HOW IT WORKS ══════════════ */}
        <section className="sec sec--gray">
          <div className="container-main">
            <div className="sec-head">
              <h2 className="sec-title">How It Works</h2>
              <p className="sec-sub">Get your vehicle information in 4 simple steps</p>
            </div>
            <div className="steps">
              {howItWorks.map((step, i) => (
                <div className="step" key={step.num}>
                  <div className="step-ic">
                    {step.icon}
                    <span className="step-num">{step.num}</span>
                  </div>
                  <p className="step-title">{step.title}</p>
                  <p className="step-desc">{step.desc}</p>
                  {i < howItWorks.length - 1 && (
                    <span className="step-arrow">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M13 6l6 6-6 6" /></svg>
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════ TESTIMONIALS ══════════════ */}
        <section className="sec">
          <div className="container-main">
            <div className="sec-head">
              <h2 className="sec-title">What Our Users Say</h2>
              <p className="sec-sub">Thousands of drivers trust us to keep their vehicles compliant</p>
            </div>
            <div className="tst-grid">
              {testimonials.map((t) => (
                <div className="tst-card" key={t.name}>
                  <p className="tst-stars">★★★★★</p>
                  <p className="tst-quote">“{t.quote}”</p>
                  <div className="tst-person">
                    <span className="tst-avatar" style={{ background: t.color }}>{t.name[0]}</span>
                    <div>
                      <p className="tst-name">{t.name}</p>
                      <p className="tst-city">{t.city}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════ CONTACT ══════════════ */}
        <ContactUsSection />

        {/* ══════════════ BOTTOM CTA BAR ══════════════ */}
        <section className="cta-bar">
          <div className="container-main cta-inner">
            <div className="cta-left">
              <div>
                <p className="cta-title">Have questions? We're here to help!</p>
                <p className="cta-desc">Talk to our challan clearance experts any time.</p>
              </div>
            </div>
            <a href={whatsappUrl('Hi! I would like to connect with a Challan One expert.')} target="_blank" rel="noopener noreferrer" className="cta-btn">
              <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 18, height: 18 }}>
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347M12.05 21.785a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884" />
              </svg>
              Contact Support
            </a>
            <div className="cta-badges">
              <span className="cta-badge"><CheckIcon /> 24/7 Support</span>
              <span className="cta-badge"><CheckIcon /> 100% Secure</span>
              <span className="cta-badge"><CheckIcon /> Instant Refunds</span>
              <span className="cta-badge"><CheckIcon /> Trusted Platform</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  )
}

/* ── Data ── */
const heroImages = [
  {
    src: '/car2.jpeg',
    alt: 'Vehicle challan details displayed alongside a Maruti Suzuki Swift at India Gate',
  },
  {
    src: '/WhatsApp%20Image%202026-07-17%20at%2022.41.19.jpeg',
    alt: 'Vehicle registration certificate details displayed alongside a Maruti Suzuki Swift',
  },
]

const partners = [
  { label: 'Ministry of Road Transport', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6" /></svg> },
  { label: 'VAHAN e-Services', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M3 13l2-5a2 2 0 012-1.5h10A2 2 0 0119 8l2 5v5a1 1 0 01-1 1h-1a1 1 0 01-1-1v-1H6v1a1 1 0 01-1 1H4a1 1 0 01-1-1v-5z" /><circle cx="7.5" cy="15.5" r="1" /><circle cx="16.5" cy="15.5" r="1" /></svg> },
  { label: 'PARIVAHAN SARATHI', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M7 3h10a2 2 0 012 2v14l-7-3-7 3V5a2 2 0 012-2z" /></svg> },
  { label: 'BHARAT BILLPAY', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="6" width="18" height="12" rx="2" /><path strokeLinecap="round" d="M3 10h18" /></svg> },
  { label: 'PCI DSS', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3l7 3v5c0 4.5-3 8.5-7 10-4-1.5-7-5.5-7-10V6l7-3z" /><path strokeLinecap="round" strokeLinejoin="round" d="M9.5 12l1.8 1.8L15 10" /></svg> },
]

const stats = [
  { num: '12,56,000+', label: 'Vehicles Checked', tone: 'red', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M3 13l2-5a2 2 0 012-1.5h10A2 2 0 0119 8l2 5v5a1 1 0 01-1 1h-1a1 1 0 01-1-1v-1H6v1a1 1 0 01-1 1H4a1 1 0 01-1-1v-5z" /><circle cx="7.5" cy="15.5" r="1.2" /><circle cx="16.5" cy="15.5" r="1.2" /></svg> },
  { num: '9,80,000+', label: 'RC Records Fetched', tone: 'blue', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h7l5 5v11a2 2 0 01-2 2z" /></svg> },
  { num: '₹18+ Crore', label: 'Challans Paid', tone: 'green', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M6 4h9a3 3 0 010 6H6m0-6v16m0-10h9M6 8h11" /></svg> },
  { num: '2.3 Seconds', label: 'Average Search Time', tone: 'amber', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="13" r="8" /><path strokeLinecap="round" d="M12 9v4l2.5 2M9 2h6" /></svg> },
]

const features = [
  { title: 'Check Challan', desc: 'Get real-time traffic challan details and pay online securely.', to: '/pay-challan', tone: 'red', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg> },
  { title: 'RC Details', desc: 'Access owner name, registration details, vehicle info & more.', to: '/rc-details', tone: 'blue', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h7l5 5v11a2 2 0 01-2 2z" /></svg> },
  { title: 'Service History', desc: 'View complete service and maintenance history of your vehicle.', to: '/service-history', tone: 'amber', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
  { title: 'Insurance', desc: 'Check insurance validity and expiry date instantly.', to: '/vehicle-info', tone: 'green', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3l7 3v5c0 4.5-3 8.5-7 10-4-1.5-7-5.5-7-10V6l7-3z" /></svg> },
  { title: 'PUC Status', desc: 'Verify PUC certificate status and validity in one click.', to: '/vehicle-info', tone: 'amber', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3C7 3 4 8 4 12s3 9 8 9 8-5 8-9-3-9-8-9z" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 2" /></svg> },
  { title: 'Fast Payments', desc: 'Pay challans securely using UPI, Cards, Net Banking & more.', to: '/pay-challan', tone: 'pink', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="5" width="18" height="14" rx="2" /><path strokeLinecap="round" d="M3 10h18" /></svg> },
]

const howItWorks = [
  { num: 1, title: 'Enter Vehicle Number', desc: 'Enter your vehicle number and select state.', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="11" cy="11" r="7" /><path strokeLinecap="round" d="M21 21l-4-4" /></svg> },
  { num: 2, title: 'We Fetch Records', desc: 'We fetch data from official government sources.', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h7l5 5v11a2 2 0 01-2 2z" /></svg> },
  { num: 3, title: 'View Results Instantly', desc: 'Get challan, RC, insurance & more in seconds.', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path strokeLinecap="round" strokeLinejoin="round" d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" /><circle cx="12" cy="12" r="3" /></svg> },
  { num: 4, title: 'Pay Securely Online', desc: 'Pay pending challans using multiple options.', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="3" y="5" width="18" height="14" rx="2" /><path strokeLinecap="round" d="M3 10h18M7 15h4" /></svg> },
]

const testimonials = [
  { name: 'Rahul Sharma', city: 'Delhi', color: '#dc2626', quote: 'Checked my challan in less than 10 seconds. Super fast and reliable!' },
  { name: 'Priya Kapoor', city: 'Bangalore', color: '#2563eb', quote: 'Very clean UI and accurate data. Highly recommended!' },
  { name: 'Amit Verma', city: 'Lucknow', color: '#059669', quote: 'Best platform to check RC details and pay challans online.' },
]

/* ── Contact Us section ── */
function ContactUsSection() {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' })
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await submitSupportMessage({
        name: formData.name,
        email: formData.email,
        message: formData.message,
        source: 'home-contact',
      })
      setSubmitted(true)
    } catch (err) {
      setError(err.message || 'Failed to send message')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="sec sec--gray">
      <div className="container-main">
        <div className="sec-head">
          <h2 className="sec-title">Contact Us</h2>
          <p className="sec-sub">We're here to help you</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 md:gap-8 lg:gap-12">
          {/* Left - Form */}
          <div>
            {submitted ? (
              <div className="surface-card p-8 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                  <svg className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-[17px] font-bold text-slate-900">Message Sent!</h3>
                <p className="mt-1 text-[14px] text-slate-500">Our team will get back to you shortly.</p>
                <button onClick={() => { setSubmitted(false); setFormData({ name: '', email: '', message: '' }) }} className="btn-primary mt-5">
                  Send Another
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="surface-card p-4 md:p-6 space-y-3 md:space-y-4">
                {error && <p className="text-[13px] text-rose-600">{error}</p>}
                <div>
                  <label className="field-label">Full Name</label>
                  <input type="text" required placeholder="Enter your full name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="input-field" />
                </div>
                <div>
                  <label className="field-label">Email Address</label>
                  <input type="email" required placeholder="Enter your email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="input-field" />
                </div>
                <div>
                  <label className="field-label">Message</label>
                  <textarea required rows={4} placeholder="Type your message..." value={formData.message} onChange={(e) => setFormData({ ...formData, message: e.target.value })} className="input-field resize-none" />
                </div>
                <button type="submit" className="btn-primary w-full" disabled={loading}>
                  {loading ? 'Sending…' : 'Send Message'}
                </button>
              </form>
            )}
          </div>

          {/* Right - Contact info */}
          <div className="space-y-4">
            <div className="surface-card p-5 space-y-4">
              <ContactRow label="Email" value="support@challanone.com" icon={<svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>} />
              <ContactRow label="Phone" value="+91 12345 67890" icon={<svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.04 11.04 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>} />
              <ContactRow label="Office" value="193, Tech Park, Sector 62, Noida, UP - 201301" icon={<svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 11a3 3 0 100-6 3 3 0 000 6z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7-7.5 11-7.5 11s-7.5-4-7.5-11a7.5 7.5 0 1115 0z" /></svg>} />
            </div>
            <div className="surface-card overflow-hidden">
              <MapPreview />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function ContactRow({ label, value, icon }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-brand-red">{icon}</div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-medium text-slate-500">{label}</p>
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
        <g stroke="#A5B4FC" strokeWidth="3" strokeLinecap="round">
          <line x1="0" y1="70" x2="400" y2="70" />
          <line x1="220" y1="0" x2="220" y2="160" />
        </g>
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
