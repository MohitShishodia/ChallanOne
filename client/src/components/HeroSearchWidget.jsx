import { useState, useRef, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { API } from '../config/api'
import './HeroSearchWidget.css'

/* ── Service tabs (3 tabs only) ── */
const SERVICE_TABS = [
  {
    id: 'challan',
    label: 'Check Challan',
    icon: (
      <svg className="hsw-tab-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
        <rect x="3" y="2" width="14" height="16" rx="2" />
        <path strokeLinecap="round" d="M7 6h6M7 9h6M7 12h4" />
      </svg>
    ),
    color: '#dc2626',
  },
  {
    id: 'rc',
    label: 'RC Details',
    icon: (
      <svg className="hsw-tab-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 2h8l3 4v10a2 2 0 01-2 2H5a2 2 0 01-2-2V4a2 2 0 012-2z" />
        <path strokeLinecap="round" d="M7 10h6M7 13h4" />
      </svg>
    ),
    color: '#059669',
  },
  {
    id: 'service',
    label: 'Service History',
    icon: (
      <svg className="hsw-tab-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
        <circle cx="10" cy="10" r="7" />
        <path strokeLinecap="round" d="M10 6v4l3 2" />
      </svg>
    ),
    color: '#2563eb',
  },
]

/* ── Challan type dropdown options ── */
const CHALLAN_OPTIONS = [
  { id: 'all', label: 'Fetch All Challans' },
  { id: 'delhi', label: 'Delhi OTP Based Challans' },
]

export default function HeroSearchWidget() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('challan')
  const [vehicleNumber, setVehicleNumber] = useState('')
  const [challanMode, setChallanMode] = useState('all')
  const [isLoading, setIsLoading] = useState(false)
  const tabsRef = useRef(null)
  const [indicatorStyle, setIndicatorStyle] = useState({})

  // Delhi OTP extra fields
  const [mobileNumber, setMobileNumber] = useState('')

  // Delhi OTP flow states
  const [delhiStep, setDelhiStep] = useState('input') // input | otp | loading | error
  const [runId, setRunId] = useState(null)
  const [otp, setOtp] = useState('')
  const [delhiError, setDelhiError] = useState(null)
  const [resendCooldown, setResendCooldown] = useState(0)
  const [nextOtpAction, setNextOtpAction] = useState('SUBMIT_FETCH_OTP')
  const [resendAction, setResendAction] = useState('RESEND_FETCH_OTP')
  const [cancelAction, setCancelAction] = useState('CANCEL_RUN')
  const cooldownRef = useRef(null)
  const pollRef = useRef(null)

  const currentTab = SERVICE_TABS.find((t) => t.id === activeTab)

  useEffect(() => {
    return () => {
      if (pollRef.current) clearTimeout(pollRef.current)
      if (cooldownRef.current) clearInterval(cooldownRef.current)
    }
  }, [])

  /* ── Move the active tab indicator ── */
  useEffect(() => {
    if (!tabsRef.current) return
    const activeEl = tabsRef.current.querySelector(`[data-tab="${activeTab}"]`)
    if (activeEl) {
      const container = tabsRef.current.getBoundingClientRect()
      const el = activeEl.getBoundingClientRect()
      setIndicatorStyle({
        left: el.left - container.left + tabsRef.current.scrollLeft,
        width: el.width,
      })
    }
  }, [activeTab])

  /* ── Delhi OTP helpers ── */
  const applyChallengeActions = (data) => {
    if (data?.nextOtpAction) setNextOtpAction(data.nextOtpAction)
    if (data?.resendAction) setResendAction(data.resendAction)
    if (data?.cancelAction) setCancelAction(data.cancelAction)
  }

  const isOtpStep = (nextAction) =>
    nextAction === 'SUBMIT_FETCH_OTP' || nextAction === 'SUBMIT_LINK_OTP'

  const startResendCooldown = () => {
    setResendCooldown(30)
    if (cooldownRef.current) clearInterval(cooldownRef.current)
    cooldownRef.current = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(cooldownRef.current)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  const resetDelhiFlow = () => {
    setDelhiStep('input')
    setRunId(null)
    setOtp('')
    setDelhiError(null)
    setResendCooldown(0)
    setNextOtpAction('SUBMIT_FETCH_OTP')
    setResendAction('RESEND_FETCH_OTP')
    setCancelAction('CANCEL_RUN')
    if (pollRef.current) clearTimeout(pollRef.current)
    if (cooldownRef.current) clearInterval(cooldownRef.current)
  }

  /* ── Delhi: Create run ── */
  const handleDelhiSubmit = async () => {
    setDelhiError(null)
    setIsLoading(true)

    try {
      const response = await fetch(API.delhiOtp.createRun, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vehicleNumber: vehicleNumber.trim(),
          mobileNumber: mobileNumber.trim(),
        }),
      })

      const data = await response.json()

      if (!data.success) {
        setDelhiError(data.message || 'Failed to initiate Delhi OTP flow')
        setIsLoading(false)
        return
      }

      setRunId(data.runId)
      applyChallengeActions(data)

      if (data.nextAction === 'SUBMIT_MOBILE') {
        await submitMobileAction(data.runId)
      } else if (isOtpStep(data.nextAction) || isOtpStep(data.nextOtpAction)) {
        setDelhiStep('otp')
        startResendCooldown()
      } else {
        await submitMobileAction(data.runId)
      }
    } catch (err) {
      setDelhiError(err.message || 'Network error. Please try again.')
    }
    setIsLoading(false)
  }

  const submitMobileAction = async (activeRunId) => {
    try {
      const response = await fetch(API.delhiOtp.submitAction(activeRunId), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'SUBMIT_MOBILE',
          payload: {
            mobileNumber: mobileNumber.trim(),
            vehicleNumber: vehicleNumber.trim(),
          },
        }),
      })
      const data = await response.json()
      if (!data.success) {
        setDelhiError(data.message || 'Failed to submit mobile number')
        return
      }
      applyChallengeActions(data)
      if (data.isTerminal && data.status === 'COMPLETED') {
        // Redirect to pay-challan page — DelhiOtpFlow there will show results
        navigate(`/pay-challan?vehicle=${encodeURIComponent(vehicleNumber.trim())}`)
      } else if (isOtpStep(data.nextAction) || isOtpStep(data.nextOtpAction)) {
        setDelhiStep('otp')
        startResendCooldown()
      } else {
        setDelhiError(data.message || 'Unexpected response')
      }
    } catch (err) {
      setDelhiError(err.message || 'Network error')
    }
  }

  /* ── Delhi: Submit OTP ── */
  const handleOtpSubmit = async (e) => {
    e.preventDefault()
    if (!otp || otp.length < 4) {
      setDelhiError('Please enter a valid OTP')
      return
    }
    setDelhiError(null)
    setIsLoading(true)

    try {
      const response = await fetch(API.delhiOtp.submitAction(runId), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: nextOtpAction, payload: { otp } }),
      })
      const data = await response.json()

      if (!data.success) {
        if (data.expired) {
          setDelhiError('Session expired. Please start again.')
          setDelhiStep('error')
        } else if (data.retriable) {
          setDelhiError(data.message || 'Invalid OTP. Please try again.')
          setOtp('')
        } else {
          setDelhiError(data.message || 'OTP submission failed')
        }
        setIsLoading(false)
        return
      }

      applyChallengeActions(data)

      if (data.isTerminal && data.status === 'COMPLETED') {
        navigate(`/pay-challan?vehicle=${encodeURIComponent(vehicleNumber.trim())}`)
      } else if (data.isTerminal) {
        setDelhiError(data.failureReason || `Run ended with status: ${data.status}`)
        setDelhiStep('error')
      } else {
        setDelhiStep('loading')
        pollRunStatus()
      }
    } catch (err) {
      setDelhiError(err.message || 'Network error during OTP submission')
    }
    setIsLoading(false)
  }

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return
    setDelhiError(null)
    setIsLoading(true)
    try {
      const response = await fetch(API.delhiOtp.submitAction(runId), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: resendAction }),
      })
      const data = await response.json()
      if (!data.success) {
        setDelhiError(data.message || 'Failed to resend OTP')
      } else {
        setOtp('')
        startResendCooldown()
      }
    } catch (err) {
      setDelhiError(err.message || 'Network error')
    }
    setIsLoading(false)
  }

  const handleCancelDelhi = async () => {
    if (runId) {
      try {
        await fetch(API.delhiOtp.submitAction(runId), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: cancelAction }),
        })
      } catch { /* best-effort */ }
    }
    resetDelhiFlow()
  }

  const pollRunStatus = async () => {
    if (!runId) return
    try {
      const response = await fetch(API.delhiOtp.getRun(runId))
      const data = await response.json()
      if (!data.success) {
        setDelhiError(data.message || 'Failed to fetch status')
        setDelhiStep('error')
        return
      }
      if (data.isTerminal) {
        if (data.status === 'COMPLETED') {
          navigate(`/pay-challan?vehicle=${encodeURIComponent(vehicleNumber.trim())}`)
        } else {
          setDelhiError(data.failureReason || `Run ended: ${data.status}`)
          setDelhiStep('error')
        }
      } else if (isOtpStep(data.nextAction) || isOtpStep(data.nextOtpAction)) {
        applyChallengeActions(data)
        setDelhiStep('otp')
      } else {
        pollRef.current = setTimeout(() => pollRunStatus(), 3000)
      }
    } catch (err) {
      setDelhiError(err.message || 'Polling failed')
      setDelhiStep('error')
    }
  }

  /* ── Handle form submission ── */
  const handleCheckNow = (e) => {
    e.preventDefault()
    const trimmed = vehicleNumber.trim().toUpperCase()
    if (!trimmed) return

    // Challan tab + Delhi mode → start Delhi OTP flow inline
    if (activeTab === 'challan' && challanMode === 'delhi') {
      if (!mobileNumber.trim() || mobileNumber.trim().length < 10) {
        setDelhiError('Please enter a valid 10-digit mobile number')
        return
      }
      handleDelhiSubmit()
      return
    }

    setIsLoading(true)

    switch (activeTab) {
      case 'challan':
        navigate(`/pay-challan?vehicle=${encodeURIComponent(trimmed)}`)
        break
      case 'rc':
        navigate(`/vehicle-info?vehicle=${encodeURIComponent(trimmed)}`)
        break
      case 'service':
        navigate(`/service-history?vehicle=${encodeURIComponent(trimmed)}`)
        break
      default:
        navigate(`/pay-challan?vehicle=${encodeURIComponent(trimmed)}`)
    }

    setIsLoading(false)
  }

  /* ── Not logged in: show login prompt ── */
  if (!user) {
    return (
      <div className="hsw-root">
        <div className="hsw-login-prompt">
          <div className="hsw-login-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h3 className="hsw-login-title">Sign in to Get Started</h3>
          <p className="hsw-login-desc">
            Login or create an account to check challans, view RC details, service history and more.
          </p>
          <button
            className="hsw-login-btn"
            onClick={() => navigate('/login', { state: { from: location.pathname } })}
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="hsw-login-btn-icon">
              <path fillRule="evenodd" d="M3 3a1 1 0 011 1v12a1 1 0 11-2 0V4a1 1 0 011-1zm7.707 3.293a1 1 0 010 1.414L9.414 9H17a1 1 0 110 2H9.414l1.293 1.293a1 1 0 01-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Login / Sign Up
          </button>
        </div>
      </div>
    )
  }

  /* ── Delhi OTP step: show OTP entry ── */
  if (activeTab === 'challan' && challanMode === 'delhi' && delhiStep === 'otp') {
    return (
      <div className="hsw-root">
        <div className="hsw-otp-section">
          <div className="hsw-otp-header">
            <div className="hsw-otp-badge">
              <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" className="hsw-otp-badge-icon">
                <rect x="3" y="7" width="14" height="10" rx="2" />
                <path strokeLinecap="round" d="M7 7V5a3 3 0 016 0v2" />
              </svg>
            </div>
            <div>
              <h3 className="hsw-otp-title">Enter OTP</h3>
              <p className="hsw-otp-subtitle">
                Sent to ****{mobileNumber.slice(-4)}
              </p>
            </div>
          </div>

          <form onSubmit={handleOtpSubmit} className="hsw-otp-form">
            <input
              type="text"
              placeholder="Enter OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="hsw-otp-input"
              maxLength={6}
              autoFocus
              required
            />
            <button
              type="submit"
              className="hsw-check-btn"
              disabled={isLoading || otp.length < 4}
              style={{ '--btn-color': '#dc2626' }}
            >
              {isLoading ? 'Verifying...' : 'Verify OTP'}
            </button>
          </form>

          {delhiError && <p className="hsw-error">{delhiError}</p>}

          <div className="hsw-otp-actions">
            <button
              type="button"
              onClick={handleResendOtp}
              disabled={resendCooldown > 0 || isLoading}
              className="hsw-otp-resend"
            >
              {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend OTP'}
            </button>
            <button type="button" onClick={handleCancelDelhi} className="hsw-otp-cancel">
              Cancel
            </button>
          </div>
        </div>
      </div>
    )
  }

  /* ── Delhi loading state ── */
  if (activeTab === 'challan' && challanMode === 'delhi' && delhiStep === 'loading') {
    return (
      <div className="hsw-root">
        <div className="hsw-loading-section">
          <div className="hsw-loading-spinner" />
          <p className="hsw-loading-text">Verifying & fetching challans...</p>
          <p className="hsw-loading-sub">Please wait</p>
        </div>
      </div>
    )
  }

  /* ── Delhi error state ── */
  if (activeTab === 'challan' && challanMode === 'delhi' && delhiStep === 'error') {
    return (
      <div className="hsw-root">
        <div className="hsw-error-section">
          <div className="hsw-error-icon-wrap">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="hsw-error-icon">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="hsw-error-title">Something went wrong</h3>
          <p className="hsw-error-desc">{delhiError || 'An unexpected error occurred'}</p>
          <button onClick={resetDelhiFlow} className="hsw-check-btn" style={{ '--btn-color': '#dc2626' }}>
            Try Again
          </button>
        </div>
      </div>
    )
  }

  /* ── Main widget (logged in) ── */
  return (
    <div className="hsw-root">
      {/* ── Service Tabs ── */}
      <div className="hsw-tabs-wrapper" ref={tabsRef}>
        <div className="hsw-tabs-scroll">
          {SERVICE_TABS.map((tab) => (
            <button
              key={tab.id}
              data-tab={tab.id}
              type="button"
              className={`hsw-tab ${activeTab === tab.id ? 'hsw-tab--active' : ''}`}
              onClick={() => {
                setActiveTab(tab.id)
                resetDelhiFlow()
              }}
              style={
                activeTab === tab.id
                  ? { '--tab-color': tab.color }
                  : undefined
              }
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
        <div
          className="hsw-tab-indicator"
          style={{
            left: indicatorStyle.left || 0,
            width: indicatorStyle.width || 0,
            backgroundColor: currentTab?.color || '#dc2626',
          }}
        />
      </div>

      {/* ── Search Form ── */}
      <form className="hsw-form" onSubmit={handleCheckNow}>
        {/* Vehicle Number + Choose Challans (side by side on challan tab) */}
        <div className={activeTab === 'challan' ? 'hsw-fields-row' : undefined}>
          <div className="hsw-field-stack">
            <div className="hsw-field hsw-field--grow">
              <label className="hsw-label">Vehicle Number</label>
              <div className="hsw-input-wrap">
                <svg className="hsw-input-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="2" y="5" width="16" height="10" rx="2" />
                  <path strokeLinecap="round" d="M6 9h3M11 9h3M6 12h8" />
                </svg>
                <input
                  type="text"
                  placeholder="Enter Vehicle Number (e.g. DL01AB1234)"
                  value={vehicleNumber}
                  onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
                  className="hsw-input"
                  maxLength={14}
                  required
                />
              </div>
            </div>

            {/* Delhi OTP: mobile number just below vehicle number */}
            {activeTab === 'challan' && challanMode === 'delhi' && (
              <div className="hsw-field">
                <label className="hsw-label">Mobile Number *</label>
                <div className="hsw-input-wrap">
                  <svg className="hsw-input-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="5" y="2" width="10" height="16" rx="2" />
                    <path strokeLinecap="round" d="M9 15h2" />
                  </svg>
                  <input
                    type="tel"
                    placeholder="10-digit mobile number"
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    className="hsw-input"
                    maxLength={10}
                    inputMode="numeric"
                    required
                  />
                </div>
                {delhiError && <p className="hsw-error">{delhiError}</p>}
              </div>
            )}
          </div>

          {activeTab === 'challan' && (
            <div className="hsw-field hsw-field--challan-type">
              <label className="hsw-label">Choose Challans</label>
              <div className="hsw-input-wrap">
                <svg className="hsw-input-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h6a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h0a2 2 0 002-2M9 5a2 2 0 012-2h0a2 2 0 012 2" />
                </svg>
                <select
                  className="hsw-input hsw-select"
                  value={challanMode}
                  onChange={(e) => {
                    const next = e.target.value
                    setChallanMode(next)
                    if (next !== 'delhi') resetDelhiFlow()
                  }}
                  aria-label="Choose Challans"
                >
                  {CHALLAN_OPTIONS.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <svg className="hsw-select-chevron" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 8l4 4 4-4" />
                </svg>
              </div>
            </div>
          )}
        </div>

        {/* Submit button */}
        <div className="hsw-submit-row">
          <button
            type="submit"
            className="hsw-check-btn"
            disabled={isLoading || !vehicleNumber.trim()}
            style={{ '--btn-color': currentTab?.color || '#dc2626' }}
          >
            {isLoading ? (
              <>
                <svg className="hsw-spinner" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
                  <path d="M12 2a10 10 0 019.95 9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                </svg>
                {activeTab === 'challan' && challanMode === 'delhi' ? 'Sending OTP...' : 'Checking...'}
              </>
            ) : (
              <>
                {activeTab === 'challan' && challanMode === 'delhi' ? 'Send OTP & Check' : 'Check Now'}
                <svg className="hsw-arrow" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
