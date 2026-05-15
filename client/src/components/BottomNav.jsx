import { Link, useLocation } from 'react-router-dom'

const tabs = [
  {
    to: '/',
    label: 'Home',
    activeFor: ['/', '/pay-challan', '/vehicle-info', '/payment-success'],
    icon: (active) => (
      <svg className="h-5 w-5" fill={active ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 11.5L12 4l9 7.5V20a1 1 0 01-1 1h-5v-6h-6v6H4a1 1 0 01-1-1v-8.5z" />
      </svg>
    ),
  },
  {
    to: '/history',
    label: 'History',
    activeFor: ['/history'],
    icon: (active) => (
      <svg className="h-5 w-5" fill={active ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 2m6-2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    to: '/support',
    label: 'Support',
    activeFor: ['/support'],
    icon: (active) => (
      <svg className="h-5 w-5" fill={active ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
  },
  {
    to: '/profile',
    label: 'Profile',
    activeFor: ['/profile', '/login'],
    icon: (active) => (
      <svg className="h-5 w-5" fill={active ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 11a4 4 0 10-8 0 4 4 0 008 0zM4 21a8 8 0 0116 0" />
      </svg>
    ),
  },
]

export default function BottomNav() {
  const { pathname } = useLocation()

  return (
    <nav className="bottom-nav">
      <div className="flex items-stretch px-2 py-1.5">
        {tabs.map((tab) => {
          const active = tab.activeFor.includes(pathname)
          return (
            <Link
              key={tab.to}
              to={tab.to}
              className={`nav-tab ${active ? 'nav-tab-active' : ''}`}
              aria-label={tab.label}
            >
              <span className={`nav-tab-icon-wrap flex h-8 w-12 items-center justify-center rounded-full transition`}>
                {tab.icon(active)}
              </span>
              <span className="leading-none">{tab.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
