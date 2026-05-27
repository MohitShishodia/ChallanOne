import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { API_BASE_URL } from '../config/api'
import { PoliceIllustration } from '../components/Illustrations'
import DelhiOtpFlow from '../components/DelhiOtpFlow'
import ChallanResults from '../components/ChallanResults'
import { useFeatures } from '../context/FeatureContext'
import {
  FLOW_TYPES,
  transformExternalChallans,
  calculatePaymentTotal
} from '../utils/challanUtils'

export default function PayChallan() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { isFeatureEnabled } = useFeatures()
  const [flowType, setFlowType] = useState(FLOW_TYPES.SELECT)
  const [vehicleNumber, setVehicleNumber] = useState(searchParams.get('vehicle') || '')
  const [loading, setLoading] = useState(false)
  const [paymentLoading, setPaymentLoading] = useState(false)
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [selectedChallans, setSelectedChallans] = useState([])

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

  useEffect(() => {
    const vehicle = searchParams.get('vehicle')
    if (vehicle) {
      setVehicleNumber(vehicle)
      setFlowType(FLOW_TYPES.ALL_CHALLANS)
      fetchChallans(vehicle)
    }
  }, [searchParams])

  const fetchChallans = async (number) => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`${API_BASE_URL}/api/external/challan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vehicleNumber: number })
      })
      const result = await response.json()
      if (result.success) {
        const transformed = transformExternalChallans(result)

        if (!transformed.hasRawChallans) {
          setError(result.message || 'No challans found')
          setData(null)
          setLoading(false)
          return
        }

        if (transformed.challans.length === 0) {
          setError('No challans found for this vehicle (virtual court challans are hidden)')
          setData(null)
          setLoading(false)
          return
        }

        setData(transformed)
        setSelectedChallans(
          transformed.challans.filter((c) => c.status !== 'PAID').map((c) => c.id)
        )
      } else {
        setError(result.message || 'No challans found')
        setData(null)
      }
    } catch (err) {
      setError(err?.message || 'Failed to fetch challans. Please try again.')
      setData(null)
    }
    setLoading(false)
  }

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
    setSelectedChallans(pending.map((c) => c.id))
  }

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

  const handleSearch = (e) => {
    e.preventDefault()
    if (vehicleNumber.trim()) fetchChallans(vehicleNumber.trim())
  }

  const handlePayment = async (singleId) => {
    const idsToPay = singleId ? [singleId] : selectedChallans
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
        theme: { color: '#2563eb' },
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
    setFlowType(FLOW_TYPES.SELECT)
    setData(null)
    setError(null)
    setSelectedChallans([])
  }

  const showResult = data && !loading
  const showAllChallansSearch = flowType === FLOW_TYPES.ALL_CHALLANS && !data && !loading

  return (
    <div className="screen">
      <div className="screen-content">
        {/* Page title bar */}
        <div className="bg-gradient-to-r from-blue-50 to-sky-50 border-b border-slate-100">
          <div className="container-main py-6 md:py-10">
            <div className="flex items-center gap-3 mb-2">
              {(showResult || flowType !== FLOW_TYPES.SELECT) && (
                <button onClick={goBackToSelector} className="icon-btn">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              )}
              <h1 className="h-section">
                {showResult ? 'Challan Results' : flowType === FLOW_TYPES.DELHI_OTP ? 'Delhi State Challan' : flowType === FLOW_TYPES.ALL_CHALLANS ? 'Fetch All Challans' : 'Check Challan'}
              </h1>
            </div>
            <p className="text-[14px] md:text-[15px] text-slate-500">
              {showResult
                ? `Showing results for ${data?.vehicle?.number}`
                : flowType === FLOW_TYPES.DELHI_OTP
                  ? 'Verify via OTP to fetch Delhi state challans'
                  : flowType === FLOW_TYPES.ALL_CHALLANS
                    ? 'Enter vehicle number to fetch challans from all states'
                    : 'Choose how you want to check your challans'}
            </p>
          </div>
        </div>

        {/* Flow Selector */}
        {flowType === FLOW_TYPES.SELECT && (
          <div className="container-main py-8 md:py-12">
            <div className="grid md:grid-cols-2 gap-6 md:gap-8 items-start">
              <div className="space-y-4 animate-fade-up">
                <h2 className="text-[17px] font-bold text-slate-900 mb-4">Select Challan Check Type</h2>

                {/* Delhi State Challan Option */}
                <button
                  onClick={() => isFeatureEnabled('delhi_otp_challan') && setFlowType(FLOW_TYPES.DELHI_OTP)}
                  disabled={!isFeatureEnabled('delhi_otp_challan')}
                  className={`w-full surface-card p-5 text-left transition-all group ${isFeatureEnabled('delhi_otp_challan') ? 'hover:border-orange-300 hover:bg-orange-50/30' : 'opacity-50 cursor-not-allowed'}`}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-orange-600 group-hover:bg-orange-200 transition">
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-[16px] font-bold text-slate-900">Delhi State Challan</h3>
                      <p className="text-[13px] text-slate-500 mt-1">OTP-based verification for Delhi traffic challans. Requires mobile number registered with Delhi Traffic Police.</p>
                      {!isFeatureEnabled('delhi_otp_challan') ? (
                        <span className="inline-flex items-center gap-1 mt-2 text-[12px] font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                          Service Temporarily Unavailable
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 mt-2 text-[12px] font-medium text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">
                          <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
                          OTP Required
                        </span>
                      )}
                    </div>
                  </div>
                </button>

                {/* Fetch All Challans Option */}
                <button
                  onClick={() => isFeatureEnabled('fetch_all_challans') && setFlowType(FLOW_TYPES.ALL_CHALLANS)}
                  disabled={!isFeatureEnabled('fetch_all_challans')}
                  className={`w-full surface-card p-5 text-left transition-all group ${isFeatureEnabled('fetch_all_challans') ? 'hover:border-blue-300 hover:bg-blue-50/30' : 'opacity-50 cursor-not-allowed'}`}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600 group-hover:bg-blue-200 transition">
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-[16px] font-bold text-slate-900">Fetch All Challans</h3>
                      <p className="text-[13px] text-slate-500 mt-1">Quick vehicle number lookup across all states. No OTP needed — instant results.</p>
                      {!isFeatureEnabled('fetch_all_challans') ? (
                        <span className="inline-flex items-center gap-1 mt-2 text-[12px] font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                          Service Temporarily Unavailable
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 mt-2 text-[12px] font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                          <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                          All States
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              </div>

              {/* Illustration */}
              <div className="order-first md:order-last animate-fade-up">
                <div className="hero-illu">
                  <PoliceIllustration className="w-full" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delhi OTP Flow */}
        {flowType === FLOW_TYPES.DELHI_OTP && !showResult && (
          <div className="container-narrow py-8">
            <DelhiOtpFlow
              onChallansFound={handleDelhiChallansFound}
              onBack={goBackToSelector}
            />
          </div>
        )}

        {/* All Challans Search Form */}
        {showAllChallansSearch && (
          <div className="container-main py-8 md:py-12">
            <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-start">
              <div className="space-y-6">
                <form onSubmit={handleSearch} className="surface-card p-6 space-y-4 animate-fade-up">
                  <h2 className="text-[17px] font-bold text-slate-900">Vehicle Details</h2>
                  <div>
                    <label className="field-label">Vehicle Number</label>
                    <input
                      type="text"
                      placeholder="Enter vehicle number (e.g. UP32AB1234)"
                      value={vehicleNumber}
                      onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
                      className="input-field"
                    />
                  </div>
                  <button type="submit" className="btn-primary w-full">Check Challan</button>
                  {error && <p className="text-sm text-rose-500">{error}</p>}
                  <button type="button" onClick={goBackToSelector} className="btn-ghost w-full">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Back to Options
                  </button>
                </form>
              </div>

              <div className="order-first md:order-last animate-fade-up">
                <div className="hero-illu">
                  <PoliceIllustration className="w-full" />
                </div>
              </div>
            </div>
          </div>
        )}

        {loading && (
          <div className="container-narrow">
            <div className="flex flex-col items-center justify-center py-24">
              <div className="relative">
                <div className="h-14 w-14 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />
              </div>
              <p className="mt-5 text-[14px] font-medium text-slate-700">Fetching challan details...</p>
              <p className="mt-1 text-[12px] text-slate-400">This may take a few seconds</p>
            </div>
          </div>
        )}

        {showResult && (
          <div className="container-narrow py-8">
            <ChallanResults
              data={data}
              dataSource={data.dataSource}
              selectedChallans={selectedChallans}
              onToggleChallan={toggleChallanSelection}
              onSelectAllPending={selectAllPending}
              onDeselectAll={deselectAllChallans}
              onPay={handlePayment}
              onBack={goBackToSelector}
              paymentLoading={paymentLoading}
            />
          </div>
        )}
      </div>
    </div>
  )
}
