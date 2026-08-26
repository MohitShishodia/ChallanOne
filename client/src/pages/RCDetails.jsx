import { useState, useRef, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useFeatures } from '../context/FeatureContext'
import SearchLoadingOverlay from '../components/SearchLoadingOverlay'
import { fetchVehicleInfo } from '../utils/vehicleInfo'
import { openReportPending, completeReportWindow, failReportWindow } from '../utils/rcReport'
import { getRecentSearches, formatRecentSearchTime } from '../utils/recentSearches'
import './RCDetails.css'

const VEHICLE_REGEX = /^[A-Z]{2}\d{1,2}[A-Z]{1,3}\d{1,4}$/

const PREMIUM_FEATURES_LEFT = [
  'Full RC Details',
  'Owner & Registration Info',
  'RTO & Vehicle Details',
]

const PREMIUM_FEATURES_RIGHT = [
  'Engine & Chassis Number',
  'Insurance & Fitness Info',
  'Downloadable PDF Report',
]

export default function RCDetails() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { isFeatureEnabled } = useFeatures()

  const [vehicleNumber, setVehicleNumber] = useState(() => searchParams.get('vehicle') || '')
  const [error, setError] = useState('')
  const [premiumLoading, setPremiumLoading] = useState(false)
  const inputRef = useRef(null)

  const rcEnabled = isFeatureEnabled('rc_details')
  // Recents refresh on mount — coming back from the results page re-reads storage.
  const recents = useMemo(() => getRecentSearches({ type: 'rc', limit: 3 }), [])

  const normalize = (raw) => String(raw || '').trim().toUpperCase().replace(/\s/g, '')

  // Search validates here, then moves to the dedicated results page.
  const handleSearch = () => {
    const trimmed = normalize(vehicleNumber)
    if (!trimmed) {
      setError('Please enter a vehicle registration number')
      return
    }
    if (!VEHICLE_REGEX.test(trimmed)) {
      setError('Please enter a valid registration number (e.g. UP32AB1234)')
      return
    }
    if (!rcEnabled) {
      setError('RC Details lookup has been disabled. Please check back later.')
      return
    }
    setError('')
    setVehicleNumber(trimmed)
    navigate(`/vehicle-info?vehicle=${encodeURIComponent(trimmed)}`)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSearch()
  }

  const searchFor = (number) => {
    const trimmed = normalize(number)
    if (!trimmed) return
    setVehicleNumber(trimmed)
    navigate(`/vehicle-info?vehicle=${encodeURIComponent(trimmed)}`)
  }

  // Premium report: opens the new tab inside the click gesture (so popup
  // blockers allow it), then fills the report once the fetch resolves.
  const handlePremiumReport = async () => {
    const trimmed = normalize(vehicleNumber)
    if (!trimmed) {
      setError('Please enter a vehicle registration number')
      inputRef.current?.focus()
      return
    }
    if (!VEHICLE_REGEX.test(trimmed)) {
      setError('Please enter a valid registration number (e.g. UP32AB1234)')
      return
    }
    setError('')
    const reportWindow = openReportPending(trimmed)
    if (!reportWindow) return
    setPremiumLoading(true)
    try {
      const vehicle = await fetchVehicleInfo(trimmed)
      completeReportWindow(reportWindow, vehicle)
    } catch (err) {
      failReportWindow(reportWindow, err.message || 'Network error. Please try again.')
      setError(err.message || 'Network error. Please try again.')
    } finally {
      setPremiumLoading(false)
    }
  }

  return (
    <div className="rc-details-page">
      <SearchLoadingOverlay open={premiumLoading} type="rc" vehicleNumber={vehicleNumber} />
      <div className="rc-page-body">
        <div className="rc-page-inner">
          {/* Hero card */}
          <div className="rc-hero-card">
            <div className="rc-hero-grid">
              <div className="rc-hero-left">
                <div className="rc-verified-badge">
                  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z" />
                  </svg>
                  Verified Vehicle Information
                </div>

                <h1 className="rc-hero-title">Check Your Vehicle <span className="accent">RC Details</span></h1>
                <p className="rc-hero-subtitle">Enter your vehicle registration number to get instant RC details.</p>

                <div className="rc-search-group">
                  <div className="rc-search-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 11l1.3-3.6A2 2 0 019.2 6h5.6a2 2 0 011.9 1.4L18 11" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 11h16a1 1 0 011 1v4h-2.2M3 16v-4a1 1 0 011-1m-1 5h2.2m13.6 0H7.2" />
                      <path strokeLinecap="round" strokeWidth="2.4" d="M7.5 13.7h.01M16.5 13.7h.01" />
                    </svg>
                  </div>
                  <input
                    ref={inputRef}
                    type="text"
                    className="rc-search-input"
                    placeholder="Enter vehicle number (e.g. UP32AB1234)"
                    value={vehicleNumber}
                    onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
                    onKeyDown={handleKeyDown}
                  />
                  <button type="button" className="rc-search-btn" onClick={handleSearch}>
                    Check RC Details
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M13 6l6 6-6 6" />
                    </svg>
                  </button>
                </div>

                {error && <p className="rc-search-error">{error}</p>}
                {!rcEnabled && (
                  <p className="rc-search-error">RC Details lookup is temporarily unavailable. Please check back later.</p>
                )}
              </div>

              <div className="rc-hero-right">
                <img
                  src="/rc_hero_car.png"
                  alt="Vehicle with registration certificate"
                  className="rc-hero-img"
                />

                <div className="rc-feature-strip">
                  <div className="rc-feature-item">
                    <div className="rc-feature-item-icon green">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3l7 2.8v5.4c0 4.5-2.9 8.6-7 9.8-4.1-1.2-7-5.3-7-9.8V5.8L12 3z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.3 11.8l2 2 3.6-3.9" />
                      </svg>
                    </div>
                    <div className="rc-feature-item-text">
                      <strong>Secure &amp; Private</strong>
                      <span>Your data is 100% safe</span>
                    </div>
                  </div>
                  <div className="rc-feature-sep" aria-hidden="true" />
                  <div className="rc-feature-item">
                    <div className="rc-feature-item-icon red">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 2L4.8 13h6.4l-1.2 9L19.2 11h-6.4L13 2z" />
                      </svg>
                    </div>
                    <div className="rc-feature-item-text">
                      <strong>Instant Results</strong>
                      <span>Get details in seconds</span>
                    </div>
                  </div>
                  <div className="rc-feature-sep" aria-hidden="true" />
                  <div className="rc-feature-item">
                    <div className="rc-feature-item-icon blue">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3l7 2.8v5.4c0 4.5-2.9 8.6-7 9.8-4.1-1.2-7-5.3-7-9.8V5.8L12 3z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.3 11.8l2 2 3.6-3.9" />
                      </svg>
                    </div>
                    <div className="rc-feature-item-text">
                      <strong>Government Source</strong>
                      <span>Verified &amp; Reliable</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Cards section */}
          <div className="rc-cards-section">
              <div className="rc-recent-card">
                <div className="rc-recent-header">
                  <div className="rc-recent-header-left">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                    <h3>Recent Searches</h3>
                  </div>
                  <button type="button" className="rc-recent-view-all" onClick={() => navigate('/history')}>
                    View All
                  </button>
                </div>

                {recents.length === 0 ? (
                  <div className="rc-recent-empty">
                    No recent searches yet. Vehicles you look up will appear here.
                  </div>
                ) : (
                  recents.map((item, idx) => (
                    <div key={item.vehicleNumber} className="rc-recent-row">
                      <div className={`rc-recent-icon ${idx % 2 === 0 ? 'red' : 'green'}`}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 11l1.3-3.6A2 2 0 019.2 6h5.6a2 2 0 011.9 1.4L18 11" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 11h16a1 1 0 011 1v4h-2.2M3 16v-4a1 1 0 011-1m-1 5h2.2m13.6 0H7.2" />
                          <path strokeLinecap="round" strokeWidth="2.4" d="M7.5 13.7h.01M16.5 13.7h.01" />
                        </svg>
                      </div>
                      <div className="rc-recent-info">
                        <div className="rc-recent-number">{item.vehicleNumber}</div>
                        <div className="rc-recent-date">{formatRecentSearchTime(item.searchedAt)}</div>
                      </div>
                      <button
                        type="button"
                        className="rc-view-details-btn"
                        onClick={() => searchFor(item.vehicleNumber)}
                      >
                        View Details
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M13 6l6 6-6 6" />
                        </svg>
                      </button>
                    </div>
                  ))
                )}
              </div>

              <div className="rc-premium-card">
                <div className="rc-premium-header">
                  <div className="rc-premium-crown">
                    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5z" />
                      <path d="M5 19a1 1 0 001 1h12a1 1 0 001-1v-1H5v1z" />
                    </svg>
                  </div>
                  <div className="rc-premium-header-text">
                    <div className="rc-premium-title-row">
                      <span className="rc-premium-title">Get Full RC Report</span>
                      <span className="rc-premium-badge">PREMIUM</span>
                    </div>
                    <p className="rc-premium-subtitle">Unlock complete RC information with our premium report.</p>
                  </div>
                </div>

                <div className="rc-premium-content">
                  <div className="rc-premium-features">
                    <div className="rc-premium-features-grid">
                      <div className="rc-premium-col">
                        {PREMIUM_FEATURES_LEFT.map((feat) => (
                          <div key={feat} className="rc-premium-feature">
                            <div className="rc-premium-check">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                            {feat}
                          </div>
                        ))}
                      </div>
                      <div className="rc-premium-col">
                        {PREMIUM_FEATURES_RIGHT.map((feat) => (
                          <div key={feat} className="rc-premium-feature">
                            <div className="rc-premium-check">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                            {feat}
                          </div>
                        ))}
                      </div>
                    </div>

                    <button type="button" className="rc-premium-cta" onClick={handlePremiumReport} disabled={premiumLoading}>
                      Download Premium Report
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3M3 17v2a2 2 0 002 2h14a2 2 0 002-2v-2" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14 2H6a2 2 0 00-2 2v16M18 14V4a2 2 0 00-2-2h-2" />
                      </svg>
                    </button>
                  </div>

                  <div className="rc-premium-preview">
                    <div className="rc-report-doc">
                      <div className="rc-report-doc-header">
                        <img src="/logo-emblem.svg" alt="" className="rc-report-doc-logo" />
                        <div className="rc-report-doc-brand">CHALLAN ONE</div>
                      </div>
                      <div className="rc-report-doc-title">VEHICLE RC REPORT</div>
                      <div className="rc-report-doc-cols">
                        <div className="rc-report-doc-col">
                          <div className="rc-report-doc-line" />
                          <div className="rc-report-doc-line med" />
                          <div className="rc-report-doc-line short" />
                          <div className="rc-report-doc-line" />
                          <div className="rc-report-doc-line med" />
                          <div className="rc-report-doc-line short" />
                        </div>
                        <div className="rc-report-doc-col">
                          <div className="rc-report-doc-line med" />
                          <div className="rc-report-doc-line" />
                          <div className="rc-report-doc-line short" />
                          <div className="rc-report-doc-line med" />
                          <div className="rc-report-doc-line" />
                          <div className="rc-report-doc-line short" />
                        </div>
                      </div>
                      <div className="rc-report-pdf-badge">PDF</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          {/* Trust strip */}
          <div className="rc-trust-strip">
              <div className="rc-trust-item">
                <div className="rc-trust-icon red">
                  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z" />
                  </svg>
                </div>
                <div className="rc-trust-text">
                  <strong>100% Secure</strong>
                  <span>Your data is encrypted<br />and safe with us</span>
                </div>
              </div>
              <div className="rc-trust-sep" aria-hidden="true" />
              <div className="rc-trust-item">
                <div className="rc-trust-icon green">
                  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zM9 8V6c0-1.66 1.34-3 3-3s3 1.34 3 3v2H9z" />
                  </svg>
                </div>
                <div className="rc-trust-text">
                  <strong>Official &amp; Verified</strong>
                  <span>Information sourced from<br />government databases</span>
                </div>
              </div>
              <div className="rc-trust-sep" aria-hidden="true" />
              <div className="rc-trust-item">
                <div className="rc-trust-icon purple">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <circle cx="12" cy="13.5" r="7.5" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v3.5l2.3 2.3" />
                    <path strokeLinecap="round" d="M9.5 2.5h5M12 2.5V6" />
                  </svg>
                </div>
                <div className="rc-trust-text">
                  <strong>Instant &amp; Accurate</strong>
                  <span>Get accurate details<br />within seconds</span>
                </div>
              </div>
              <div className="rc-trust-sep" aria-hidden="true" />
              <div className="rc-trust-item">
                <div className="rc-trust-icon amber">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 14.5v-2.75a8 8 0 0116 0v2.75" />
                    <rect x="3" y="13.5" width="4.5" height="6.5" rx="2.2" />
                    <rect x="16.5" y="13.5" width="4.5" height="6.5" rx="2.2" />
                  </svg>
                </div>
                <div className="rc-trust-text">
                  <strong>24/7 Support</strong>
                  <span>We are here to help<br />you anytime</span>
                </div>
              </div>
            </div>

          <div className="rc-disclaimer">
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z" />
            </svg>
            <p>Challan One is not affiliated with any government entity. We simply help you access publicly available information in a faster and easier way.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
