import { Link } from 'react-router-dom'
import './About.css'

/* Inline stroke icons (24x24) — same idiom as the rest of the client app */
const icons = {
  home: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 10.5L12 3l9 7.5" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 9.5V20a1 1 0 001 1h12a1 1 0 001-1V9.5" />
    </svg>
  ),
  arrow: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  ),
  grid: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <rect x="4" y="4" width="7" height="7" rx="1.5" />
      <rect x="13" y="4" width="7" height="7" rx="1.5" />
      <rect x="4" y="13" width="7" height="7" rx="1.5" />
      <rect x="13" y="13" width="7" height="7" rx="1.5" />
    </svg>
  ),
  shield: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3l7 2.8v5.4c0 4.5-2.9 8.6-7 9.8-4.1-1.2-7-5.3-7-9.8V5.8L12 3z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.3 11.8l2 2 3.6-3.9" />
    </svg>
  ),
  bolt: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 2L4.8 13h6.4l-1.2 9L19.2 11h-6.4L13 2z" />
    </svg>
  ),
  lock: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 11V8a4 4 0 018 0v3M12 14.5v2" />
    </svg>
  ),
  headset: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 14.5v-2.75a8 8 0 0116 0v2.75" />
      <rect x="3" y="13.5" width="4.5" height="6.5" rx="2.2" />
      <rect x="16.5" y="13.5" width="4.5" height="6.5" rx="2.2" />
    </svg>
  ),
  users: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M22 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
    </svg>
  ),
  receipt: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 3h14v18l-2.3-1.6-2.35 1.6-2.35-1.6-2.35 1.6L7.3 19.4 5 21V3z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 8h6M9 12h6" />
    </svg>
  ),
  clock: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5V12l3 2" />
    </svg>
  ),
  landmark: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 9.5L12 3l9 6.5H3z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M5.5 9.5V17M10 9.5V17M14 9.5V17M18.5 9.5V17M4 17h16M3 21h18" />
    </svg>
  ),
  database: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <ellipse cx="12" cy="5.5" rx="8" ry="3" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 5.5v13c0 1.66 3.58 3 8 3s8-1.34 8-3v-13" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 12c0 1.66 3.58 3 8 3s8-1.34 8-3" />
    </svg>
  ),
  phone: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <rect x="7" y="2.5" width="10" height="19" rx="2.5" />
      <path strokeLinecap="round" d="M11 18h2" />
    </svg>
  ),
  card: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <rect x="2.5" y="5" width="19" height="14" rx="2.5" />
      <path strokeLinecap="round" d="M2.5 10h19M6 15h4" />
    </svg>
  ),
  checkCircle: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.5 12.2l2.4 2.4 4.6-5" />
    </svg>
  ),
  car: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 11l1.3-3.6A2 2 0 019.2 6h5.6a2 2 0 011.9 1.4L18 11" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 11h16a1 1 0 011 1v4h-2.2M3 16v-4a1 1 0 011-1m-1 5h2.2m13.6 0H7.2" />
      <path strokeLinecap="round" strokeWidth="2.4" d="M7.5 13.7h.01M16.5 13.7h.01" />
    </svg>
  ),
}

const MISSION_CARDS = [
  { icon: icons.shield, title: 'Trusted & Reliable', desc: 'We provide verified data from official government sources you can trust.' },
  { icon: icons.bolt, title: 'Fast & Convenient', desc: 'Check, pay, and track challans in just a few clicks, anytime, anywhere.' },
  { icon: icons.lock, title: 'Secure & Private', desc: 'Your data is 100% safe with enterprise-grade security and privacy.' },
  { icon: icons.headset, title: 'Here to Help', desc: 'Our support team is always ready to assist you at every step.' },
]

const STATS = [
  { icon: icons.users, value: '1,20,000+', label: 'Happy Users', sub: 'Across India' },
  { icon: icons.shield, value: '50L+', label: 'Challans Checked', sub: 'And Paid' },
  { icon: icons.receipt, value: '25L+', label: 'Payments Processed', sub: 'Securely' },
  { icon: icons.clock, value: '99.9%', label: 'Uptime', sub: 'Always Available' },
]

const WHY_ITEMS = [
  { icon: icons.landmark, title: 'Government Integrated' },
  { icon: icons.database, title: 'Accurate & Real-time Data' },
  { icon: icons.phone, title: 'Mobile Friendly Experience' },
  { icon: icons.card, title: 'Multiple Payment Options' },
  { icon: icons.shield, title: 'Safe & Secure Transactions' },
]

export default function About() {
  return (
    <div className="about-page">
      {/* Hero */}
      <section className="abt-hero">
        <div className="abt-hero-dots" aria-hidden="true" />
        <div className="container-main abt-hero-inner">
          <div>
            <span className="abt-crumb">
              {icons.home}
              About Us
            </span>
            <h1 className="abt-hero-title">About ChallanOne</h1>
            <p className="abt-hero-lead">
              India&apos;s leading platform for <span className="accent">online challan payment</span> and
              vehicle information services.
            </p>
            <p className="abt-hero-sub">
              We are committed to making vehicle compliance simple, fast, and hassle-free for every
              Indian driver.
            </p>
            <div className="abt-hero-actions">
              <Link to="/pay-challan" className="btn-primary">
                Check Challan
                {icons.arrow}
              </Link>
              <a href="#why-choose" className="btn-secondary">
                {icons.grid}
                Explore Services
              </a>
            </div>
          </div>
          <div className="abt-hero-art">
            <img
              src="/about_hero.png"
              alt="Car with registration certificate and security shield"
            />
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="abt-mission">
        <div className="container-main">
          <div className="abt-head">
            <h2>Our Mission</h2>
            <div className="abt-head-bar" aria-hidden="true" />
            <p>
              To empower every vehicle owner with accurate information and seamless digital solutions
              for a smarter, more compliant India.
            </p>
          </div>
          <div className="abt-mission-grid">
            {MISSION_CARDS.map((card) => (
              <div key={card.title} className="abt-mission-card">
                <div className="abt-mission-icon">{card.icon}</div>
                <h3>{card.title}</h3>
                <p>{card.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Numbers */}
      <section className="abt-numbers">
        <div className="container-main">
          <div className="abt-numbers-panel">
            <div className="abt-head">
              <h2>ChallanOne in Numbers</h2>
              <div className="abt-head-bar" aria-hidden="true" />
              <p>Our impact in simplifying vehicle compliance across India.</p>
            </div>
            <div className="abt-numbers-grid">
              {STATS.map((stat) => (
                <div key={stat.label} className="abt-number-card">
                  <div className="abt-number-icon">{stat.icon}</div>
                  <div className="abt-number-value">{stat.value}</div>
                  <div className="abt-number-label">{stat.label}</div>
                  <div className="abt-number-sub">{stat.sub}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Why choose */}
      <section className="abt-why" id="why-choose">
        <div className="container-main">
          <div className="abt-head">
            <h2>Why Choose ChallanOne?</h2>
            <div className="abt-head-bar" aria-hidden="true" />
          </div>
          <div className="abt-why-grid">
            {WHY_ITEMS.map((item) => (
              <div key={item.title} className="abt-why-item">
                <div className="abt-why-icon">{item.icon}</div>
                <h3>{item.title}</h3>
                <svg
                  className="abt-why-check"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="12" r="9" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.5 12.2l2.4 2.4 4.6-5" />
                </svg>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="abt-cta-wrap">
        <div className="container-main">
          <div className="abt-cta">
            <div className="abt-cta-icon">{icons.car}</div>
            <div className="abt-cta-body">
              <h2>Ready to Get Started?</h2>
              <p>
                Check your challan, view RC details, and keep your vehicle compliant in just a few
                clicks.
              </p>
            </div>
            <Link to="/pay-challan" className="btn-primary">
              Check Challan Now
              {icons.arrow}
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
