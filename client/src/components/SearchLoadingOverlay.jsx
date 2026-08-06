import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

const PRESETS = {
  challan: {
    title: 'Searching Challans',
    subtitle: 'Pulling live records from official government sources',
    steps: [
      'Connecting to eChallan portal…',
      'Verifying vehicle number…',
      'Fetching pending & paid challans…',
      'Preparing your results…',
    ],
  },
  rc: {
    title: 'Fetching RC Details',
    subtitle: 'Accessing official RTO registration records',
    steps: [
      'Connecting to RTO database…',
      'Looking up registration details…',
      'Loading ownership & insurance…',
      'Almost ready…',
    ],
  },
}

/**
 * Full-screen branded search loader.
 * @param {{ type?: 'challan' | 'rc', vehicleNumber?: string, open?: boolean }} props
 */
export default function SearchLoadingOverlay({
  type = 'challan',
  vehicleNumber = '',
  open = true,
}) {
  const preset = PRESETS[type] || PRESETS.challan
  const [stepIdx, setStepIdx] = useState(0)
  const [progress, setProgress] = useState(8)

  useEffect(() => {
    if (!open) return undefined
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    setStepIdx(0)
    setProgress(8)

    const stepTimers = preset.steps.slice(1).map((_, i) =>
      setTimeout(() => setStepIdx(i + 1), (i + 1) * 1800)
    )

    const progressTimer = setInterval(() => {
      setProgress((p) => {
        if (p >= 92) return p
        const bump = p < 40 ? 3.2 : p < 70 ? 1.8 : 0.7
        return Math.min(92, p + bump)
      })
    }, 180)

    return () => {
      document.body.style.overflow = prev
      stepTimers.forEach(clearTimeout)
      clearInterval(progressTimer)
    }
  }, [open, preset.steps])

  if (!open || typeof document === 'undefined') return null

  return createPortal(
    <div
      className="search-loader-overlay"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="search-loader-backdrop" />
      <div className="search-loader-card animate-fade-up">
        <div className="search-loader-orbits" aria-hidden="true">
          <span className="search-loader-orbit search-loader-orbit--outer" />
          <span className="search-loader-orbit search-loader-orbit--mid" />
          <span className="search-loader-core">
            {type === 'rc' ? (
              <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.7">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            ) : (
              <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.7">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 17h.01M16 17h.01M5 11l1.5-4.5A2 2 0 018.4 5h7.2a2 2 0 011.9 1.5L19 11m-14 0h14m-14 0v6a2 2 0 002 2h1m11-8v6a2 2 0 01-2 2h-1" />
              </svg>
            )}
          </span>
        </div>

        <div className="mt-6 text-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-brand-red">
            Challan One
          </p>
          <h2 className="mt-2 text-[20px] font-extrabold tracking-tight text-slate-900 md:text-[22px]">
            {preset.title}
          </h2>
          {vehicleNumber ? (
            <p className="mt-2 inline-flex items-center rounded-full bg-slate-100 px-3.5 py-1 text-[13px] font-bold tracking-wider text-slate-800">
              {vehicleNumber}
            </p>
          ) : null}
          <p className="mx-auto mt-3 max-w-xs text-[13px] leading-relaxed text-slate-500">
            {preset.subtitle}
          </p>
        </div>

        <div className="mt-6">
          <div className="search-loader-bar">
            <div className="search-loader-bar-fill" style={{ width: `${progress}%` }} />
          </div>
          <p className="mt-3 text-center text-[12px] font-medium text-slate-600">
            {preset.steps[stepIdx]}
          </p>
        </div>

        <div className="mt-5 flex justify-center gap-1.5">
          {preset.steps.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full transition-all duration-500 ${
                i <= stepIdx ? 'w-6 bg-brand-red' : 'w-1.5 bg-slate-200'
              }`}
            />
          ))}
        </div>
      </div>
    </div>,
    document.body
  )
}
