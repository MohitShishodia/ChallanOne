import { Link } from 'react-router-dom'
import BrandLogo from '../components/BrandLogo'
import { BRAND, whatsappUrl, WHATSAPP } from '../constants/brand'

const values = [
  {
    title: 'Trusted & Transparent',
    desc: 'We guide you through every step of challan clearance with clear updates and no hidden surprises.',
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
  },
  {
    title: 'Expert Assistance',
    desc: 'Dedicated agents help you complete Parivahan OTP verification and challan settlement smoothly.',
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    title: 'Fast & Secure',
    desc: 'Check challans, pay online via Razorpay, and track your service history — all in one secure platform.',
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
]

export default function About() {
  return (
    <div className="screen">
      <div className="screen-content">
        <section className="bg-gradient-to-br from-red-50/80 via-white to-white border-b border-slate-100">
          <div className="container-main py-12 md:py-20">
            <div className="flex flex-col md:flex-row items-center gap-8 md:gap-14">
              <div className="shrink-0">
                <img src={BRAND.logoSrc} alt={BRAND.name} className="h-32 w-32 md:h-40 md:w-40 rounded-full object-cover border-4 border-white shadow-xl" />
              </div>
              <div className="text-center md:text-left max-w-2xl">
                <p className="text-[12px] font-bold uppercase tracking-widest text-brand-red mb-2">About Us</p>
                <h1 className="h-display">
                  {BRAND.name} — <span className="text-brand-red">{BRAND.tagline}</span>
                </h1>
                <p className="mt-4 text-[15px] md:text-[17px] text-slate-600 leading-relaxed">
                  Challan One is built for vehicle owners across India who need a reliable partner to check traffic challans,
                  pay fines securely, and complete government OTP verification with expert support.
                </p>
                <div className="mt-6 flex flex-wrap gap-3 justify-center md:justify-start">
                  <Link to="/pay-challan" className="btn-primary">Check Challan</Link>
                  <a href={whatsappUrl()} target="_blank" rel="noopener noreferrer" className="btn-secondary">
                    Talk to Expert
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="section-spacing bg-white">
          <div className="container-main">
            <div className="max-w-3xl mx-auto text-center mb-10">
              <h2 className="h-section">Our Mission</h2>
              <p className="mt-3 text-[15px] text-slate-600 leading-relaxed">
                Traffic challans can be confusing and time-consuming. We simplify the entire journey — from discovery to payment
                to post-payment agent support — so you can focus on the road, not paperwork.
              </p>
            </div>
            <div className="grid sm:grid-cols-3 gap-5 md:gap-8">
              {values.map((v) => (
                <div key={v.title} className="surface-card p-6 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-brand-red mb-4">
                    {v.icon}
                  </div>
                  <h3 className="text-[16px] font-bold text-slate-900">{v.title}</h3>
                  <p className="mt-2 text-[14px] text-slate-500 leading-relaxed">{v.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="section-spacing bg-slate-50">
          <div className="container-main max-w-3xl">
            <h2 className="h-section text-center mb-8">How We Help You</h2>
            <ol className="space-y-4">
              {[
                'Search your vehicle challan or RC details instantly.',
                'Pay pending challans online with secure Razorpay checkout.',
                'Receive a call from our agent (10 AM–8 PM) for Parivahan OTP verification.',
                'Track payments and service history from your profile anytime.',
              ].map((text, i) => (
                <li key={text} className="flex gap-4 surface-card p-4 md:p-5">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-red text-white text-[13px] font-bold">
                    {i + 1}
                  </span>
                  <p className="text-[14px] md:text-[15px] text-slate-700 leading-relaxed pt-0.5">{text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="section-spacing bg-white">
          <div className="container-main">
            <div className="expert-cta max-w-3xl mx-auto text-center">
              <BrandLogo linkTo={null} size="lg" className="mx-auto mb-4" />
              <h2 className="text-[20px] md:text-[24px] font-bold text-slate-900">Questions? We&apos;re here.</h2>
              <p className="mt-2 text-[14px] text-slate-600">
                Reach our team on WhatsApp at {WHATSAPP.display} or visit the support page.
              </p>
              <div className="mt-5 flex flex-wrap gap-3 justify-center">
                <a href={whatsappUrl()} target="_blank" rel="noopener noreferrer" className="btn-primary">
                  WhatsApp Us
                </a>
                <Link to="/support" className="btn-secondary">Support Center</Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
