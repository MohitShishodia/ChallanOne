import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { API_BASE_URL } from '../config/api'
import { PoliceIllustration } from '../components/Illustrations'

export default function PayChallan() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [vehicleNumber, setVehicleNumber] = useState(searchParams.get('vehicle') || '')
  const [loading, setLoading] = useState(false)
  const [paymentLoading, setPaymentLoading] = useState(false)
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [selectedChallans, setSelectedChallans] = useState([])

  // Lazily load Razorpay script only when payment is actually initiated
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
      fetchChallans(vehicle)
    }
  }, [searchParams])

  const fetchChallans = async (number) => {
    setLoading(true)
    setError(null)
    try {
      // Single API call — server auto-resolves chassis/engine from DB or rc_info
      const response = await fetch(`${API_BASE_URL}/api/external/challan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vehicleNumber: number })
      })
      const result = await response.json()
      const challanData = result.challan?.response?.challans

      if (result.success && challanData && challanData.length > 0) {
        const transformedChallans = challanData.map((c, idx) => ({
          id: c.challan_no || `CH${idx + 1}`,
          dbId: c.challan_no,
          vehicleNumber: result.vehicleNumber,
          type: c.offence,
          description: c.offence_list?.map(o => o.offence_name).join(', ') || c.offence,
          amount: parseFloat(c.amount) || 0,
          status: mapChallanStatus(c.challan_status),
          date: formatChallanDate(c.date),
          time: formatChallanTime(c.date),
          location: `${c.area || ''}${c.area && c.state ? ', ' : ''}${c.state || ''}` || 'N/A',
        }))

        const firstChallan = challanData[0]
        const transformedVehicle = {
          number: result.vehicleNumber,
          owner: firstChallan?.accused_name || firstChallan?.owner_name || 'Owner',
          vehicleType: 'Private Vehicle',
          isVerified: true,
        }

        setData({
          success: true,
          dataSource: result.source || 'EXTERNAL',
          vehicle: transformedVehicle,
          challans: transformedChallans,
          pendingCount: transformedChallans.filter(c => c.status !== 'PAID').length
        })
        const pendingIds = transformedChallans.filter(c => c.status !== 'PAID').map(c => c.id)
        setSelectedChallans(pendingIds)
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

  const mapChallanStatus = (status) => {
    if (!status) return 'PENDING'
    const s = status.toLowerCase()
    if (s === 'pending') return 'PENDING'
    if (s === 'cash' || s === 'paid') return 'PAID'
    if (s === 'disposed') return 'PAID'
    if (s === 'overdue') return 'OVERDUE'
    return 'PENDING'
  }

  const formatChallanDate = (dateStr) => {
    if (!dateStr) return 'N/A'
    try {
      return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    } catch {
      return dateStr.split(' ')[0] || dateStr
    }
  }

  const formatChallanTime = (dateStr) => {
    if (!dateStr) return '00:00'
    try {
      const parts = dateStr.split(' ')
      if (parts[1]) return parts[1].substring(0, 5)
      return '00:00'
    } catch {
      return '00:00'
    }
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
      const subtotal = challansToPay.reduce((s, c) => s + c.amount, 0)
      const total = subtotal + 20

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
                convenienceFee: 20,
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

  const showResult = data && !loading
  const showSearch = !data && !loading

  return (
    <div className="screen">
      <div className="screen-content">
        {/* Page title bar */}
        <div className="bg-gradient-to-r from-blue-50 to-sky-50 border-b border-slate-100">
          <div className="container-main py-6 md:py-10">
            <div className="flex items-center gap-3 mb-2">
              {showResult && (
                <button onClick={() => { setData(null); setError(null) }} className="icon-btn">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              )}
              <h1 className="h-section">{showResult ? 'Challan Results' : 'Check Challan'}</h1>
            </div>
            <p className="text-[14px] md:text-[15px] text-slate-500">
              {showResult ? `Showing results for ${data?.vehicle?.number}` : 'Enter your vehicle number to check pending challans'}
            </p>
          </div>
        </div>

        {showSearch && (
          <div className="container-main py-8 md:py-12">
            <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-start">
              {/* Left - Search form */}
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
                </form>
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
            <div className="space-y-5">
              <div className="surface-card p-5 flex items-start gap-3 animate-fade-up bg-emerald-50/40 border-emerald-200">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <p className="text-[16px] font-bold text-slate-900">{data.pendingCount} Challans Found</p>
                  <p className="text-[14px] text-slate-600">
                    Total Amount Due: <span className="font-semibold text-slate-900">₹ {data.challans.filter(c => c.status !== 'PAID').reduce((s, c) => s + c.amount, 0).toLocaleString()}</span>
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {data.challans.map((challan) => {
                  const isPaid = challan.status === 'PAID'
                  return (
                    <div key={challan.id} className="surface-card p-5 space-y-4 animate-fade-up">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-[11px] font-medium text-slate-500">Challan ID</p>
                          <p className="text-[16px] font-bold text-slate-900">{challan.id}</p>
                        </div>
                        <span className={`pill ${isPaid ? 'pill-success' : 'pill-pending'}`}>
                          {isPaid ? 'Paid' : 'Pending'}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <div>
                          <p className="text-[11px] font-medium text-slate-500">Date</p>
                          <p className="text-[14px] font-semibold text-slate-900">{challan.date}</p>
                        </div>
                        <div>
                          <p className="text-[11px] font-medium text-slate-500">Amount</p>
                          <p className="text-[14px] font-semibold text-slate-900">₹ {challan.amount.toLocaleString()}</p>
                        </div>
                        <div className="col-span-2 md:col-span-1">
                          <p className="text-[11px] font-medium text-slate-500">Location</p>
                          <p className="text-[14px] font-semibold text-slate-900">{challan.location}</p>
                        </div>
                      </div>
                      {!isPaid && (
                        <button
                          onClick={() => handlePayment(challan.id)}
                          disabled={paymentLoading}
                          className="btn-primary w-full md:w-auto"
                        >
                          {paymentLoading ? 'Processing...' : 'Pay Now'}
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button className="btn-secondary flex-1">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download Receipt
                </button>
                <button onClick={() => { setData(null); setError(null) }} className="btn-ghost">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  New Search
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function RecentSearchRow({ number, date, pillClass, pillLabel, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-between rounded-xl px-3 py-3 text-left transition hover:bg-slate-50"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 2m6-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <p className="text-[14px] font-semibold text-slate-900">{number}</p>
          <p className="text-[12px] text-slate-500 mt-0.5">{date}</p>
        </div>
      </div>
      <span className={`pill ${pillClass}`}>{pillLabel}</span>
    </button>
  )
}
