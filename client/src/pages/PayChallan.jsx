import { useState, useEffect } from 'react'
import { useSearchParams, Link, useNavigate } from 'react-router-dom'
import { API_BASE_URL } from '../config/api'

export default function PayChallan() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [vehicleNumber, setVehicleNumber] = useState(searchParams.get('vehicle') || '')
  const [loading, setLoading] = useState(false)
  const [paymentLoading, setPaymentLoading] = useState(false)
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [selectedChallans, setSelectedChallans] = useState([])
  const [proofModal, setProofModal] = useState(null)

  // Load Razorpay script
  useEffect(() => {
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    document.body.appendChild(script)
    return () => {
      document.body.removeChild(script)
    }
  }, [])

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
      const response = await fetch(`${API_BASE_URL}/api/external/challan/${encodeURIComponent(number)}`)
      const result = await response.json()

      if (result.success && result.challan?.response) {
        const challanResponse = result.challan.response

        // Transform external API response to match UI expected format
        const transformedChallans = (challanResponse.challans || []).map((c, idx) => ({
          id: c.challan_no || `CH${idx + 1}`,
          dbId: c.challan_no,
          vehicleNumber: result.vehicleNumber,
          type: c.offence,
          description: c.offence_list?.map(o => o.offence_name).join(', ') || c.offence,
          amount: parseFloat(c.amount) || 0,
          status: mapChallanStatus(c.challan_status),
          date: formatChallanDate(c.date),
          time: formatChallanTime(c.date),
          location: `${c.area}, ${c.state}`,
          proofImage: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=400&h=300&fit=crop'
        }))

        // Create vehicle object from available data
        const transformedVehicle = {
          number: result.vehicleNumber,
          owner: 'Owner',
          vehicleType: 'Private Vehicle',
          isVerified: true,
          image: 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=100&h=60&fit=crop'
        }

        const transformedData = {
          success: true,
          dataSource: 'APICLUB_EXTERNAL',
          vehicle: transformedVehicle,
          challans: transformedChallans,
          pendingCount: transformedChallans.filter(c => c.status !== 'PAID').length
        }

        setData(transformedData)
        const pendingIds = transformedChallans
          .filter(c => c.status !== 'PAID')
          .map(c => c.id)
        setSelectedChallans(pendingIds)
      } else {
        setError(result.message || 'No challans found')
        setData(null)
      }
    } catch {
      setError('Failed to fetch challans. Please try again.')
      setData(null)
    }
    setLoading(false)
  }

  // Helper to map external status to UI status
  const mapChallanStatus = (status) => {
    if (!status) return 'PENDING'
    const s = status.toLowerCase()
    if (s === 'pending') return 'PENDING'
    if (s === 'cash' || s === 'paid') return 'PAID'
    if (s === 'disposed') return 'PAID'
    if (s === 'overdue') return 'OVERDUE'
    return 'PENDING'
  }

  // Helper to format challan date
  const formatChallanDate = (dateStr) => {
    if (!dateStr) return 'N/A'
    try {
      const date = new Date(dateStr)
      return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    } catch {
      return dateStr.split(' ')[0] || dateStr
    }
  }

  // Helper to format challan time
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
    if (vehicleNumber.trim()) {
      fetchChallans(vehicleNumber.trim())
    }
  }

  const toggleChallan = (id) => {
    // Find the challan and check if it's paid - don't allow toggle for paid challans
    const challan = data?.challans?.find(c => c.id === id)
    if (challan?.status === 'PAID') return

    setSelectedChallans(prev =>
      prev.includes(id)
        ? prev.filter(x => x !== id)
        : [...prev, id]
    )
  }

  const selectAll = () => {
    if (data?.challans) {
      const pendingIds = data.challans.filter(c => c.status !== 'PAID').map(c => c.id)
      setSelectedChallans(pendingIds)
    }
  }

  const getSelectedTotal = () => {
    if (!data?.challans) return 0
    return data.challans
      .filter(c => selectedChallans.includes(c.id) && c.status !== 'PAID')
      .reduce((sum, c) => sum + c.amount, 0)
  }

  const convenienceFee = selectedChallans.length > 0 ? 20 : 0
  const totalPayable = getSelectedTotal() + convenienceFee

  const getSelectedChallanDetails = () => {
    if (!data?.challans) return []
    return data.challans.filter(c => selectedChallans.includes(c.id) && c.status !== 'PAID')
  }

  const handlePayment = async () => {
    if (selectedChallans.length === 0) return

    setPaymentLoading(true)

    try {
      const userStr = localStorage.getItem('user')
      const user = userStr ? JSON.parse(userStr) : {}

      const orderResponse = await fetch(`${API_BASE_URL}/api/payment/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: totalPayable,
          vehicleNumber: data.vehicle.number,
          challans: getSelectedChallanDetails(),
          userEmail: user.email || ''
        })
      })

      const orderData = await orderResponse.json()

      if (!orderData.success) {
        throw new Error(orderData.message || 'Failed to create order')
      }

      const options = {
        key: orderData.key,
        amount: orderData.order.amount,
        currency: orderData.order.currency,
        name: 'E-Challan Payment',
        description: `Payment for ${selectedChallans.length} challan(s) - ${data.vehicle.number}`,
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
                challans: getSelectedChallanDetails(),
                subtotal: getSelectedTotal(),
                convenienceFee: convenienceFee,
                totalAmount: totalPayable,
                userEmail: user.email || ''
              })
            })

            const verifyData = await verifyResponse.json()

            if (verifyData.success) {
              navigate('/payment-success', {
                state: {
                  receipt: verifyData.receipt,
                  vehicleNumber: data.vehicle.number
                }
              })
            } else {
              alert('Payment verification failed. Please contact support.')
            }
          } catch (err) {
            console.error('Verification error:', err)
            alert('Payment verification failed. Please contact support.')
          }
        },
        prefill: {
          name: user.name || '',
          email: user.email || '',
          contact: user.phone || ''
        },
        theme: {
          color: '#2563eb'
        },
        modal: {
          ondismiss: function () {
            setPaymentLoading(false)
          }
        }
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Hero Section - when no data */}
      {!data && !loading && (
        <section className="relative bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 overflow-hidden">
          {/* Animated Background */}
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=1920&q=80')] bg-cover bg-center opacity-15" />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-900/95 via-blue-900/90 to-slate-900/95" />
            {/* Floating Elements */}
            <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-20 right-10 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          </div>

          <div className="relative max-w-6xl mx-auto px-4 py-20 md:py-28">
            {/* Trust Badges */}
            <div className="flex flex-wrap justify-center gap-3 mb-10">
              {[
                { icon: '✓', text: 'Government Authorized', color: 'green' },
                { icon: '🔒', text: 'Secure Payments', color: 'blue' },
                { icon: '⚡', text: 'Instant Receipt', color: 'yellow' },
                { icon: '📱', text: '24/7 Support', color: 'purple' }
              ].map((badge, idx) => (
                <span key={idx} className="flex items-center gap-2 bg-white/10 backdrop-blur-md text-white/90 text-xs font-medium px-4 py-2 rounded-full border border-white/20 hover:bg-white/20 transition-all cursor-default">
                  <span>{badge.icon}</span>
                  {badge.text}
                </span>
              ))}
            </div>

            {/* Title */}
            <div className="text-center mb-10">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 leading-tight">
                Pay Your Traffic<br />
                <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent">Challans Instantly</span>
              </h1>
              <p className="text-lg text-gray-300 max-w-2xl mx-auto">
                Enter your vehicle number to check and pay pending fines securely.
                Get instant digital receipts recognized by all RTOs.
              </p>
            </div>

            {/* Premium Search Form */}
            <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
              <div className="glass-card p-3 rounded-2xl">
                <div className="flex flex-col md:flex-row gap-3">
                  <div className="flex-1 relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </span>
                    <input
                      type="text"
                      placeholder="Enter Vehicle Number (e.g., MH-12-AB-1234)"
                      value={vehicleNumber}
                      onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
                      className="w-full pl-14 pr-4 py-4 border border-gray-200 rounded-xl bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase text-lg font-medium tracking-wider"
                    />
                  </div>
                  <button
                    type="submit"
                    className="btn-premium px-10 py-4 rounded-xl font-semibold flex items-center justify-center gap-3 text-lg"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    Check Now
                  </button>
                </div>
                {error && (
                  <p className="mt-3 text-orange-400 text-sm text-center flex items-center justify-center gap-2">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {error}
                  </p>
                )}
              </div>
            </form>

            {/* How It Works - Premium Cards */}
            <div className="mt-16 grid md:grid-cols-3 gap-6">
              {[
                { step: 1, title: 'Enter Vehicle No.', desc: 'Input your registration number to fetch all pending challans', icon: '🚗' },
                { step: 2, title: 'Review Challans', desc: 'View violation details, proof images & select fines to pay', icon: '📋' },
                { step: 3, title: 'Pay Securely', desc: 'Use UPI, Cards or Net Banking for instant settlement', icon: '💳' }
              ].map((item) => (
                <div key={item.step} className="relative group">
                  <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all hover:-translate-y-1">
                    <div className="flex items-center gap-4 mb-3">
                      <span className="text-3xl">{item.icon}</span>
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl flex items-center justify-center font-bold shadow-lg shadow-blue-500/30">
                        {item.step}
                      </div>
                    </div>
                    <h3 className="text-white font-semibold text-lg mb-2">{item.title}</h3>
                    <p className="text-gray-400 text-sm leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Stats Section */}
            <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { value: '25K+', label: 'Payments Today' },
                { value: '₹5Cr+', label: 'Processed Daily' },
                { value: '99.9%', label: 'Success Rate' },
                { value: '4.9★', label: 'User Rating' }
              ].map((stat, idx) => (
                <div key={idx} className="text-center">
                  <p className="text-2xl md:text-3xl font-bold text-white">{stat.value}</p>
                  <p className="text-sm text-gray-400 mt-1">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-32">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-blue-200 rounded-full animate-spin border-t-blue-600" />
              <div className="absolute inset-0 w-16 h-16 border-4 border-transparent rounded-full animate-ping border-t-blue-400 opacity-30" />
            </div>
            <p className="mt-6 text-gray-600 font-medium">Fetching challan details...</p>
            <p className="text-sm text-gray-400 mt-1">This may take a few seconds</p>
          </div>
        )}

        {/* Challan Data */}
        {data && !loading && (
          <>
            {/* Success Banner */}
            <div className="mb-8 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-4 flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-green-800">Vehicle Found Successfully!</h3>
                <p className="text-sm text-green-600">We found {data.challans.length} challan(s) associated with {data.vehicle.number}</p>
              </div>
              <button
                onClick={() => { setData(null); setSelectedChallans([]); }}
                className="text-green-700 hover:text-green-800 text-sm font-medium flex items-center gap-1 px-4 py-2 bg-green-100 rounded-lg hover:bg-green-200 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                New Search
              </button>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
              {/* Main Content */}
              <div className="lg:col-span-2">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Review & Pay Challans</h1>
                <p className="text-gray-600 mb-8">Select the challans you want to pay and proceed to secure payment.</p>

                {/* Vehicle Card - Premium */}
                <div className="glass-card p-6 mb-8 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-blue-500/10 to-transparent rounded-full -translate-y-1/2 translate-x-1/2" />

                  <div className="flex items-center gap-5 relative">
                    <div className="w-24 h-16 bg-gradient-to-br from-gray-100 to-gray-50 rounded-xl overflow-hidden flex-shrink-0 border border-gray-200">
                      <img
                        src={data.vehicle.image}
                        alt="Vehicle"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.src = 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=100&h=70&fit=crop'
                        }}
                      />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h2 className="text-2xl font-bold text-gray-900 tracking-wider">{data.vehicle.number}</h2>
                        <span className="bg-gradient-to-r from-orange-500 to-orange-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm">
                          {data.pendingCount} PENDING
                        </span>
                        {data.vehicle.isVerified && (
                          <span className="bg-green-100 text-green-700 text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            Verified
                          </span>
                        )}
                      </div>
                      <p className="text-gray-600">Owner: {data.vehicle.owner} <span className="text-gray-400">(Masked for Privacy)</span></p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                        <span className="flex items-center gap-1.5 bg-gray-100 px-3 py-1 rounded-full">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                            <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H11a2.5 2.5 0 014.9 0H17a1 1 0 001-1V5a1 1 0 00-1-1H3z" />
                          </svg>
                          {data.vehicle.vehicleType}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Pending Challans Header */}
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Pending Challans</h3>
                    <p className="text-sm text-gray-500 mt-1">Click on a challan to select/deselect it</p>
                  </div>
                  <button
                    onClick={selectAll}
                    className="text-blue-600 text-sm font-semibold hover:text-blue-700 flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Select All
                  </button>
                </div>

                {/* Challan Cards - Premium */}
                <div className="space-y-4">
                  {data.challans.map((challan, idx) => {
                    const isPaid = challan.status === 'PAID'
                    return (
                      <div
                        key={challan.id}
                        className={`glass-card p-6 transition-all group ${isPaid
                          ? 'opacity-60 cursor-not-allowed bg-gray-50'
                          : selectedChallans.includes(challan.id)
                            ? 'ring-2 ring-blue-500 shadow-lg shadow-blue-500/10 cursor-pointer'
                            : 'hover:shadow-md cursor-pointer'
                          }`}
                        onClick={() => !isPaid && toggleChallan(challan.id)}
                        style={{ animationDelay: `${idx * 0.1}s` }}
                      >
                        <div className="flex items-start gap-4">
                          {/* Checkbox - hidden for paid challans */}
                          {!isPaid ? (
                            <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0 mt-1 transition-all ${selectedChallans.includes(challan.id)
                              ? 'bg-gradient-to-br from-blue-500 to-blue-600 border-blue-500 shadow-md shadow-blue-500/30'
                              : 'border-gray-300 group-hover:border-blue-300'
                              }`}>
                              {selectedChallans.includes(challan.id) && (
                                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              )}
                            </div>
                          ) : (
                            <div className="w-6 h-6 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0 mt-1">
                              <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                          )}

                          {/* Challan Info */}
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <span className="text-sm font-mono text-gray-400 bg-gray-100 px-2 py-0.5 rounded">#{challan.id}</span>
                              <span className={`px-3 py-1 rounded-full text-xs font-bold ${challan.status === 'OVERDUE'
                                ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white'
                                : 'bg-yellow-100 text-yellow-700'
                                }`}>
                                {challan.status}
                              </span>
                            </div>
                            <h4 className="text-lg font-bold text-gray-900 mb-3">{challan.description}</h4>

                            <div className="grid grid-cols-2 gap-4">
                              <div className="bg-gray-50 rounded-lg p-3">
                                <span className="text-gray-400 text-xs uppercase tracking-wider font-medium">Date & Time</span>
                                <p className="text-gray-900 font-medium mt-1">{challan.date}</p>
                                <p className="text-gray-500 text-sm">{challan.time}</p>
                              </div>
                              <div className="bg-gray-50 rounded-lg p-3">
                                <span className="text-gray-400 text-xs uppercase tracking-wider font-medium">Location</span>
                                <p className="text-gray-900 font-medium mt-1">{challan.location}</p>
                              </div>
                            </div>
                          </div>

                          {/* Amount & Proof */}
                          <div className="text-right">
                            <div className="bg-gradient-to-br from-gray-900 to-gray-800 text-white px-4 py-3 rounded-xl mb-3">
                              <p className="text-xs text-gray-400 mb-1">Fine Amount</p>
                              <p className="text-2xl font-bold">₹{challan.amount.toLocaleString()}</p>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setProofModal(challan)
                              }}
                              className="text-blue-600 text-sm font-medium flex items-center gap-1.5 hover:text-blue-700 bg-blue-50 px-3 py-2 rounded-lg hover:bg-blue-100 transition-colors"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              View Proof
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Payment Summary Sidebar - Premium */}
              <div className="lg:col-span-1">
                <div className="glass-card p-6 sticky top-24">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-gray-900">Payment Summary</h3>
                    <span className="bg-blue-100 text-blue-700 text-sm font-bold px-3 py-1 rounded-full">
                      {selectedChallans.length} Selected
                    </span>
                  </div>

                  {/* Price Breakdown */}
                  <div className="space-y-4 mb-6">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Challan Amount</span>
                      <span className="text-gray-900 font-semibold">₹{getSelectedTotal().toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 flex items-center gap-1">
                        Convenience Fee
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </span>
                      <span className="text-gray-900">₹{convenienceFee.toFixed(2)}</span>
                    </div>
                    <div className="border-t border-dashed pt-4">
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-bold text-gray-900">Total Payable</span>
                        <span className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                          ₹{totalPayable.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Pay Button */}
                  <button
                    onClick={handlePayment}
                    disabled={selectedChallans.length === 0 || paymentLoading}
                    className="w-full btn-premium py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    {paymentLoading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                        </svg>
                        Pay ₹{totalPayable.toLocaleString()} Securely
                      </>
                    )}
                  </button>

                  {/* Security Badge */}
                  <div className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-500">
                    <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    256-bit SSL Encrypted via Razorpay
                  </div>

                  {/* Payment Methods */}
                  <div className="mt-6 pt-6 border-t border-gray-100">
                    <p className="text-xs text-gray-400 text-center mb-3">Accepted Payment Methods</p>
                    <div className="flex items-center justify-center gap-3">
                      {['💳 Cards', '📱 UPI', '🏦 NetBanking'].map((method, idx) => (
                        <span key={idx} className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded">
                          {method}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Issue Report */}
                  <div className="mt-6 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 text-sm">Found an issue?</h4>
                        <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                          Wrong challan or dispute? Our team can help.
                        </p>
                        <Link to="/support" className="text-blue-600 text-sm font-semibold mt-2 inline-flex items-center gap-1 hover:text-blue-700">
                          Get Support
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Proof Modal - Premium */}
        {proofModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setProofModal(null)}>
            <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
              {/* Header */}
              <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-6 flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-bold">Violation Evidence</h3>
                  <p className="text-sm text-gray-300 mt-1">Challan #{proofModal.id}</p>
                </div>
                <button onClick={() => setProofModal(null)} className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Image */}
              <div className="p-4 bg-gray-100">
                <img
                  src={proofModal.proofImage}
                  alt="Violation proof"
                  className="w-full rounded-xl shadow-md"
                />
              </div>

              {/* Details */}
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-xs text-gray-400 uppercase tracking-wider">Violation</p>
                    <p className="text-gray-900 font-semibold mt-1">{proofModal.description}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-xs text-gray-400 uppercase tracking-wider">Fine Amount</p>
                    <p className="text-gray-900 font-bold text-xl mt-1">₹{proofModal.amount.toLocaleString()}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-xs text-gray-400 uppercase tracking-wider">Date & Time</p>
                    <p className="text-gray-900 font-medium mt-1">{proofModal.date}</p>
                    <p className="text-gray-500 text-sm">{proofModal.time}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-xs text-gray-400 uppercase tracking-wider">Location</p>
                    <p className="text-gray-900 font-medium mt-1">{proofModal.location}</p>
                  </div>
                </div>

                <button
                  onClick={() => setProofModal(null)}
                  className="w-full btn-premium py-3 rounded-xl font-semibold"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
