import { useNavigate } from 'react-router-dom'

export default function PageHeader({ title, onBack, right = null }) {
  const navigate = useNavigate()
  const handleBack = () => {
    if (onBack) onBack()
    else navigate(-1)
  }

  return (
    <div className="bg-gradient-to-r from-blue-50 to-sky-50 border-b border-slate-100">
      <div className="container-main py-6 md:py-10">
        <div className="flex items-center gap-3">
          <button onClick={handleBack} className="icon-btn" aria-label="Go back">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="h-section">{title}</h1>
          {right && <div className="ml-auto">{right}</div>}
        </div>
      </div>
    </div>
  )
}
