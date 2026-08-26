import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useFeatures } from '../context/FeatureContext'
import SearchLoadingOverlay from '../components/SearchLoadingOverlay'
import VehicleRcResult from '../components/VehicleRcResult'
import { fetchVehicleInfo } from '../utils/vehicleInfo'
import { addRecentSearch } from '../utils/recentSearches'

/**
 * RC results page — reached via "Check RC Details" from /rc-details.
 * Reads the ?vehicle= param, fetches RC data and renders the result card.
 */
export default function VehicleInfo() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { isFeatureEnabled } = useFeatures()

  const vehicleNumber = (searchParams.get('vehicle') || '').trim().toUpperCase().replace(/\s/g, '')

  const [vehicle, setVehicle] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!vehicleNumber) {
      setError('Please enter a vehicle registration number')
      return
    }
    if (!isFeatureEnabled('rc_details')) {
      setError('RC Details lookup has been disabled. Please check back later.')
      return
    }

    let cancelled = false
    const load = async () => {
      setError('')
      setVehicle(null)
      setLoading(true)
      addRecentSearch(vehicleNumber, 'rc')
      try {
        const result = await fetchVehicleInfo(vehicleNumber)
        if (!cancelled) setVehicle(result)
      } catch (err) {
        if (!cancelled) setError(err.message || 'Network error. Please try again.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vehicleNumber])

  const handleNewSearch = () => navigate('/rc-details')

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 md:py-10">
      <SearchLoadingOverlay open={loading} type="rc" vehicleNumber={vehicleNumber} />

      {!loading && (
        <button
          type="button"
          onClick={handleNewSearch}
          className="mb-5 inline-flex items-center gap-2 text-[13px] font-semibold text-slate-500 hover:text-brand-red transition-colors"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 12H5M11 18l-6-6 6-6" />
          </svg>
          Back to RC Details
        </button>
      )}

      {!loading && error && (
        <div className="max-w-4xl mx-auto surface-card px-6 py-10 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
            <svg className="h-6 w-6 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M12 2l8.485 4.929a1 1 0 01.515.874V12c0 4.993-3.657 9.816-9 11-5.343-1.184-9-6.007-9-11V7.803a1 1 0 01.515-.874L12 2z" />
            </svg>
          </div>
          <h2 className="text-[18px] font-bold text-slate-900">Unable to fetch RC details</h2>
          <p className="mt-2 text-[14px] text-red-600 font-semibold">{error}</p>
          <div className="mt-6 flex justify-center gap-3">
            <button type="button" className="btn-primary" onClick={handleNewSearch}>
              New Search
            </button>
          </div>
        </div>
      )}

      {!loading && !error && vehicle && (
        <VehicleRcResult vehicle={vehicle} onNewSearch={handleNewSearch} />
      )}

      {!loading && !error && !vehicle && !vehicleNumber && (
        <div className="max-w-4xl mx-auto surface-card px-6 py-10 text-center">
          <p className="text-[14px] text-slate-500">No vehicle number provided. Go back and search for a vehicle.</p>
          <button type="button" className="btn-primary mt-6" onClick={handleNewSearch}>
            Go to Search
          </button>
        </div>
      )}
    </div>
  )
}
