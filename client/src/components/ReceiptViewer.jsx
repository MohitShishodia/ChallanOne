import { useCallback, useEffect, useRef, useState } from 'react'
import { API, API_BASE_URL } from '../config/api'

const PRINT_LOADING_STEPS = [
  { after: 0, text: 'Opening Download Challan Print…' },
  { after: 4000, text: 'Solving captcha…' },
  { after: 8000, text: 'Submitting challan…' },
  { after: 14000, text: 'Fetching challan print…' },
  { after: 22000, text: 'Almost there…' },
]

const RECEIPT_LOADING_STEPS = [
  { after: 0, text: 'Opening Download Payment Receipt…' },
  { after: 4000, text: 'Solving captcha…' },
  { after: 8000, text: 'Submitting challan…' },
  { after: 14000, text: 'Fetching payment receipt…' },
  { after: 22000, text: 'Almost there…' },
]

/**
 * Fetches challan receipts and opens them in a new browser tab.
 * Default: silent backend auto-fetch (2Captcha).
 * Fallback: show captcha form only if auto-solve fails.
 */
export default function ReceiptViewer({
  open,
  challanNumber,
  variant = 'receipt',
  onClose,
}) {
  const isPdf = variant === 'pdf'
  const title = isPdf ? 'View PDF' : 'View Receipt'
  const documentType = isPdf ? 'challanPrint' : 'paymentReceipt'
  const [phase, setPhase] = useState('loading') // loading | captcha | receipt | error
  const [sessionId, setSessionId] = useState('')
  const [captchaImage, setCaptchaImage] = useState('')
  const [captcha, setCaptcha] = useState('')
  const [loadingCaptcha, setLoadingCaptcha] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [receiptUrl, setReceiptUrl] = useState('')
  const [popupBlocked, setPopupBlocked] = useState(false)
  const requestIdRef = useRef(0)
  const openedRef = useRef(false)

  const toAbsoluteReceiptUrl = (url) =>
    url?.startsWith('http') ? url : `${API_BASE_URL}${url}`

  const resetState = useCallback(() => {
    setPhase('loading')
    setSessionId('')
    setCaptchaImage('')
    setCaptcha('')
    setLoadingCaptcha(false)
    setSubmitting(false)
    setError('')
    setReceiptUrl('')
    setPopupBlocked(false)
    openedRef.current = false
  }, [])

  const loadCaptcha = useCallback(async ({ keepError = false } = {}) => {
    setLoadingCaptcha(true)
    if (!keepError) setError('')
    setCaptcha('')
    try {
      const res = await fetch(`${API.challanReceipt.captcha}?documentType=${encodeURIComponent(documentType)}`)
      let data = null
      try {
        data = await res.json()
      } catch {
        throw new Error('Failed to load captcha. Please try again.')
      }
      if (!res.ok || !data.success) {
        throw new Error(data?.message || 'Failed to load captcha. Please try again.')
      }
      setSessionId(data.sessionId)
      setCaptchaImage(data.captchaImage)
      setPhase('captcha')
    } catch (err) {
      if (!keepError) {
        setError(err.message || 'Failed to load captcha. Please try again.')
      }
      setCaptchaImage('')
      setSessionId('')
      setPhase('error')
    } finally {
      setLoadingCaptcha(false)
    }
  }, [documentType])

  const startAutoFetch = useCallback(async () => {
    if (!challanNumber) return

    const requestId = ++requestIdRef.current
    setPhase('loading')
    setError('')
    setReceiptUrl('')
    setSessionId('')
    setCaptchaImage('')
    setCaptcha('')

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 170_000)

    try {
      const res = await fetch(API.challanReceipt.auto, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challanNumber, documentType }),
        signal: controller.signal,
      })

      clearTimeout(timeout)

      if (res.status === 404) {
        await loadCaptcha()
        return
      }

      let data = null
      try {
        data = await res.json()
      } catch {
        throw new Error('Unable to fetch challan receipt. Please try again.')
      }

      if (requestId !== requestIdRef.current) return

      if (!res.ok || !data.success) {
        throw new Error(data?.message || 'Unable to fetch challan receipt. Please try again.')
      }

      if (data.needsCaptcha) {
        setSessionId(data.sessionId || '')
        setCaptchaImage(data.captchaImage || '')
        setCaptcha('')
        setError(data.message || 'Please enter the captcha to continue.')
        setPhase('captcha')
        return
      }

      setReceiptUrl(toAbsoluteReceiptUrl(data.receiptUrl))
      setPhase('receipt')
    } catch (err) {
      clearTimeout(timeout)
      if (requestId !== requestIdRef.current) return
      const message = err.name === 'AbortError'
        ? 'Request timed out. The government portal may be slow — please try again.'
        : (err.message || 'Unable to fetch challan receipt. Please try again.')
      setError(message)
      setPhase('error')
    }
  }, [challanNumber, loadCaptcha, documentType])

  const refreshCaptcha = useCallback(async () => {
    if (!sessionId) {
      return loadCaptcha()
    }
    setLoadingCaptcha(true)
    setError('')
    setCaptcha('')
    try {
      const res = await fetch(API.challanReceipt.refreshCaptcha, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.success) {
        return loadCaptcha()
      }
      setCaptchaImage(data.captchaImage)
      setSessionId(data.sessionId)
    } catch {
      await loadCaptcha()
    } finally {
      setLoadingCaptcha(false)
    }
  }, [sessionId, loadCaptcha])

  useEffect(() => {
    if (!open || !challanNumber) return undefined
    resetState()
    startAutoFetch()
    return () => {
      requestIdRef.current += 1
    }
  }, [open, challanNumber, resetState, startAutoFetch])

  useEffect(() => {
    if (phase !== 'receipt' || !receiptUrl || openedRef.current) return

    openedRef.current = true
    const popup = window.open(receiptUrl, '_blank', 'noopener,noreferrer')
    if (popup) {
      popup.focus()
      onClose?.()
      return
    }

    setPopupBlocked(true)
  }, [phase, receiptUrl, onClose])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!captcha.trim() || !challanNumber) return

    setSubmitting(true)
    setError('')
    try {
      const res = await fetch(API.challanReceipt.fetch, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          challanNumber,
          captcha: captcha.trim(),
          sessionId,
        }),
      })

      let data = null
      try {
        data = await res.json()
      } catch {
        throw new Error('Unable to fetch challan receipt. Please try again.')
      }

      if (!res.ok || !data.success) {
        throw new Error(data?.message || 'Unable to fetch challan receipt. Please try again.')
      }

      setReceiptUrl(toAbsoluteReceiptUrl(data.receiptUrl))
      setPhase('receipt')
    } catch (err) {
      const message = err.message || 'Unable to fetch challan receipt. Please try again.'
      setError(message)
      await loadCaptcha({ keepError: true })
    } finally {
      setSubmitting(false)
    }
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-slate-950/45 p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={onClose}
    >
      <div
        className="flex max-h-[94vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-start justify-between gap-3 border-b border-slate-100 px-4 py-3.5 sm:px-5">
          <div>
            <h2 className="text-[17px] font-bold text-slate-900">
              {title}
            </h2>
            <p className="mt-0.5 break-all text-[12px] text-slate-500">
              {challanNumber}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="Close"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5">
          {phase === 'receipt' && receiptUrl && popupBlocked ? (
            <div className="mx-auto max-w-md space-y-4 py-10 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <p className="text-[15px] font-semibold text-slate-900">
                  {isPdf ? 'PDF ready' : 'Receipt ready'}
                </p>
                <p className="mt-1 text-[13px] leading-relaxed text-slate-500">
                  Your browser blocked the popup. Open the {isPdf ? 'PDF' : 'receipt'} in a new tab below.
                </p>
              </div>
              <a
                href={receiptUrl}
                target="_blank"
                rel="noreferrer"
                className="btn-primary inline-flex w-full items-center justify-center"
              >
                Open {isPdf ? 'PDF' : 'Receipt'}
              </a>
            </div>
          ) : phase === 'loading' ? (
            <LoadingView variant={variant} />
          ) : phase === 'error' ? (
            <div className="mx-auto max-w-md space-y-4 py-8 text-center">
              {error && (
                <div className="rounded-xl border border-rose-100 bg-rose-50 px-3.5 py-2.5 text-left text-[13px] font-medium text-rose-700">
                  {error}
                </div>
              )}
              <button
                type="button"
                onClick={startAutoFetch}
                className="btn-primary w-full"
              >
                Try again
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mx-auto max-w-md space-y-4">
              <p className="text-[13px] leading-relaxed text-slate-600">
                Automatic captcha solve failed. Enter the captcha below to continue.
              </p>

              {error && (
                <div className="rounded-xl border border-rose-100 bg-rose-50 px-3.5 py-2.5 text-[13px] font-medium text-rose-700">
                  {error}
                </div>
              )}

              <div>
                <label className="mb-1.5 block text-[12px] font-semibold text-slate-700">
                  Captcha
                </label>
                <div className="flex items-center gap-3">
                  <div className="flex h-[52px] min-w-[160px] flex-1 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                    {loadingCaptcha ? (
                      <span className="text-[12px] text-slate-400">Loading…</span>
                    ) : captchaImage ? (
                      <img
                        src={captchaImage}
                        alt="Captcha"
                        className="h-full w-full object-contain"
                        draggable={false}
                      />
                    ) : (
                      <span className="text-[12px] text-slate-400">Unavailable</span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={refreshCaptcha}
                    disabled={loadingCaptcha || submitting}
                    className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                    title="Refresh captcha"
                    aria-label="Refresh captcha"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v6h6M20 20v-6h-6M5 19a9 9 0 0014-7M19 5a9 9 0 00-14 7" />
                    </svg>
                  </button>
                </div>
                <input
                  type="text"
                  value={captcha}
                  onChange={(e) => setCaptcha(e.target.value)}
                  maxLength={6}
                  autoComplete="off"
                  spellCheck={false}
                  placeholder="Enter captcha"
                  className="mt-2 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-center text-[15px] font-semibold tracking-[0.2em] text-slate-900 outline-none focus:border-brand-red focus:ring-2 focus:ring-brand-red/20"
                  disabled={submitting || loadingCaptcha}
                />
              </div>

              <button
                type="submit"
                disabled={submitting || loadingCaptcha || !captcha.trim() || !sessionId}
                className="btn-primary w-full disabled:opacity-50"
              >
                {submitting ? (isPdf ? 'Fetching PDF…' : 'Fetching receipt…') : title}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

function LoadingView({ variant = 'receipt' }) {
  const [stepIdx, setStepIdx] = useState(0)
  const steps = variant === 'pdf' ? PRINT_LOADING_STEPS : RECEIPT_LOADING_STEPS

  useEffect(() => {
    const timers = steps.slice(1).map((s, i) =>
      setTimeout(() => setStepIdx(i + 1), s.after)
    )
    return () => timers.forEach(clearTimeout)
  }, [steps])

  const step = steps[stepIdx]

  return (
    <div className="mx-auto flex max-w-md flex-col items-center justify-center gap-4 py-16 text-center">
      <div
        className="h-10 w-10 animate-spin rounded-full border-2 border-slate-200 border-t-brand-red"
        aria-hidden
      />
      <div>
        <p className="text-[15px] font-semibold text-slate-900">
          {step.text}
        </p>
        <p className="mt-1 text-[13px] leading-relaxed text-slate-500">
          Please wait while we fetch your {variant === 'pdf' ? 'challan print' : 'receipt'}.
        </p>
      </div>

      <div className="mt-2 flex gap-1.5">
        {steps.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 w-6 rounded-full transition-colors duration-500 ${
              i <= stepIdx ? 'bg-brand-red' : 'bg-slate-200'
            }`}
          />
        ))}
      </div>
    </div>
  )
}
