/**
 * Illustrations using generated Indian-style images for the main heroes
 * and inline SVGs for smaller decorative elements.
 */

const imgStyle = {
  borderRadius: '16px',
  objectFit: 'cover',
  width: '100%',
  display: 'block',
}

export function HeroHomeIllustration({ className = '' }) {
  return (
    <img
      src="/indian_car_home.png"
      alt="Indian car on city road"
      className={className}
      style={imgStyle}
    />
  )
}

export function PoliceIllustration({ className = '' }) {
  return (
    <img
      src="/indian_police_challan.png"
      alt="Indian traffic police checking challan"
      className={className}
      style={imgStyle}
    />
  )
}

export function RcDocIllustration({ className = '' }) {
  return (
    <img
      src="/indian_rc_details.png"
      alt="Indian vehicle RC registration certificate"
      className={className}
      style={imgStyle}
    />
  )
}

export function CarRcIllustration({ className = '' }) {
  return (
    <img
      src="/indian_rc_details.png"
      alt="Indian vehicle RC details with car"
      className={className}
      style={imgStyle}
    />
  )
}

export function SupportIllustration({ className = '' }) {
  return (
    <img
      src="/support_hero.png"
      alt="Customer support team"
      className={className}
      style={imgStyle}
    />
  )
}

export function StepIcon({ name, className = '' }) {
  const icons = {
    enter: (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.6">
        <rect x="3" y="6" width="18" height="12" rx="2" />
        <path strokeLinecap="round" d="M7 12h7M7 9h4M7 15h2" />
      </svg>
    ),
    fetch: (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16a4 4 0 014-4 5 5 0 019.9-1A4 4 0 0118 19H8a4 4 0 01-4-3z" />
        <path strokeLinecap="round" d="M12 11v8m0 0l-3-3m3 3l3-3" />
      </svg>
    ),
    instant: (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l3-3 3 3 3-5 3 8 3-3 3 3" />
      </svg>
    ),
  }
  return icons[name]
}
