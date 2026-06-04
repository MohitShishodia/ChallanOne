import { useState, useRef, useEffect } from 'react'
import { API } from '../config/api'

const STEPS = {
  INPUT: 'INPUT',
  OTP: 'OTP',
  LOADING: 'LOADING',
  RESULT: 'RESULT',
  ERROR: 'ERROR'
}

export default function DelhiOtpFlow({ onChallansFound, onBack }) {
  const [step, setStep] = useState(STEPS.INPUT)
  const [vehicleNumber, setVehicleNumber] = useState('')
  const [mobileNumber, setMobileNumber] = useState('')
  const [chassisNumber, setChassisNumber] = useState('')
  const [engineNumber, setEngineNumber] = useState('')
  const [otp, setOtp] = useState('')
  const [runId, setRunId] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [challans, setChallans] = useState([])
  const [responseVehicle, setResponseVehicle] = useState(null)
  const [resendCooldown, setResendCooldown] = useState(0)
  const [nextOtpAction, setNextOtpAction] = useState('SUBMIT_FETCH_OTP')
  const [resendAction, setResendAction] = useState('RESEND_FETCH_OTP')
  const [cancelAction, setCancelAction] = useState('CANCEL_RUN')
  const pollRef = useRef(null)
  const cooldownRef = useRef(null)

  const applyChallengeActions = (data) => {
    if (data?.nextOtpAction) setNextOtpAction(data.nextOtpAction)
    if (data?.resendAction) setResendAction(data.resendAction)
    if (data?.cancelAction) setCancelAction(data.cancelAction)
  }

  const isOtpStep = (nextAction) =>
    nextAction === 'SUBMIT_FETCH_OTP' || nextAction === 'SUBMIT_LINK_OTP'

  useEffect(() => {
    return () => {
      if (pollRef.current) clearTimeout(pollRef.current)
      if (cooldownRef.current) clearInterval(cooldownRef.current)
    }
  }, [])

  const startResendCooldown = () => {
    setResendCooldown(30)
    if (cooldownRef.current) clearInterval(cooldownRef.current)
    cooldownRef.current = setInterval(() => {
      setResendCooldown(prev => {
        if (prev <= 1) {
          clearInterval(cooldownRef.current)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  const handleCreateRun = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const response = await fetch(API.delhiOtp.createRun, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vehicleNumber: vehicleNumber.trim(),
          mobileNumber: mobileNumber.trim(),
          chassisNumber: chassisNumber.trim() || undefined,
          engineNumber: engineNumber.trim() || undefined
        })
      })

      const data = await response.json()

      if (!data.success) {
        setError(data.message || 'Failed to initiate Delhi OTP flow')
        setLoading(false)
        return
      }

      setRunId(data.runId)
      applyChallengeActions(data)

      if (data.nextAction === 'SUBMIT_MOBILE') {
        await submitMobileAction(data.runId)
      } else if (isOtpStep(data.nextAction) || isOtpStep(data.nextOtpAction)) {
        setStep(STEPS.OTP)
        startResendCooldown()
      } else {
        await submitMobileAction(data.runId)
      }
    } catch (err) {
      setError(err.message || 'Network error. Please try again.')
    }
    setLoading(false)
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
            chassisNumber: chassisNumber.trim() || undefined,
            engineNumber: engineNumber.trim() || undefined
          }
        })
      })

      const data = await response.json()

      if (!data.success) {
        setError(data.message || 'Failed to submit mobile number')
        return
      }

      applyChallengeActions(data)

      if (data.isTerminal && data.status === 'COMPLETED') {
        handleCompleted(data)
      } else if (isOtpStep(data.nextAction) || isOtpStep(data.nextOtpAction)) {
        setStep(STEPS.OTP)
        startResendCooldown()
      } else {
        setError(data.message || 'Unexpected response after mobile verification')
      }
    } catch (err) {
      setError(err.message || 'Network error during mobile submission')
    }
  }

  const handleSubmitOtp = async (e) => {
    e.preventDefault()
    if (!otp || otp.length < 4) {
      setError('Please enter a valid OTP')
      return
    }

    setError(null)
    setLoading(true)

    try {
      const response = await fetch(API.delhiOtp.submitAction(runId), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: nextOtpAction,
          payload: { otp }
        })
      })

      const data = await response.json()

      if (!data.success) {
        if (data.expired) {
          setError('Session expired. Please start again.')
          setStep(STEPS.ERROR)
        } else if (data.retriable) {
          setError(data.message || 'Invalid OTP. Please try again.')
          setOtp('')
        } else {
          setError(data.message || 'OTP submission failed')
        }
        setLoading(false)
        return
      }

      applyChallengeActions(data)

      if (data.isTerminal && data.status === 'COMPLETED') {
        handleCompleted(data)
      } else if (data.isTerminal) {
        setError(data.failureReason || `Run ended with status: ${data.status}`)
        setStep(STEPS.ERROR)
      } else {
        pollRunStatus()
      }
    } catch (err) {
      setError(err.message || 'Network error during OTP submission')
    }
    setLoading(false)
  }

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return
    setError(null)
    setLoading(true)

    try {
      const response = await fetch(API.delhiOtp.submitAction(runId), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: resendAction })
      })

      const data = await response.json()

      if (!data.success) {
        setError(data.message || 'Failed to resend OTP')
      } else {
        setOtp('')
        startResendCooldown()
        setError(null)
      }
    } catch (err) {
      setError(err.message || 'Network error')
    }
    setLoading(false)
  }

  const handleCancel = async () => {
    if (runId) {
      try {
        await fetch(API.delhiOtp.submitAction(runId), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: cancelAction })
        })
      } catch { /* best-effort cancel */ }
    }
    resetFlow()
  }

  const pollRunStatus = async () => {
    if (!runId) return
    setStep(STEPS.LOADING)

    try {
      const response = await fetch(API.delhiOtp.getRun(runId), {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      })

      const data = await response.json()

      if (!data.success) {
        setError(data.message || 'Failed to fetch run status')
        setStep(STEPS.ERROR)
        return
      }

      if (data.isTerminal) {
        if (data.status === 'COMPLETED') {
          handleCompleted(data)
        } else {
          setError(data.failureReason || `Run ended: ${data.status}`)
          setStep(STEPS.ERROR)
        }
      } else if (isOtpStep(data.nextAction) || isOtpStep(data.nextOtpAction)) {
        applyChallengeActions(data)
        setStep(STEPS.OTP)
      } else {
        pollRef.current = setTimeout(() => pollRunStatus(), 3000)
      }
    } catch (err) {
      setError(err.message || 'Polling failed')
      setStep(STEPS.ERROR)
    }
  }

  const handleCompleted = (data) => {
    const filteredChallans = data.challans || []
    setChallans(filteredChallans)
    setResponseVehicle(data.vehicleNumber)
    setStep(STEPS.RESULT)

    if (onChallansFound) {
      onChallansFound({
        challans: filteredChallans,
        vehicleNumber: data.vehicleNumber
      })
    }
  }

  const resetFlow = () => {
    setStep(STEPS.INPUT)
    setRunId(null)
    setOtp('')
    setError(null)
    setChallans([])
    setResponseVehicle(null)
    setNextOtpAction('SUBMIT_FETCH_OTP')
    setResendAction('RESEND_FETCH_OTP')
    setCancelAction('CANCEL_RUN')
    if (pollRef.current) clearTimeout(pollRef.current)
  }

  if (step === STEPS.INPUT) {
    return (
      <div className="space-y-6 animate-fade-up">
        <form onSubmit={handleCreateRun} className="surface-card p-4 md:p-6 space-y-3 md:space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100 text-orange-600">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-[17px] font-bold text-slate-900">Delhi State Challan (OTP Verification)</h2>
          </div>
          <p className="text-[13px] text-slate-500">An OTP will be sent to your registered mobile number for verification.</p>

          <div>
            <label className="field-label">Vehicle Number *</label>
            <input
              type="text"
              placeholder="e.g. DL05CX4567"
              value={vehicleNumber}
              onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
              className="input-field"
              required
            />
          </div>

          <div>
            <label className="field-label">Mobile Number *</label>
            <input
              type="tel"
              placeholder="10-digit mobile number"
              value={mobileNumber}
              onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
              className="input-field"
              required
              maxLength={10}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="field-label">Chassis Number</label>
              <input
                type="text"
                placeholder="Last 4 digits"
                value={chassisNumber}
                onChange={(e) => setChassisNumber(e.target.value.replace(/[^A-Z0-9]/gi, '').toUpperCase().slice(0, 4))}
                className="input-field"
                maxLength={4}
                inputMode="text"
                autoComplete="off"
              />
            </div>
            <div>
              <label className="field-label">Engine Number</label>
              <input
                type="text"
                placeholder="Last 4 digits"
                value={engineNumber}
                onChange={(e) => setEngineNumber(e.target.value.replace(/[^A-Z0-9]/gi, '').toUpperCase().slice(0, 4))}
                className="input-field"
                maxLength={4}
                inputMode="text"
                autoComplete="off"
              />
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Initiating...' : 'Send OTP & Check Challan'}
          </button>

          {error && <p className="text-sm text-rose-500 mt-2">{error}</p>}

          <button type="button" onClick={onBack} className="btn-ghost w-full mt-2">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Options
          </button>
        </form>
      </div>
    )
  }

  if (step === STEPS.OTP) {
    return (
      <div className="space-y-6 animate-fade-up">
        <div className="surface-card p-4 md:p-6 space-y-3 md:space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-[17px] font-bold text-slate-900">Enter OTP</h2>
          </div>
          <p className="text-[13px] text-slate-500">
            An OTP has been sent to your mobile number ending in ****{mobileNumber.slice(-4)}.
          </p>

          <form onSubmit={handleSubmitOtp} className="space-y-4">
            <div>
              <label className="field-label">OTP Code</label>
              <input
                type="text"
                placeholder="Enter OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="input-field text-center text-lg tracking-widest"
                maxLength={6}
                autoFocus
                required
              />
            </div>

            <button type="submit" disabled={loading || otp.length < 4} className="btn-primary w-full">
              {loading ? 'Verifying...' : 'Verify OTP'}
            </button>
          </form>

          {error && <p className="text-sm text-rose-500 mt-2">{error}</p>}

          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={handleResendOtp}
              disabled={resendCooldown > 0 || loading}
              className="text-[13px] font-medium text-blue-600 hover:text-blue-700 disabled:text-slate-400 disabled:cursor-not-allowed"
            >
              {resendCooldown > 0 ? `Resend OTP in ${resendCooldown}s` : 'Resend OTP'}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="text-[13px] font-medium text-rose-500 hover:text-rose-600"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (step === STEPS.LOADING) {
    return (
      <div className="flex flex-col items-center justify-center py-24 animate-fade-up">
        <div className="relative">
          <div className="h-14 w-14 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />
        </div>
        <p className="mt-5 text-[14px] font-medium text-slate-700">Verifying & fetching challans...</p>
        <p className="mt-1 text-[12px] text-slate-400">Please wait while we fetch your Delhi challans</p>
      </div>
    )
  }

  if (step === STEPS.ERROR) {
    return (
      <div className="space-y-6 animate-fade-up">
        <div className="surface-card p-4 md:p-6 text-center space-y-3 md:space-y-4">
          <div className="flex h-14 w-14 mx-auto items-center justify-center rounded-full bg-rose-100 text-rose-600">
            <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-[17px] font-bold text-slate-900">Something went wrong</h3>
          <p className="text-[14px] text-slate-600">{error || 'An unexpected error occurred'}</p>
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button onClick={resetFlow} className="btn-primary flex-1">Try Again</button>
            <button onClick={onBack} className="btn-ghost flex-1">Back to Options</button>
          </div>
        </div>
      </div>
    )
  }

  if (step === STEPS.RESULT) {
    if (challans.length === 0) {
      return (
        <div className="space-y-6 animate-fade-up">
          <div className="surface-card p-4 md:p-6 text-center space-y-3 md:space-y-4">
            <div className="flex h-14 w-14 mx-auto items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-[17px] font-bold text-slate-900">No Pending Challans</h3>
            <p className="text-[14px] text-slate-600">
              No unpaid challans found for vehicle {responseVehicle || vehicleNumber} in Delhi.
            </p>
            <button onClick={resetFlow} className="btn-primary">Check Another Vehicle</button>
          </div>
        </div>
      )
    }

    return null
  }

  return null
}
