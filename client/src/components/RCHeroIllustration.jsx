export default function RCHeroIllustration({ className = '' }) {
  return (
    <svg
      className={className}
      viewBox="0 0 420 280"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Decorative background */}
      <circle cx="340" cy="60" r="80" fill="#dbeafe" opacity="0.5" />
      <circle cx="60" cy="220" r="50" fill="#dbeafe" opacity="0.35" />
      <g opacity="0.25">
        {[...Array(8)].map((_, i) => (
          <circle key={i} cx={30 + i * 50} cy={240 + (i % 2) * 8} r="2" fill="#2563eb" />
        ))}
      </g>

      {/* RC Document */}
      <g transform="translate(180, 20)">
        <rect x="0" y="0" width="160" height="210" rx="8" fill="#fff" stroke="#cbd5e1" strokeWidth="1.5" />
        <rect x="0" y="0" width="160" height="28" rx="8" fill="#f8fafc" />
        {/* Emblem */}
        <circle cx="80" cy="38" r="14" fill="#1e3a8a" opacity="0.15" />
        <circle cx="80" cy="38" r="8" fill="#1e3a8a" />
        <text x="80" y="58" textAnchor="middle" fill="#1e3a8a" fontSize="7" fontWeight="700" fontFamily="Inter, sans-serif">
          REGISTRATION
        </text>
        <text x="80" y="68" textAnchor="middle" fill="#1e3a8a" fontSize="7" fontWeight="700" fontFamily="Inter, sans-serif">
          CERTIFICATE
        </text>
        <line x1="20" y1="76" x2="140" y2="76" stroke="#e2e8f0" strokeWidth="1" />
        {[85, 100, 115, 130, 145, 160, 175].map((y, i) => (
          <rect key={y} x="20" y={y} width={i % 2 === 0 ? 120 : 90} height="6" rx="3" fill="#f1f5f9" />
        ))}
      </g>

      {/* Blue SUV */}
      <g transform="translate(30, 100)">
        {/* Body */}
        <path
          d="M20 80 L40 50 L120 50 L145 65 L155 80 L155 95 L20 95 Z"
          fill="#2563eb"
        />
        <path d="M45 50 L65 30 L105 30 L120 50 Z" fill="#1d4ed8" />
        {/* Windows */}
        <path d="M50 35 L68 35 L75 48 L47 48 Z" fill="#93c5fd" opacity="0.8" />
        <path d="M72 35 L102 35 L112 48 L78 48 Z" fill="#93c5fd" opacity="0.8" />
        {/* Wheels */}
        <circle cx="55" cy="95" r="16" fill="#1e293b" />
        <circle cx="55" cy="95" r="8" fill="#64748b" />
        <circle cx="130" cy="95" r="16" fill="#1e293b" />
        <circle cx="130" cy="95" r="8" fill="#64748b" />
        {/* Headlights */}
        <rect x="148" y="72" width="8" height="6" rx="2" fill="#fef08a" />
        {/* Grille */}
        <rect x="148" y="82" width="6" height="10" rx="1" fill="#1e40af" />
      </g>

      {/* Green verification shield */}
      <g transform="translate(310, 130)">
        <circle cx="40" cy="40" r="44" fill="#dcfce7" opacity="0.6" />
        <path
          d="M40 8 L12 20 v18 c0 16 12 30 28 34 16-4 28-18 28-34V20L40 8z"
          fill="#22c55e"
        />
        <path
          d="M28 40 l8 8 16-16"
          stroke="#fff"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </g>
    </svg>
  )
}
