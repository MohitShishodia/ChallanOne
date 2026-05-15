import { useState } from 'react'
import { Link } from 'react-router-dom'
import { HeroHomeIllustration, SupportIllustration } from '../components/Illustrations'

export default function Home() {
  return (
    <div className="screen">
      <div className="screen-content">
        {/* ── HERO SECTION ── */}
        <section className="bg-gradient-to-br from-blue-50 via-sky-50 to-white">
          <div className="container-main py-12 md:py-20">
            <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
              {/* Left - Text */}
              <div className="space-y-6 animate-fade-up">
                <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-[12px] font-semibold text-emerald-700 border border-emerald-100">
                  <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" clipRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.7-9.3a1 1 0 00-1.4-1.4L9 10.6 7.7 9.3a1 1 0 00-1.4 1.4l2 2a1 1 0 001.4 0l4-4z" />
                  </svg>
                  India's Most Trusted Platform
                </div>
                <h1 className="h-display">
                  Check Vehicle<br />
                  Challan & RC Details<br />
                  <span className="text-blue-600">in Seconds</span>
                </h1>
                <p className="text-[16px] md:text-[18px] leading-relaxed text-slate-500 max-w-lg">
                  Fast, secure and reliable platform for checking traffic challans and vehicle registration details across India.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <Link to="/pay-challan" className="btn-primary">
                    Check Challan
                  </Link>
                  <Link to="/vehicle-info" className="btn-secondary">
                    Check RC Details
                  </Link>
                </div>
              </div>

              {/* Right - Illustration */}
              <div className="animate-fade-up relative">
                <div className="hero-illu">
                  <HeroHomeIllustration className="w-full" />
                </div>
                {/* Floating status card */}
                <div className="absolute -bottom-4 -left-4 md:left-auto md:-right-4 md:-bottom-6 w-[240px] surface-card animate-float p-4 z-10">
                  <div className="mb-1 flex items-center justify-between">
                    <p className="text-[10px] font-semibold text-slate-500">Challan Status</p>
                    <span className="pill pill-pending text-[9px]">Pending</span>
                  </div>
                  <p className="text-[10px] text-slate-500">Amount</p>
                  <p className="text-[20px] font-bold text-slate-900 leading-tight">₹ 2,500</p>
                  <div className="mt-1 grid grid-cols-2 text-[10px]">
                    <div>
                      <p className="text-slate-500">Due Date</p>
                      <p className="font-semibold text-slate-900">12 May 2024</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-1 border-t border-slate-100 pt-2 mt-2 text-[10px]">
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

        {/* ── STATS ── */}
        <section className="bg-white border-b border-slate-100">
          <div className="container-main py-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
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
            <div className="text-center max-w-2xl mx-auto mb-10 md:mb-14">
              <h2 className="h-section">Everything You Need in One Place</h2>
              <p className="mt-2 text-[15px] md:text-[16px] text-slate-500">Powerful features to help you stay compliant and avoid penalties</p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
              <FeatureCard
                tone="blue"
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
            <div className="text-center max-w-2xl mx-auto mb-10 md:mb-14">
              <h2 className="h-section">How It Works</h2>
              <p className="mt-2 text-[15px] md:text-[16px] text-slate-500">Get your vehicle information in 3 simple steps</p>
            </div>
            <div className="grid sm:grid-cols-3 gap-8 md:gap-12 max-w-4xl mx-auto">
              {howItWorksSteps.map((step, idx) => (
                <div key={step.num} className="text-center animate-fade-up">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 shadow-[0_2px_8px_-2px_rgba(37,99,235,0.25)] mb-5">
                    {step.icon}
                  </div>
                  <p className="text-[11px] font-bold tracking-widest text-blue-600 mb-1">{step.num}</p>
                  <p className="text-[17px] font-bold text-slate-900">{step.title}</p>
                  <p className="text-[14px] text-slate-500 mt-2 leading-relaxed">{step.desc}</p>
                </div>
              ))}
            </div>
            <div className="mt-12 max-w-2xl mx-auto">
              <div className="trust-card">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
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
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
              <div>
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
                    <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <span className="text-[16px] font-bold text-white">
                    Challan<span className="text-blue-400">One</span>
                  </span>
                </div>
                <p className="text-[13px] text-slate-400 leading-relaxed">India's most trusted platform for checking traffic challans and vehicle registration details.</p>
              </div>
              <div>
                <h4 className="text-[13px] font-semibold text-white tracking-wider uppercase mb-4">Quick Links</h4>
                <div className="space-y-2.5">
                  <Link to="/pay-challan" className="block text-[14px]">Check Challan</Link>
                  <Link to="/vehicle-info" className="block text-[14px]">RC Details</Link>
                  <Link to="/history" className="block text-[14px]">History</Link>
                </div>
              </div>
              <div>
                <h4 className="text-[13px] font-semibold text-white tracking-wider uppercase mb-4">Support</h4>
                <div className="space-y-2.5">
                  <Link to="/support" className="block text-[14px]">Help Center</Link>
                  <a href="mailto:support@challanone.com" className="block text-[14px]">support@challanone.com</a>
                  <a href="tel:+911234567890" className="block text-[14px]">+91 12345 67890</a>
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

  const handleSubmit = (e) => {
    e.preventDefault()
    setSubmitted(true)
  }

  return (
    <section className="section-spacing bg-slate-50">
      <div className="container-main">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="h-section">Contact Us</h2>
          <p className="mt-2 text-[15px] text-slate-500">We're here to help you</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
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
              <form onSubmit={handleSubmit} className="surface-card p-6 space-y-4">
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
                <button type="submit" className="btn-primary w-full">Send Message</button>
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
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">{icon}</div>
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

function FeatureCard({ icon, title, desc, to, tone = 'blue' }) {
  const tones = {
    blue: 'bg-blue-50 text-blue-600',
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
      <span className="text-[13px] font-semibold text-blue-600 inline-flex items-center gap-1 mt-auto">
        Learn more
        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </span>
    </Link>
  )
}
