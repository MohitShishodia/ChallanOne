import { Link } from 'react-router-dom'
import BrandLogo from '../components/BrandLogo'
import PageTitleBar from '../components/PageTitleBar'
import { useCmsPage } from '../hooks/useCmsPage'
import { BRAND, whatsappUrl, WHATSAPP } from '../constants/brand'

const defaultValues = [
  { title: 'Trusted & Transparent', desc: 'Clear updates through every step of challan clearance.' },
  { title: 'Expert Assistance', desc: 'Agents help with Parivahan OTP and settlement.' },
  { title: 'Fast & Secure', desc: 'Check, pay, and track — all in one secure platform.' },
]

export default function About() {
  const { page, loading } = useCmsPage('about-us')

  const heroTitle = page?.title || BRAND.name
  const tagline = BRAND.tagline

  return (
    <div className="screen">
      <div className="screen-content">
        <PageTitleBar title="About Us" subtitle={page?.metaDescription || tagline} />

        <section className="bg-gradient-to-br from-red-50/80 via-white to-white border-b border-slate-100">
          <div className="container-main py-6 md:py-16">
            <div className="flex flex-col md:flex-row items-center gap-5 md:gap-14">
              <div className="shrink-0">
                <img
                  src={BRAND.logoSrc}
                  alt={BRAND.name}
                  className="h-24 w-auto md:h-36 max-w-[200px] md:max-w-[280px] object-contain"
                />
              </div>
              <div className="text-center md:text-left max-w-2xl">
                <p className="text-[11px] font-bold uppercase tracking-widest text-brand-red mb-1">About Us</p>
                <h1 className="text-[20px] md:text-[36px] font-bold text-slate-900 leading-tight">
                  {heroTitle}
                </h1>
                <p className="mt-2 text-[13px] md:text-[16px] text-slate-600 leading-relaxed">
                  {tagline}
                </p>
                <div className="mt-4 flex flex-wrap gap-2 justify-center md:justify-start">
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
          <div className="container-main max-w-3xl">
            {loading ? (
              <div className="animate-pulse space-y-3">
                <div className="h-4 bg-slate-100 rounded w-full" />
                <div className="h-4 bg-slate-100 rounded w-5/6" />
                <div className="h-4 bg-slate-100 rounded w-4/6" />
              </div>
            ) : page?.content ? (
              <div
                className="cms-content surface-card p-5 md:p-8 animate-fade-up"
                dangerouslySetInnerHTML={{ __html: page.content }}
              />
            ) : (
              <div className="cms-content animate-fade-up">
                <p>
                  Challan One is built for vehicle owners across India who need a reliable partner to check traffic challans,
                  pay fines securely, and complete government OTP verification with expert support.
                </p>
              </div>
            )}

            <div className="grid sm:grid-cols-3 gap-3 md:gap-6 mt-8">
              {defaultValues.map((v) => (
                <div key={v.title} className="surface-card p-4 md:p-6 text-center">
                  <h3 className="text-[14px] md:text-[16px] font-bold text-slate-900">{v.title}</h3>
                  <p className="mt-1 text-[12px] md:text-[14px] text-slate-500 leading-relaxed">{v.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="section-spacing bg-slate-50">
          <div className="container-main">
            <div className="expert-cta max-w-3xl mx-auto text-center">
              <BrandLogo linkTo={null} size="md" className="mx-auto mb-3" />
              <h2 className="text-[18px] md:text-[24px] font-bold text-slate-900">Questions? We&apos;re here.</h2>
              <p className="mt-2 text-[13px] md:text-[14px] text-slate-600">
                Reach us on WhatsApp at {WHATSAPP.display} or visit support.
              </p>
              <div className="mt-4 flex flex-wrap gap-2 justify-center">
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
