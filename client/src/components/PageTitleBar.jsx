/**
 * Compact page title strip — form/content stays above the fold on mobile.
 */
export default function PageTitleBar({ title, subtitle, onBack, right = null }) {
  return (
    <div className="page-title-bar">
      <div className="container-main page-title-bar-inner">
        <div className="flex items-start gap-2 md:gap-3">
          {onBack && (
            <button type="button" onClick={onBack} className="icon-btn shrink-0 -ml-1" aria-label="Go back">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          <div className="min-w-0 flex-1">
            <h1 className="page-title">{title}</h1>
            {subtitle && <p className="page-subtitle">{subtitle}</p>}
          </div>
          {right && <div className="shrink-0">{right}</div>}
        </div>
      </div>
    </div>
  )
}
