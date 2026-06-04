import { useState } from 'react'
import { Link } from 'react-router-dom'
import { HeroHomeIllustration } from '../components/Illustrations'
import BrandLogo from '../components/BrandLogo'
import { whatsappUrl, WHATSAPP } from '../constants/brand'
import { submitSupportMessage } from '../utils/supportApi'

export default function Home() {
  return (
    <div className="screen">
      <div className="screen-content">
        {/* ── HERO SECTION ── */}
        <section className="bg-gradient-to-br from-red-50/60 via-white to-white">
          <div className="container-main py-5 md:py-20">
            <div className="grid md:grid-cols-2 gap-4 md:gap-12 items-center">
              {/* Left - Text */}
              <div className="space-y-3 md:space-y-6 animate-fade-up">
                <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-[11px] md:text-[12px] font-semibold text-emerald-700 border border-emerald-100">
                  <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" clipRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.7-9.3a1 1 0 00-1.4-1.4L9 10.6 7.7 9.3a1 1 0 00-1.4 1.4l2 2a1 1 0 001.4 0l4-4z" />
                  </svg>
                  India's Most Trusted Platform
                </div>
                <h1 className="h-display">
                  Check Vehicle Challan & RC Details{' '}
                  <span className="text-brand-red">in Seconds</span>
                </h1>
                <p className="text-[13px] md:text-[18px] leading-relaxed text-slate-500 max-w-lg">
                  Fast, secure and reliable platform for checking traffic challans and vehicle registration details across India.
                </p>
                <div className="flex flex-col sm:flex-row gap-2.5 md:gap-3 pt-1 md:pt-2">
                  <Link to="/pay-challan" className="btn-primary">
                    Check Challan
                  </Link>
                  <Link to="/vehicle-info" className="btn-secondary">
                    Check RC Details
                  </Link>
                </div>
              </div>

              {/* Right - Illustration */}
              <div className="animate-fade-up relative mt-2 md:mt-0">
                <div className="hero-illu h-[40vh] md:h-auto md:max-h-none">
                  <HeroHomeIllustration className="w-full h-full object-cover" />
                </div>
                {/* Floating status card */}
                <div className="absolute bottom-2 left-2 md:left-auto md:-right-4 md:-bottom-6 w-[170px] md:w-[240px] surface-card animate-float p-2.5 md:p-4 z-10">
                  <div className="mb-1 flex items-center justify-between">
                    <p className="text-[10px] font-semibold text-slate-500">Challan Status</p>
                    <span className="pill pill-pending text-[9px]">Pending</span>
                  </div>
                  <p className="text-[10px] text-slate-500">Amount</p>
                  <p className="text-[16px] md:text-[20px] font-bold text-slate-900 leading-tight">₹ 2,500</p>
                  <div className="mt-1 grid grid-cols-2 text-[10px]">
                    <div>
                      <p className="text-slate-500">Due Date</p>
                      <p className="font-semibold text-slate-900">12 May 2024</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-1 border-t border-slate-100 pt-1.5 mt-1.5 text-[10px]">
                    <div>
                      <p className="text-slate-500">RC Details</p>
                      <p className="font-semibold text-slate-900 truncate">UP32AB1234</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Owner</p>
                      <p className="font-semibold text-slate-900 truncate">Amit Sharma</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── CONNECT WITH EXPERT ── */}
        <section className="bg-white border-y border-slate-100">
          <div className="container-main py-10 md:py-14">
            <div className="expert-cta grid md:grid-cols-2 gap-6 items-center">
              <div>
                <p className="text-[12px] font-bold uppercase tracking-widest text-brand-red mb-2">Need help?</p>
                <h2 className="text-[22px] md:text-[28px] font-bold text-slate-900 leading-tight">
                  Connect with an Expert
                </h2>
                <p className="mt-3 text-[14px] md:text-[15px] text-slate-600 leading-relaxed">
                  Talk to our challan clearance experts on WhatsApp for payment help, OTP verification, and vehicle queries.
                </p>
                <a
                  href={whatsappUrl('Hi! I would like to connect with a Challan One expert.')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary mt-5 inline-flex"
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  Chat on WhatsApp
                </a>
                <p className="mt-2 text-[12px] text-slate-500">{WHATSAPP.display}</p>
              </div>
              <div className="hidden md:flex justify-center">
                <div className="surface-card p-6 max-w-sm w-full">
                  <ul className="space-y-3 text-[14px] text-slate-600">
                    <li className="flex gap-2"><span className="text-brand-red font-bold">✓</span> Challan payment guidance</li>
                    <li className="flex gap-2"><span className="text-brand-red font-bold">✓</span> Parivahan OTP support</li>
                    <li className="flex gap-2"><span className="text-brand-red font-bold">✓</span> RC & vehicle queries</li>
                    <li className="flex gap-2"><span className="text-brand-red font-bold">✓</span> Available 10 AM – 8 PM</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── STATS ── */}
        <section className="bg-white border-b border-slate-100">
          <div className="container-main py-6 md:py-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
              <Stat title="20K+" subtitle="Active Users" />
              <Stat title="50K+" subtitle="Searches Done" />
              <Stat title="99.9%" subtitle="Accuracy Rate" />
              <Stat title="100%" subtitle="Secure & Encrypted" />
            </div>
          </div>
        </section>

        {/* ── FEATURES ── */}
        <section className="section-spacing bg-slate-50">
          <div className="container-main">
            <div className="text-center max-w-2xl mx-auto mb-6 md:mb-14">
              <h2 className="h-section">Everything You Need in One Place</h2>
              <p className="mt-2 text-[14px] md:text-[16px] text-slate-500">Powerful features to help you stay compliant and avoid penalties</p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              <FeatureCard
                tone="red"
                title="Instant Challan Check"
                desc="Check pending or paid challans by vehicle number instantly."
                to="/pay-challan"
                icon={
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                }
              />
              <FeatureCard
                tone="emerald"
                title="RC Details Lookup"
                desc="Get detailed registration and ownership information."
                to="/vehicle-info"
                icon={
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h7l5 5v11a2 2 0 01-2 2z" />
                  </svg>
                }
              />
              <FeatureCard
                tone="amber"
                title="Secure & Private"
                desc="Your data is encrypted, never stored or shared."
                to="/support"
                icon={
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 11c-1.66 0-3 1.34-3 3 0 1.31.84 2.41 2 2.83V19a1 1 0 002 0v-2.17c1.16-.42 2-1.52 2-2.83 0-1.66-1.34-3-3-3zm6-2V7a6 6 0 10-12 0v2a3 3 0 00-3 3v7a3 3 0 003 3h12a3 3 0 003-3v-7a3 3 0 00-3-3zM8 7a4 4 0 118 0v2H8V7z" />
                  </svg>
                }
              />
            </div>
          </div>
        </section>

        {/* ── HOW IT WORKS ── */}
        <section className="section-spacing bg-white">
          <div className="container-main">
            <div className="text-center max-w-2xl mx-auto mb-6 md:mb-14">
              <h2 className="h-section">How It Works</h2>
              <p className="mt-2 text-[14px] md:text-[16px] text-slate-500">Get your vehicle information in 3 simple steps</p>
            </div>
            <div className="grid sm:grid-cols-3 gap-6 md:gap-12 max-w-4xl mx-auto">
              {howItWorksSteps.map((step, idx) => (
                <div key={step.num} className="text-center animate-fade-up">
                  <div className="mx-auto flex h-14 w-14 md:h-16 md:w-16 items-center justify-center rounded-2xl bg-red-50 text-brand-red shadow-[0_2px_8px_-2px_rgba(220,38,38,0.25)] mb-3 md:mb-5">
                    {step.icon}
                  </div>
                  <p className="text-[11px] font-bold tracking-widest text-brand-red mb-1">{step.num}</p>
                  <p className="text-[16px] md:text-[17px] font-bold text-slate-900">{step.title}</p>
                  <p className="text-[13px] md:text-[14px] text-slate-500 mt-1.5 md:mt-2 leading-relaxed">{step.desc}</p>
                </div>
              ))}
            </div>
            <div className="mt-8 md:mt-12 max-w-2xl mx-auto">
              <div className="trust-card">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50 text-brand-red">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 11c-1.66 0-3 1.34-3 3 0 1.31.84 2.41 2 2.83V19a1 1 0 002 0v-2.17c1.16-.42 2-1.52 2-2.83 0-1.66-1.34-3-3-3zm6-2V7a6 6 0 10-12 0v2a3 3 0 00-3 3v7a3 3 0 003 3h12a3 3 0 003-3v-7a3 3 0 00-3-3zM8 7a4 4 0 118 0v2H8V7z" />
                  </svg>
                </div>
                <p>
                  <span className="font-semibold text-slate-900">Your data is encrypted and secure.</span><br />
                  We never store your personal information.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── CONTACT US ── */}
        <ContactUsSection />

        {/* ── FOOTER ── */}
        <footer className="site-footer">
          <div className="container-main">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 mb-6 md:mb-10">
              <div>
                <div className="mb-4">
                  <BrandLogo linkTo="/" size="sm" variant="light" />
                </div>
                <p className="text-[13px] text-slate-400 leading-relaxed">India's most trusted platform for checking traffic challans and vehicle registration details.</p>
              </div>
              <div>
                <h4 className="text-[13px] font-semibold text-white tracking-wider uppercase mb-4">Quick Links</h4>
                <div className="space-y-2.5">
                  <Link to="/pay-challan" className="block text-[14px]">Check Challan</Link>
                  <Link to="/vehicle-info" className="block text-[14px]">RC Details</Link>
                  <Link to="/service-history" className="block text-[14px]">Service History</Link>
                  <Link to="/about" className="block text-[14px]">About Us</Link>
                </div>
              </div>
              <div>
                <h4 className="text-[13px] font-semibold text-white tracking-wider uppercase mb-4">Support</h4>
                <div className="space-y-2.5">
                  <Link to="/support" className="block text-[14px]">Help Center</Link>
                  <a href="mailto:support@challanone.com" className="block text-[14px]">support@challanone.com</a>
                  <a href={`tel:+${WHATSAPP.number}`} className="block text-[14px]">{WHATSAPP.display}</a>
                </div>
              </div>
              <div>
                <h4 className="text-[13px] font-semibold text-white tracking-wider uppercase mb-4">Office</h4>
                <p className="text-[14px] leading-relaxed">193, Tech Park, Sector 62,<br />Noida, UP - 201301</p>
              </div>
            </div>
            <div className="border-t border-slate-800 pt-6 text-center text-[13px]">
              © {new Date().getFullYear()} ChallanOne. All rights reserved.
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}

/* ── How It Works data ── */
const howItWorksSteps = [
  {
    num: '01',
    title: 'Enter Vehicle Number',
    desc: 'Enter your vehicle number in the search box.',
    icon: (
      <svg className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.7" viewBox="0 0 24 24">
        <rect x="3" y="6" width="18" height="12" rx="2" />
        <path strokeLinecap="round" d="M7 12h7M7 9h4M7 15h2" />
      </svg>
    ),
  },
  {
    num: '02',
    title: 'Fetch Data Securely',
    desc: 'Our system fetches data from official sources.',
    icon: (
      <svg className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.7" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4l8 4v6c0 4.5-3.5 8-8 9-4.5-1-8-4.5-8-9V8l8-4z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.5 12.5l1.8 1.8L15 10.5" />
      </svg>
    ),
  },
  {
    num: '03',
    title: 'View Results Instantly',
    desc: 'Get instant results with accurate information.',
    icon: (
      <svg className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.7" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l3-3 3 3 3-5 3 8 3-3 3 3" />
      </svg>
    ),
  },
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
    <section className="section-spacing bg-slate-50">
      <div className="container-main">
        <div className="text-center max-w-2xl mx-auto mb-6 md:mb-10">
          <h2 className="h-section">Contact Us</h2>
          <p className="mt-2 text-[14px] md:text-[15px] text-slate-500">We're here to help you</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 md:gap-8 max-w-4xl mx-auto">
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

function Stat({ title, subtitle }) {
  return (
    <div className="text-center py-2">
      <p className="text-[24px] md:text-[28px] font-bold text-slate-900 leading-tight">{title}</p>
      <p className="text-[13px] font-medium text-slate-500 mt-1">{subtitle}</p>
    </div>
  )
}

function FeatureCard({ icon, title, desc, to, tone = 'red' }) {
  const tones = {
    red: 'bg-red-50 text-brand-red',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
  }
  return (
    <Link to={to} className="surface-card flex flex-col items-start gap-4 p-6 transition hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.99]">
      <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${tones[tone]}`}>{icon}</div>
      <div>
        <p className="text-[16px] font-semibold text-slate-900">{title}</p>
        <p className="text-[14px] text-slate-500 leading-relaxed mt-1">{desc}</p>
      </div>
      <span className="text-[13px] font-semibold text-brand-red inline-flex items-center gap-1 mt-auto">
        Learn more
        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </span>
    </Link>
  )
}
