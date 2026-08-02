import { useState, useEffect, useRef, useMemo } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { API_BASE_URL } from '../config/api'
import DelhiOtpFlow from '../components/DelhiOtpFlow'
import ChallanResults, { ChallanResultsSkeleton } from '../components/ChallanResults'
import PaymentSummaryPanel from '../components/PaymentSummaryPanel'
import { useFeatures } from '../context/FeatureContext'
import {
  FLOW_TYPES,
  transformExternalChallans,
  calculatePaymentTotal
} from '../utils/challanUtils'
import { savePendingChallans } from '../utils/userStorage'
import {
  loadChallanSearchState,
  saveChallanSearchState,
  clearChallanSearchState,
  getDefaultFilters,
} from '../utils/challanSearchCache'

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
  const { isFeatureEnabled } = useFeatures()
  const cachedRef = useRef(loadChallanSearchState())
  const cached = cachedRef.current
  const autoFetchDone = useRef(false)
  const allChallansSnapshot = useRef(null)

  const [flowType, setFlowType] = useState(cached?.flowType || FLOW_TYPES.ALL_CHALLANS)
  const [vehicleNumber, setVehicleNumber] = useState(
    searchParams.get('vehicle') || cached?.vehicleNumber || ''
  )
  const [loading, setLoading] = useState(false)
  const [paymentLoading, setPaymentLoading] = useState(false)
  const [data, setData] = useState(cached?.data || null)
  const [error, setError] = useState(null)
  const [selectedChallans, setSelectedChallans] = useState(cached?.selectedChallans || [])
  const [filters, setFilters] = useState(cached?.filters || getDefaultFilters())
  const [fetchedAt, setFetchedAt] = useState(cached?.fetchedAt || null)

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) return resolve(true)
      const existing = document.querySelector('script[src*="checkout.razorpay.com"]')
      if (existing) {
        existing.onload = () => resolve(true)
        existing.onerror = () => resolve(false)
        return
      }
      const script = document.createElement('script')
      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
      script.async = true
      script.onload = () => resolve(true)
      script.onerror = () => resolve(false)
      document.body.appendChild(script)
    })
  }

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
      flowType: FLOW_TYPES.ALL_CHALLANS,
      selectedChallans,
      filters,
      fetchedAt: fetchedAt || Date.now(),
    })
  }, [data, vehicleNumber, flowType, selectedChallans, filters, fetchedAt])

  const fetchChallans = async (number, { force = false, forceRefresh = false } = {}) => {
    const trimmed = String(number || '').trim().toUpperCase()
    if (!trimmed) {
      setError('Please enter a vehicle number')
      return
    }

    // Reuse cache when returning to same vehicle unless force refresh
    if (
      !force &&
      data?.vehicle?.number === trimmed &&
      data?.challans?.length &&
      fetchedAt
    ) {
      return
    }

    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`${API_BASE_URL}/api/external/challan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vehicleNumber: trimmed, forceRefresh })
      })
      const result = await response.json()
      if (result.success) {
        const transformed = transformExternalChallans(result)

        if (!transformed.hasRawChallans) {
          setError(result.message || 'No challans found')
          setData(null)
          setFetchedAt(null)
          clearChallanSearchState()
          setLoading(false)
          return
        }

        setData(transformed)
        setSelectedChallans([])
        setFilters(getDefaultFilters())
        setFetchedAt(Date.now())
        setVehicleNumber(trimmed)
        allChallansSnapshot.current = {
          data: transformed,
          selectedChallans: [],
          filters: getDefaultFilters(),
          fetchedAt: Date.now(),
          vehicleNumber: trimmed,
        }
      } else {
        setError(result.message || 'No challans found')
        setData(null)
        setFetchedAt(null)
        clearChallanSearchState()
      }
    } catch (err) {
      setError(err?.message || 'Failed to fetch challans. Please try again.')
      setData(null)
      setFetchedAt(null)
      clearChallanSearchState()
    }
    setLoading(false)
  }

  useEffect(() => {
    const vehicle = searchParams.get('vehicle')
    if (!vehicle || autoFetchDone.current) return
    autoFetchDone.current = true
    setVehicleNumber(vehicle)
    setFlowType(FLOW_TYPES.ALL_CHALLANS)

    const cachedSame =
      data?.vehicle?.number?.toUpperCase() === vehicle.toUpperCase() &&
      data?.challans?.length
    if (cachedSame) return

    fetchChallans(vehicle, { force: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  const handleDelhiChallansFound = ({ challans, vehicleNumber: vNum }) => {
    if (challans.length === 0) return

    const transformedVehicle = {
      number: vNum,
      owner: challans[0]?.accusedName || 'Owner',
      vehicleType: 'Private Vehicle',
      isVerified: true,
    }

    const pending = challans.filter((c) => c.status !== 'PAID')

    setData({
      success: true,
      dataSource: 'DELHI_OTP',
      vehicle: transformedVehicle,
      challans,
      pendingCount: pending.length,
      paidCount: challans.length - pending.length
    })
    setSelectedChallans([])
    setFilters(getDefaultFilters())
    setFetchedAt(Date.now())
    setVehicleNumber(vNum)
    if (pending.length > 0) {
      savePendingChallans(vNum, pending)
    }
  }

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
    fetchChallans(vehicleNumber.trim(), { force: true })
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
      if (!orderData.success) throw new Error(orderData.message || 'Failed to create order')

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
            if (verifyData.success) {
              clearChallanSearchState()
              navigate('/payment-success', {
                state: { receipt: verifyData.receipt, vehicleNumber: data.vehicle.number }
              })
            } else {
              alert('Payment verification failed. Please contact support.')
            }
          } catch (err) {
            console.error('Verification error:', err)
            alert('Payment verification failed. Please contact support.')
          }
        },
        prefill: { name: user.name || '', email: user.email || '', contact: user.phone || '' },
        theme: { color: '#dc2626' },
        modal: { ondismiss: () => setPaymentLoading(false) }
      }

      const rzp = new window.Razorpay(options)
      rzp.on('payment.failed', function (response) {
        alert(`Payment failed: ${response.error.description}`)
        setPaymentLoading(false)
      })
      rzp.open()
    } catch (err) {
      console.error('Payment error:', err)
      alert(err.message || 'Failed to initiate payment. Please try again.')
    }
    setPaymentLoading(false)
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
    fetchChallans(data.vehicle.number, { force: true, forceRefresh: true })
  }

  const showResult = data && !loading
  const allEnabled = isFeatureEnabled('fetch_all_challans')
  const delhiEnabled = isFeatureEnabled('delhi_otp_challan')

  const selectedPendingChallans = useMemo(() => {
    if (!data?.challans) return []
    return data.challans.filter((c) => selectedChallans.includes(c.id) && c.status !== 'PAID')
  }, [data, selectedChallans])

  return (
    <div className="relative flex min-h-screen flex-col bg-slate-50">
      <div className="flex-1 pt-0 pb-6 md:pt-2 md:pb-12">
        <div className="mx-auto w-full px-3 md:px-4 xl:px-5 py-4 md:py-6 space-y-5">
          <div
            className={`grid grid-cols-1 gap-3 md:gap-4 items-start ${
              showResult
                ? 'lg:grid-cols-[200px_minmax(0,1fr)] xl:grid-cols-[210px_minmax(0,1fr)_250px] 2xl:grid-cols-[220px_minmax(0,1fr)_270px]'
                : 'lg:grid-cols-[210px_minmax(0,1fr)] xl:grid-cols-[220px_minmax(0,1fr)]'
            }`}
          >
            {/* Left sidebar — search & source */}
            <aside className="surface-card overflow-hidden border-slate-200/80 lg:sticky lg:top-[84px]">
              <div className="border-b border-slate-100 bg-slate-50/80 px-4 py-3">
                <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">
                  Vehicle Search
                </p>
              </div>

              <div className="space-y-3.5 p-3.5">
                {/* Always-visible vehicle search */}
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
                        if (e.key === 'Enter' && flowType === FLOW_TYPES.ALL_CHALLANS) {
                          handleCheckNow(e)
                        }
                      }}
                      disabled={flowType === FLOW_TYPES.DELHI_OTP}
                      className="input-field !py-2.5 text-[14px] font-bold tracking-wide uppercase disabled:opacity-60"
                    />
                  </label>
                  {flowType === FLOW_TYPES.ALL_CHALLANS && (
                    <button
                      type="button"
                      onClick={handleCheckNow}
                      disabled={loading || !vehicleNumber.trim() || !allEnabled}
                      className="btn-primary w-full !py-2.5 text-[13px]"
                    >
                      {loading ? 'Searching...' : 'Search Vehicle'}
                    </button>
                  )}
                </div>

                {/* Challan source — nav style */}
                <div className="space-y-1.5">
                  <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">
                    Challan Source
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      if (!allEnabled) return
                      setFlowType(FLOW_TYPES.ALL_CHALLANS)
                      setError(null)
                      // Restore previous Fetch All results if available
                      if (!data && allChallansSnapshot.current) {
                        setData(allChallansSnapshot.current.data)
                        setSelectedChallans(allChallansSnapshot.current.selectedChallans || [])
                        setFilters(allChallansSnapshot.current.filters || getDefaultFilters())
                        setFetchedAt(allChallansSnapshot.current.fetchedAt || Date.now())
                        setVehicleNumber(allChallansSnapshot.current.vehicleNumber || vehicleNumber)
                      }
                    }}
                    disabled={!allEnabled}
                    aria-pressed={flowType === FLOW_TYPES.ALL_CHALLANS}
                    className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-[13px] font-semibold transition ${
                      flowType === FLOW_TYPES.ALL_CHALLANS
                        ? 'bg-red-50 text-brand-red ring-1 ring-red-100'
                        : 'text-slate-600 hover:bg-slate-50'
                    } ${!allEnabled ? 'opacity-50 cursor-not-allowed' : ''}`}
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
                    Fetch All Challans
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!delhiEnabled) return
                      // Snapshot Fetch All results so switching back restores them
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
                      setLoading(false)
                    }}
                    disabled={!delhiEnabled}
                    aria-pressed={flowType === FLOW_TYPES.DELHI_OTP}
                    className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-[13px] font-semibold transition ${
                      flowType === FLOW_TYPES.DELHI_OTP
                        ? 'bg-orange-50 text-orange-700 ring-1 ring-orange-100'
                        : 'text-slate-600 hover:bg-slate-50'
                    } ${!delhiEnabled ? 'opacity-50 cursor-not-allowed' : ''}`}
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
                    Delhi Challan (OTP Required)
                  </button>
                </div>

                {error && flowType === FLOW_TYPES.ALL_CHALLANS && (
                  <p className="rounded-lg border border-rose-100 bg-rose-50 px-3 py-2 text-[12px] text-rose-600">
                    {error}
                  </p>
                )}
              </div>
            </aside>

            {/* Main content */}
            <main className="min-w-0">
              {flowType === FLOW_TYPES.DELHI_OTP && !showResult && (
                <div className="surface-card p-4 md:p-6">
                  <DelhiOtpFlow
                    onChallansFound={handleDelhiChallansFound}
                    onBack={() => {
                      setFlowType(FLOW_TYPES.ALL_CHALLANS)
                      setError(null)
                      if (allChallansSnapshot.current) {
                        const snap = allChallansSnapshot.current
                        setData(snap.data)
                        setSelectedChallans(snap.selectedChallans || [])
                        setFilters(snap.filters || getDefaultFilters())
                        setFetchedAt(snap.fetchedAt || Date.now())
                        setVehicleNumber(snap.vehicleNumber || vehicleNumber)
                      }
                    }}
                  />
                </div>
              )}

              {flowType === FLOW_TYPES.ALL_CHALLANS && loading && (
                <ChallanResultsSkeleton />
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

              {flowType === FLOW_TYPES.ALL_CHALLANS && !loading && !showResult && (
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
