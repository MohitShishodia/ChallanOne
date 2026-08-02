import { useCallback, useEffect, useState } from 'react'
import { API, API_BASE_URL } from '../config/api'

/**
 * Modal viewer for challan receipts.
 * Captcha → fetch receipt → embed PDF in iframe.
 */
export default function ReceiptViewer({
  open,
  challanNumber,
  onClose,
}) {
  const [sessionId, setSessionId] = useState('')
  const [captchaImage, setCaptchaImage] = useState('')
  const [captcha, setCaptcha] = useState('')
  const [loadingCaptcha, setLoadingCaptcha] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [receiptUrl, setReceiptUrl] = useState('')

  const resetForm = useCallback(() => {
    setCaptcha('')
    setError('')
    setReceiptUrl('')
  }, [])

  const loadCaptcha = useCallback(async ({ keepError = false } = {}) => {
    setLoadingCaptcha(true)
    if (!keepError) setError('')
    setCaptcha('')
    setReceiptUrl('')
    try {
      const res = await fetch(API.challanReceipt.captcha)
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
    } catch (err) {
      if (!keepError) {
        setError(err.message || 'Failed to load captcha. Please try again.')
      }
      setCaptchaImage('')
      setSessionId('')
    } finally {
      setLoadingCaptcha(false)
    }
  }, [])

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
    resetForm()
    loadCaptcha()
    return undefined
  }, [open, challanNumber, loadCaptcha, resetForm])

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

      const absoluteUrl = data.receiptUrl?.startsWith('http')
        ? data.receiptUrl
        : `${API_BASE_URL}${data.receiptUrl}`
      setReceiptUrl(absoluteUrl)
    } catch (err) {
      const message = err.message || 'Unable to fetch challan receipt. Please try again.'
      setError(message)
      // Reload captcha for retry, but keep the error visible
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
      aria-label="Challan receipt"
      onClick={onClose}
    >
      <div
        className="flex max-h-[94vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-start justify-between gap-3 border-b border-slate-100 px-4 py-3.5 sm:px-5">
          <div>
            <h2 className="text-[17px] font-bold text-slate-900">
              Challan Receipt
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
          {receiptUrl ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[13px] font-medium text-emerald-700">
                  Receipt ready
                </p>
                <a
                  href={receiptUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[12px] font-semibold text-brand-red hover:text-brand-red-dark"
                >
                  Download PDF
                </a>
              </div>
              <iframe
                title={`Challan receipt ${challanNumber}`}
                src={`${receiptUrl}#toolbar=1&navpanes=0`}
                className="h-[70vh] w-full rounded-xl border border-slate-200 bg-slate-50"
              />
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mx-auto max-w-md space-y-4">
              <p className="text-[13px] leading-relaxed text-slate-600">
                Fill the captcha for your challan receipt.
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
                {submitting ? 'Fetching receipt…' : 'Download Receipt'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
