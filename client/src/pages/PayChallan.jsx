import { useState, useEffect, useRef, useMemo } from 'react'
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom'
import { API, API_BASE_URL } from '../config/api'
import loadRazorpayScript from '../utils/loadRazorpayScript'
import DelhiOtpFlow from '../components/DelhiOtpFlow'
import ChallanResults, { ChallanResultsSkeleton } from '../components/ChallanResults'
import PaymentSummaryPanel from '../components/PaymentSummaryPanel'
import RecentSearches, { SearchLoadingButton } from '../components/RecentSearches'
import SearchLoadingOverlay from '../components/SearchLoadingOverlay'
import { useFeatures } from '../context/FeatureContext'
import {
  FLOW_TYPES,
  transformExternalChallans,
  calculatePaymentTotal
} from '../utils/challanUtils'
import { savePendingChallans } from '../utils/userStorage'
import { addRecentSearch } from '../utils/recentSearches'
import {
  loadChallanSearchState,
  saveChallanSearchState,
  clearChallanSearchState,
  getDefaultFilters,
} from '../utils/challanSearchCache'

function getAuthHeaders() {
  const token = localStorage.getItem('authToken')
  return token ? { 'Authorization': `Bearer ${token}` } : {}
}

async function requestExternalChallans(vehicleNumber) {
  const response = await fetch(`${API_BASE_URL}/api/external/challan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify({ vehicleNumber, bypassCache: true })
  })
  const result = await response.json()
  if (!response.ok || !result.success) {
    throw new Error(result.message || 'Failed to fetch e-Challan/Parivahan records')
  }
  return transformExternalChallans(result)
}

function EmptyResultsPanel() {
  return (
    <div className="surface-card flex flex-col items-center justify-center text-center px-6 py-16 md:py-24 min-h-[420px]">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-brand-red mb-4">
        <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>
      <h3 className="text-[17px] font-bold text-slate-900">Challan Details</h3>
      <p className="mt-2 text-[13px] md:text-[14px] text-slate-500 max-w-sm leading-relaxed">
        Enter your vehicle number in the sidebar and search to fetch challans from official sources.
      </p>
    </div>
  )
}

export default function PayChallan() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { isFeatureEnabled } = useFeatures()
  const [cachedSearch] = useState(() => loadChallanSearchState())
  const allChallansSnapshot = useRef(null)
  const combinedRequestId = useRef(0)
  const queryVehicle = searchParams.get('vehicle')
  const querySource = searchParams.get('source')
  const queryMobile = location.state?.mobileNumber || ''
  const navigationResult = location.state?.challanSearchResult || null
  const autoFetchKey = useRef('')

  const [flowType, setFlowType] = useState(
    querySource === 'external'
      ? FLOW_TYPES.EXTERNAL_CHALLANS
      : navigationResult
        ? FLOW_TYPES.ALL_CHALLANS
      : queryVehicle
        ? FLOW_TYPES.ALL_CHALLANS
        : cachedSearch?.flowType || FLOW_TYPES.ALL_CHALLANS
  )
  const [vehicleNumber, setVehicleNumber] = useState(queryVehicle || cachedSearch?.vehicleNumber || '')
  const [mobileNumber, setMobileNumber] = useState(queryMobile)
  const [loading, setLoading] = useState(false)
  const [paymentLoading, setPaymentLoading] = useState(false)
  const [data, setData] = useState(
    navigationResult || (queryVehicle ? null : cachedSearch?.data || null)
  )
  const [error, setError] = useState(null)
  const [selectedChallans, setSelectedChallans] = useState(
    navigationResult ? [] : cachedSearch?.selectedChallans || []
  )
  const [filters, setFilters] = useState(
    navigationResult ? getDefaultFilters() : cachedSearch?.filters || getDefaultFilters()
  )
  const [fetchedAt, setFetchedAt] = useState(
    navigationResult ? Date.now() : queryVehicle ? null : cachedSearch?.fetchedAt || null
  )
  const [recentRefreshKey, setRecentRefreshKey] = useState(0)
  const [combinedRun, setCombinedRun] = useState(null)
  const [combinedExternalData, setCombinedExternalData] = useState(null)
  const [combinedExternalStatus, setCombinedExternalStatus] = useState('idle')
  const [verifiedDelhiResults, setVerifiedDelhiResults] = useState(null)

  // Persist search state so navigating away and back restores results
  useEffect(() => {
    if (!data) {
      // Keep Fetch All cache while Delhi OTP flow is open
      if (flowType === FLOW_TYPES.DELHI_OTP && allChallansSnapshot.current) return
      clearChallanSearchState()
      return
    }
    if (data.dataSource === 'DELHI_OTP') {
      // Don't overwrite Fetch All session cache with Delhi results
      return
    }
    saveChallanSearchState({
      data,
      vehicleNumber: data.vehicle?.number || vehicleNumber,
      flowType,
      selectedChallans,
      filters,
      fetchedAt: fetchedAt || Date.now(),
    })
  }, [data, vehicleNumber, flowType, selectedChallans, filters, fetchedAt])

  const fetchAllSources = async (number, mobile = mobileNumber) => {
    const trimmed = String(number || '').trim().toUpperCase()
    if (!trimmed) {
      setError('Please enter a vehicle number')
      return
    }
    const trimmedMobile = mobile.trim()
    if (!/^[6-9]\d{9}$/.test(trimmedMobile)) {
      setError('Enter a valid 10-digit mobile number to verify Delhi challans')
      return
    }
    if (!isFeatureEnabled('delhi_otp_challan')) {
      setError('Fetch All Challans is temporarily unavailable because Delhi OTP verification is disabled')
      return
    }

    setLoading(true)
    const requestId = ++combinedRequestId.current
    setError(null)
    setCombinedRun(null)
    setCombinedExternalData(null)
    setCombinedExternalStatus('loading')
    setVerifiedDelhiResults(null)
    setData(null)
    addRecentSearch(trimmed, 'challan')
    setRecentRefreshKey((k) => k + 1)

    const createDelhiRun = async () => {
      const response = await fetch(API.delhiOtp.createRun, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ vehicleNumber: trimmed, mobileNumber: trimmedMobile })
      })
      const result = await response.json()
      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to start Delhi OTP verification')
      }
      return result
    }

    const externalResultPromise = requestExternalChallans(trimmed).then(
      (externalData) => ({ externalData, externalError: null }),
      (externalFailure) => ({
        externalData: null,
        externalError: externalFailure?.message || 'Failed to fetch e-Challan/Parivahan records'
      })
    )

    try {
      const delhiRun = await createDelhiRun()
      setVehicleNumber(trimmed)
      setMobileNumber(trimmedMobile)
      setCombinedRun({
        ...delhiRun,
        vehicleNumber: trimmed,
        mobileNumber: trimmedMobile
      })
      setSelectedChallans([])
      setFilters(getDefaultFilters())
      setFetchedAt(Date.now())
      externalResultPromise.then(({ externalData, externalError }) => {
        if (requestId !== combinedRequestId.current) return
        setCombinedExternalData(externalData)
        setCombinedExternalStatus('complete')
        setError(externalError ? `e-Challan/Parivahan: ${externalError}` : null)
      })
    } catch (delhiFailure) {
      const { externalData, externalError } = await externalResultPromise
      setVehicleNumber(trimmed)
      setMobileNumber(trimmedMobile)
      setCombinedExternalData(externalData)
      setCombinedExternalStatus('complete')

      const delhiError = delhiFailure?.message || 'Failed to start Delhi OTP verification'
      if (externalData?.hasRawChallans) {
        setData(externalData)
        setSelectedChallans([])
        setFilters(getDefaultFilters())
        setFetchedAt(Date.now())
        setError(`Delhi OTP: ${delhiError}`)
        allChallansSnapshot.current = {
          data: externalData,
          selectedChallans: [],
          filters: getDefaultFilters(),
          fetchedAt: Date.now(),
          vehicleNumber: trimmed,
        }
      } else {
        setError(
          externalError
            ? `e-Challan/Parivahan: ${externalError}. Delhi OTP: ${delhiError}`
            : `Delhi OTP: ${delhiError}. No e-Challan/Parivahan challans were found.`
        )
        setFetchedAt(null)
        clearChallanSearchState()
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const vehicle = searchParams.get('vehicle')
    if (!vehicle) return
    setVehicleNumber(vehicle)
    setMobileNumber(location.state?.mobileNumber || '')
    setFlowType(searchParams.get('source') === 'external'
      ? FLOW_TYPES.EXTERNAL_CHALLANS
      : FLOW_TYPES.ALL_CHALLANS)
  }, [searchParams, location.state])

  useEffect(() => {
    const vehicle = searchParams.get('vehicle')
    const source = searchParams.get('source')
    const mobile = location.state?.mobileNumber || ''
    if (source !== 'all' || !vehicle || !/^[6-9]\d{9}$/.test(mobile)) return

    const key = `${vehicle.trim().toUpperCase()}:${mobile}`
    if (autoFetchKey.current === key) return
    autoFetchKey.current = key
    fetchAllSources(vehicle, mobile)
  // The URL parameters identify one explicit homepage submission.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, location.state])

  const fetchExternalOnly = async (number) => {
    const trimmed = String(number || '').trim().toUpperCase()
    if (!trimmed) {
      setError('Please enter a vehicle number')
      return
    }

    setLoading(true)
    combinedRequestId.current += 1
    setError(null)
    setCombinedRun(null)
    setCombinedExternalData(null)
    addRecentSearch(trimmed, 'challan')
    setRecentRefreshKey((k) => k + 1)

    try {
      const transformed = await requestExternalChallans(trimmed)
      setVehicleNumber(trimmed)
      setSelectedChallans([])
      setFilters(getDefaultFilters())
      setFetchedAt(Date.now())
      if (transformed.hasRawChallans) {
        setData(transformed)
      } else {
        setData(null)
        setError('No e-Challan/Parivahan challans found')
        setFetchedAt(null)
        clearChallanSearchState()
      }
    } catch (err) {
      setError(err?.message || 'Failed to fetch e-Challan/Parivahan records')
      setData(null)
      setFetchedAt(null)
      clearChallanSearchState()
    } finally {
      setLoading(false)
    }
  }

  const completeChallanSearch = (challans, vNum, externalData = null, isCombinedSearch = false) => {
    const fetchedChallans = isCombinedSearch
      ? [...challans, ...(externalData?.challans || [])]
      : challans
    const seenChallans = new Set()
    const mergedChallans = fetchedChallans.filter((challan) => {
      const identifier = String(
        challan.noticeId || challan.challanNumber || challan.id || ''
      ).trim().toUpperCase()
      if (!identifier || seenChallans.has(identifier)) return false
      seenChallans.add(identifier)
      return true
    })
    if (mergedChallans.length === 0) {
      setError(isCombinedSearch ? 'No challans found from either source' : 'No challans found')
      setCombinedRun(null)
      setCombinedExternalData(null)
      setCombinedExternalStatus('idle')
      setVerifiedDelhiResults(null)
      setData(null)
      setFetchedAt(null)
      clearChallanSearchState()
      return
    }

    const trimmed = String(vNum || '').trim().toUpperCase()
    if (trimmed) {
      addRecentSearch(trimmed, 'challan')
      setRecentRefreshKey((k) => k + 1)
    }

    const transformedVehicle = {
      number: vNum,
      owner: mergedChallans[0]?.accusedName || 'Owner',
      vehicleType: 'Private Vehicle',
      isVerified: true,
    }

    const pending = mergedChallans.filter((c) => c.status !== 'PAID')

    setData({
      success: true,
      dataSource: isCombinedSearch ? 'COMBINED' : 'DELHI_OTP',
      vehicle: transformedVehicle,
      challans: mergedChallans,
      pendingCount: pending.length,
      paidCount: mergedChallans.length - pending.length
    })
    setSelectedChallans([])
    setFilters(getDefaultFilters())
    setFetchedAt(Date.now())
    setVehicleNumber(vNum)
    if (isCombinedSearch) {
      setFlowType(FLOW_TYPES.ALL_CHALLANS)
      setCombinedRun(null)
      setCombinedExternalData(null)
      setCombinedExternalStatus('idle')
      setVerifiedDelhiResults(null)
    }
    if (pending.length > 0) {
      savePendingChallans(vNum, pending)
    }
  }

  const handleDelhiChallansFound = ({ challans, vehicleNumber: vNum }) => {
    if (combinedRun) {
      setVerifiedDelhiResults({ challans, vehicleNumber: vNum })
      return
    }

    completeChallanSearch(challans, vNum)
  }

  useEffect(() => {
    if (!combinedRun || !verifiedDelhiResults || combinedExternalStatus !== 'complete') return
    completeChallanSearch(
      verifiedDelhiResults.challans,
      verifiedDelhiResults.vehicleNumber,
      combinedExternalData,
      true
    )
  }, [combinedRun, verifiedDelhiResults, combinedExternalStatus, combinedExternalData])

  useEffect(() => {
    if (!data?.vehicle?.number || !data?.challans) return
    const pending = data.challans.filter((c) => c.status !== 'PAID')
    if (pending.length > 0) {
      savePendingChallans(data.vehicle.number, pending)
    }
  }, [data])

  const toggleChallanSelection = (id) => {
    setSelectedChallans((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  const selectAllPending = () => {
    if (!data) return
    setSelectedChallans(data.challans.filter((c) => c.status !== 'PAID').map((c) => c.id))
  }

  const deselectAllChallans = () => {
    setSelectedChallans([])
  }

  const handleCheckNow = (e) => {
    e?.preventDefault?.()
    if (flowType === FLOW_TYPES.DELHI_OTP) return
    if (!vehicleNumber.trim()) {
      setError('Please enter a vehicle number')
      return
    }
    if (!isFeatureEnabled('fetch_all_challans')) {
      setError('Fetch All Challans is temporarily unavailable')
      return
    }
    if (flowType === FLOW_TYPES.EXTERNAL_CHALLANS) {
      fetchExternalOnly(vehicleNumber.trim())
      return
    }
    fetchAllSources(vehicleNumber.trim())
  }

  const handlePayment = async (idsOrSingle) => {
    const idsToPay = Array.isArray(idsOrSingle)
      ? idsOrSingle
      : idsOrSingle
        ? [idsOrSingle]
        : selectedChallans
    if (idsToPay.length === 0) return

    setPaymentLoading(true)
    try {
      const loaded = await loadRazorpayScript()
      if (!loaded) {
        alert('Failed to load payment gateway. Please check your internet connection and try again.')
        setPaymentLoading(false)
        return
      }
      const userStr = localStorage.getItem('user')
      const user = userStr ? JSON.parse(userStr) : {}
      const challansToPay = data.challans.filter(c => idsToPay.includes(c.id) && c.status !== 'PAID')
      const { subtotal, courtFeeTotal, convenienceFee, total } = calculatePaymentTotal(challansToPay)

      const orderResponse = await fetch(`${API_BASE_URL}/api/payment/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: total,
          vehicleNumber: data.vehicle.number,
          challans: challansToPay,
          userEmail: user.email || ''
        })
      })

      const orderData = await orderResponse.json()
      if (!orderResponse.ok || !orderData.success) {
        throw new Error(orderData.message || 'Failed to create order')
      }

      const options = {
        key: orderData.key,
        amount: orderData.order.amount,
        currency: orderData.order.currency,
        name: 'E-Challan Payment',
        description: `Payment for ${idsToPay.length} challan(s) - ${data.vehicle.number}`,
        order_id: orderData.order.id,
        handler: async function (response) {
          try {
            const verifyResponse = await fetch(`${API_BASE_URL}/api/payment/verify`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                vehicleNumber: data.vehicle.number,
                challans: challansToPay,
                subtotal,
                courtFee: courtFeeTotal,
                convenienceFee,
                totalAmount: total,
                userEmail: user.email || ''
              })
            })
            const verifyData = await verifyResponse.json()
            if (!verifyResponse.ok || !verifyData.success) {
              throw new Error(verifyData.message || 'Payment verification failed')
            }
            clearChallanSearchState()
            navigate('/payment-success', {
              state: { receipt: verifyData.receipt, vehicleNumber: data.vehicle.number }
            })
          } catch (err) {
            console.error('Verification error:', err)
            alert(err.message || 'Payment verification failed. Please contact support.')
            setPaymentLoading(false)
          }
        },
        prefill: { name: user.name || '', email: user.email || '', contact: user.phone || '' },
        theme: { color: '#dc2626' },
        modal: { ondismiss: () => setPaymentLoading(false) }
      }

      const rzp = new window.Razorpay(options)
      rzp.on('payment.failed', function (response) {
        alert(`Payment failed: ${response.error?.description || 'Please try again.'}`)
        setPaymentLoading(false)
      })
      rzp.open()
    } catch (err) {
      console.error('Payment error:', err)
      alert(err.message || 'Failed to initiate payment. Please try again.')
      setPaymentLoading(false)
    }
  }

  const goBackToSelector = () => {
    setData(null)
    setError(null)
    setSelectedChallans([])
    setFilters(getDefaultFilters())
    setFetchedAt(null)
    setLoading(false)
    allChallansSnapshot.current = null
    clearChallanSearchState()
  }

  const handleRefresh = () => {
    if (!data?.vehicle?.number) return
    if (flowType === FLOW_TYPES.EXTERNAL_CHALLANS) {
      fetchExternalOnly(data.vehicle.number)
    } else {
      fetchAllSources(data.vehicle.number)
    }
  }

  const cancelCombinedSearch = () => {
    combinedRequestId.current += 1
    setCombinedRun(null)
    setCombinedExternalData(null)
    setError(null)
  }

  const showResult = data && !loading
  const allEnabled = isFeatureEnabled('fetch_all_challans') && isFeatureEnabled('delhi_otp_challan')
  const externalEnabled = isFeatureEnabled('fetch_all_challans')
  const delhiEnabled = isFeatureEnabled('delhi_otp_challan')
  const isVehicleSearchFlow = flowType !== FLOW_TYPES.DELHI_OTP

  const selectedPendingChallans = useMemo(() => {
    if (!data?.challans) return []
    return data.challans.filter((c) => selectedChallans.includes(c.id) && c.status !== 'PAID')
  }, [data, selectedChallans])

  return (
    <div className="relative flex min-h-screen flex-col bg-slate-50">
      <SearchLoadingOverlay
        open={isVehicleSearchFlow && loading}
        type="challan"
        vehicleNumber={vehicleNumber}
      />
      <div className="flex-1 pt-0 pb-6 md:pt-2 md:pb-12">
        <div className="mx-auto w-full px-3 md:px-4 xl:px-5 py-4 md:py-6 space-y-5">
          <div
            className={`grid grid-cols-1 gap-3 md:gap-4 items-start ${
              showResult
                ? 'lg:grid-cols-[200px_minmax(0,1fr)] xl:grid-cols-[210px_minmax(0,1fr)_250px] 2xl:grid-cols-[220px_minmax(0,1fr)_270px]'
                : 'lg:grid-cols-[210px_minmax(0,1fr)] xl:grid-cols-[220px_minmax(0,1fr)]'
            }`}
          >
            {/* Left sidebar — search, source & recent */}
            <div className="space-y-3 lg:sticky lg:top-[84px]">
              <aside className="surface-card overflow-hidden border-slate-200/80">
                <div className="border-b border-slate-100 bg-slate-50/80 px-4 py-3">
                  <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">
                    Vehicle Search
                  </p>
                </div>

                <div className="space-y-3.5 p-3.5">
                  <div className="space-y-2">
                    <label className="block">
                      <span className="mb-1 block text-[12px] font-medium text-slate-600">Vehicle Number</span>
                      <input
                        type="text"
                        placeholder="DL8CAF1234"
                        value={vehicleNumber}
                        onChange={(e) => {
                          setVehicleNumber(e.target.value.toUpperCase())
                          setError(null)
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && isVehicleSearchFlow) {
                            handleCheckNow(e)
                          }
                        }}
                        disabled={!isVehicleSearchFlow || loading || Boolean(combinedRun)}
                        className="input-field !py-2.5 text-[14px] font-bold tracking-wide uppercase disabled:opacity-60"
                      />
                    </label>
                    {isVehicleSearchFlow && (
                      <>
                        {flowType === FLOW_TYPES.ALL_CHALLANS && (
                          <label className="block">
                          <span className="mb-1 block text-[12px] font-medium text-slate-600">Registered Mobile Number</span>
                          <input
                            type="tel"
                            inputMode="numeric"
                            autoComplete="tel-national"
                            placeholder="10-digit mobile number"
                            value={mobileNumber}
                            onChange={(e) => {
                              setMobileNumber(e.target.value.replace(/\D/g, '').slice(0, 10))
                              setError(null)
                            }}
                            disabled={loading || Boolean(combinedRun)}
                            className="input-field !py-2.5 text-[14px] tracking-wide disabled:opacity-60"
                          />
                          </label>
                        )}
                        {!combinedRun && (
                          <SearchLoadingButton
                            onClick={handleCheckNow}
                            loading={loading}
                            loadingLabel={flowType === FLOW_TYPES.ALL_CHALLANS ? 'Searching both sources…' : 'Searching…'}
                            disabled={!vehicleNumber.trim() || (flowType === FLOW_TYPES.ALL_CHALLANS ? !allEnabled : !externalEnabled)}
                            className="!py-2.5 text-[13px]"
                          >
                            <span className="inline-flex items-center justify-center gap-2">
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
                              </svg>
                              {flowType === FLOW_TYPES.ALL_CHALLANS ? 'Search All Challans' : 'Search e-Challan'}
                            </span>
                          </SearchLoadingButton>
                        )}
                        {flowType === FLOW_TYPES.ALL_CHALLANS && (
                          <p className="text-[11px] leading-relaxed text-slate-500">
                            e-Challan/Parivahan and Delhi challans are fetched together. Delhi records require OTP verification.
                          </p>
                        )}
                      </>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">
                      Challan Source
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        if (!allEnabled || loading || combinedRun) return
                        setFlowType(FLOW_TYPES.ALL_CHALLANS)
                        setError(null)
                        setCombinedRun(null)
                        setCombinedExternalData(null)
                        setData(null)
                      }}
                      disabled={!allEnabled || loading || Boolean(combinedRun)}
                      aria-pressed={flowType === FLOW_TYPES.ALL_CHALLANS}
                      className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-[13px] font-semibold transition ${
                        flowType === FLOW_TYPES.ALL_CHALLANS
                          ? 'bg-red-50 text-brand-red ring-1 ring-red-100'
                          : 'text-slate-600 hover:bg-slate-50'
                      } ${!allEnabled || loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <span
                        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 ${
                          flowType === FLOW_TYPES.ALL_CHALLANS
                            ? 'border-brand-red'
                            : 'border-slate-300'
                        }`}
                      >
                        {flowType === FLOW_TYPES.ALL_CHALLANS && (
                          <span className="h-2 w-2 rounded-full bg-brand-red" />
                        )}
                      </span>
                      All Challans (Recommended)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (!externalEnabled || loading || combinedRun) return
                        setFlowType(FLOW_TYPES.EXTERNAL_CHALLANS)
                        setError(null)
                        setCombinedRun(null)
                        setCombinedExternalData(null)
                        setData(null)
                      }}
                      disabled={!externalEnabled || loading || Boolean(combinedRun)}
                      aria-pressed={flowType === FLOW_TYPES.EXTERNAL_CHALLANS}
                      className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-[13px] font-semibold transition ${
                        flowType === FLOW_TYPES.EXTERNAL_CHALLANS
                          ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-100'
                          : 'text-slate-600 hover:bg-slate-50'
                      } ${!externalEnabled || loading || combinedRun ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 ${
                        flowType === FLOW_TYPES.EXTERNAL_CHALLANS ? 'border-blue-500' : 'border-slate-300'
                      }`}>
                        {flowType === FLOW_TYPES.EXTERNAL_CHALLANS && (
                          <span className="h-2 w-2 rounded-full bg-blue-500" />
                        )}
                      </span>
                      e-Challan / Parivahan
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (!delhiEnabled || loading || combinedRun) return
                        if (data && data.dataSource !== 'DELHI_OTP') {
                          allChallansSnapshot.current = {
                            data,
                            selectedChallans,
                            filters,
                            fetchedAt,
                            vehicleNumber: data.vehicle?.number || vehicleNumber,
                          }
                        }
                        setFlowType(FLOW_TYPES.DELHI_OTP)
                        setError(null)
                        setSelectedChallans([])
                        setData(null)
                        setCombinedRun(null)
                        setCombinedExternalData(null)
                        setLoading(false)
                      }}
                      disabled={!delhiEnabled || loading || Boolean(combinedRun)}
                      aria-pressed={flowType === FLOW_TYPES.DELHI_OTP}
                      className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-[13px] font-semibold transition ${
                        flowType === FLOW_TYPES.DELHI_OTP
                          ? 'bg-orange-50 text-orange-700 ring-1 ring-orange-100'
                          : 'text-slate-600 hover:bg-slate-50'
                      } ${!delhiEnabled || loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <span
                        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 ${
                          flowType === FLOW_TYPES.DELHI_OTP
                            ? 'border-orange-500'
                            : 'border-slate-300'
                        }`}
                      >
                        {flowType === FLOW_TYPES.DELHI_OTP && (
                          <span className="h-2 w-2 rounded-full bg-orange-500" />
                        )}
                      </span>
                      Delhi Traffic Challans
                    </button>
                  </div>

                  {error && isVehicleSearchFlow && (
                    <p className="rounded-lg border border-rose-100 bg-rose-50 px-3 py-2 text-[12px] text-rose-600">
                      {error}
                    </p>
                  )}
                </div>
              </aside>

              {isVehicleSearchFlow && (
                <RecentSearches
                  type="challan"
                  refreshKey={recentRefreshKey}
                  onSelect={(number) => {
                    if (loading) return
                    setVehicleNumber(number)
                    setError(null)
                    flowType === FLOW_TYPES.EXTERNAL_CHALLANS
                      ? fetchExternalOnly(number)
                      : fetchAllSources(number)
                  }}
                />
              )}
            </div>

            {/* Main content */}
            <main className="min-w-0">
              {flowType === FLOW_TYPES.DELHI_OTP && !showResult && (
                <div className="surface-card p-4 md:p-6">
                  <DelhiOtpFlow
                    onChallansFound={handleDelhiChallansFound}
                    onBack={() => {
                      setFlowType(FLOW_TYPES.ALL_CHALLANS)
                      setError(null)
                      setCombinedRun(null)
                      setCombinedExternalData(null)
                      if (allChallansSnapshot.current) {
                        const snapshot = allChallansSnapshot.current
                        setData(snapshot.data)
                        setSelectedChallans(snapshot.selectedChallans)
                        setFilters(snapshot.filters)
                        setFetchedAt(snapshot.fetchedAt)
                        setVehicleNumber(snapshot.vehicleNumber)
                        allChallansSnapshot.current = null
                      }
                    }}
                  />
                </div>
              )}

              {flowType === FLOW_TYPES.ALL_CHALLANS && combinedRun && !showResult && (
                <div className="surface-card p-4 md:p-6">
                  <DelhiOtpFlow
                    key={combinedRun.runId}
                    initialRun={combinedRun}
                    onChallansFound={handleDelhiChallansFound}
                    onBack={cancelCombinedSearch}
                    onCancel={cancelCombinedSearch}
                  />
                </div>
              )}

              {isVehicleSearchFlow && loading && (
                <div className="surface-card min-h-[420px] opacity-40">
                  <ChallanResultsSkeleton vehicleNumber={vehicleNumber} />
                </div>
              )}

              {showResult && data.sourceErrors?.external && (
                <p
                  role="status"
                  className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[12px] text-amber-800"
                >
                  e-Challan/Parivahan: {data.sourceErrors.external}
                </p>
              )}

              {showResult && (
                <ChallanResults
                  data={data}
                  dataSource={data.dataSource}
                  selectedChallans={selectedChallans}
                  onToggleChallan={toggleChallanSelection}
                  onSelectAllPending={selectAllPending}
                  onDeselectAll={deselectAllChallans}
                  onPay={handlePayment}
                  onBack={goBackToSelector}
                  onRefresh={data.dataSource !== 'DELHI_OTP' ? handleRefresh : undefined}
                  paymentLoading={paymentLoading}
                  filters={filters}
                  onFiltersChange={setFilters}
                />
              )}

              {isVehicleSearchFlow && !loading && !showResult && (
                <EmptyResultsPanel />
              )}
            </main>

            {/* Sticky payment summary — desktop */}
            {showResult && (
              <div className="hidden xl:block">
                <PaymentSummaryPanel
                  selectedChallans={selectedPendingChallans}
                  paymentLoading={paymentLoading}
                  onPay={handlePayment}
                />
              </div>
            )}
          </div>

          {/* Payment summary — below xl where 3-col grid is not active */}
          {showResult && (
            <div className="xl:hidden">
              <PaymentSummaryPanel
                selectedChallans={selectedPendingChallans}
                paymentLoading={paymentLoading}
                onPay={handlePayment}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
