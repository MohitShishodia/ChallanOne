import { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'

export default function PayChallan() {
  const [searchParams] = useSearchParams()
  const [vehicleNumber, setVehicleNumber] = useState(searchParams.get('vehicle') || '')
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [selectedChallans, setSelectedChallans] = useState([])
  const [proofModal, setProofModal] = useState(null)

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
      const response = await fetch(`http://localhost:5000/api/challan/${encodeURIComponent(number)}`)
      const result = await response.json()
      
      if (result.success) {
        setData(result)
        // Auto-select pending challans
        const pendingIds = result.challans
          .filter(c => c.status !== 'PAID')
          .map(c => c.id)
        setSelectedChallans(pendingIds)
      } else {
        setError(result.message || 'No challans found')
        setData(null)
      }
    } catch (err) {
      setError('Failed to fetch challans. Please try again.')
      setData(null)
    }
    setLoading(false)
  }

  const handleSearch = (e) => {
    e.preventDefault()
    if (vehicleNumber.trim()) {
      fetchChallans(vehicleNumber.trim())
    }
  }

  const toggleChallan = (id) => {
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
      .filter(c => selectedChallans.includes(c.id))
      .reduce((sum, c) => sum + c.amount, 0)
  }

  const convenienceFee = selectedChallans.length > 0 ? 20 : 0
  const totalPayable = getSelectedTotal() + convenienceFee

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <Link to="/" className="hover:text-gray-700">Home</Link>
          <span>›</span>
          <span className="text-gray-700">Pay Challan</span>
          {data && (
            <>
              <span>›</span>
              <span className="text-blue-600 font-medium">Payment Details</span>
            </>
          )}
        </nav>

        {/* Search Form if no data */}
        {!data && !loading && (
          <div className="max-w-xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 mb-4 text-center">Pay Your Challan</h1>
            <p className="text-gray-600 mb-8 text-center">Enter your vehicle number to view and pay pending challans</p>
            
            <form onSubmit={handleSearch} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex gap-4">
                <input
                  type="text"
                  placeholder="Enter Vehicle Number (e.g., MH-12-AB-1234)"
                  value={vehicleNumber}
                  onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
                  className="flex-1 px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase"
                />
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                  Search
                </button>
              </div>
              {error && (
                <p className="mt-4 text-red-500 text-sm">{error}</p>
              )}
            </form>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        )}

        {/* Challan Data */}
        {data && !loading && (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              <div className="flex items-center justify-between mb-2">
                <h1 className="text-3xl font-bold text-gray-900">Review & Pay Challans</h1>
                <button
                  onClick={() => { setData(null); setSelectedChallans([]); }}
                  className="text-blue-600 text-sm font-medium hover:text-blue-700 flex items-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  New Search
                </button>
              </div>
              <p className="text-gray-600 mb-8">Securely review details and clear your pending traffic fines.</p>

              {/* Vehicle Card */}
              <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 flex items-center gap-4">
                <div className="w-20 h-14 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                  <img 
                    src={data.vehicle.image} 
                    alt="Vehicle" 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/80x56?text=Car'
                    }}
                  />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h2 className="text-xl font-bold text-gray-900">{data.vehicle.number}</h2>
                    <span className="bg-blue-100 text-blue-700 text-xs font-medium px-2 py-0.5 rounded">
                      {data.pendingCount} Pending
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm">Owner: {data.vehicle.owner} (Masked for Privacy)</p>
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                        <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H11a2.5 2.5 0 014.9 0H17a1 1 0 001-1V5a1 1 0 00-1-1H3z" />
                      </svg>
                      {data.vehicle.vehicleType}
                    </span>
                    {data.vehicle.isVerified && (
                      <span className="flex items-center gap-1 text-green-600">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Verified
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Pending Challans Header */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Pending Challans</h3>
                <button 
                  onClick={selectAll}
                  className="text-blue-600 text-sm font-medium hover:text-blue-700"
                >
                  Select All
                </button>
              </div>

              {/* Challan Cards */}
              <div className="space-y-4">
                {data.challans.map((challan) => (
                  <div
                    key={challan.id}
                    className={`bg-white rounded-xl border-2 p-5 transition-all cursor-pointer ${
                      selectedChallans.includes(challan.id)
                        ? 'border-blue-500 shadow-md'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => toggleChallan(challan.id)}
                  >
                    <div className="flex items-start gap-4">
                      {/* Checkbox */}
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-1 ${
                        selectedChallans.includes(challan.id)
                          ? 'bg-blue-600 border-blue-600'
                          : 'border-gray-300'
                      }`}>
                        {selectedChallans.includes(challan.id) && (
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>

                      {/* Challan Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <span className="text-sm font-medium text-gray-500">#{challan.id}</span>
                          <span className={challan.status === 'OVERDUE' ? 'badge-overdue' : 'badge-pending'}>
                            {challan.status}
                          </span>
                        </div>
                        <h4 className="text-lg font-semibold text-gray-900 mb-3">{challan.description}</h4>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500 text-xs uppercase tracking-wide">Date & Time</span>
                            <p className="text-gray-900 mt-1">{challan.date}, {challan.time}</p>
                          </div>
                          <div>
                            <span className="text-gray-500 text-xs uppercase tracking-wide">Location</span>
                            <p className="text-gray-900 mt-1">{challan.location}</p>
                          </div>
                        </div>
                      </div>

                      {/* Amount & Proof */}
                      <div className="text-right">
                        <p className="text-xl font-bold text-gray-900 mb-3">₹{challan.amount.toLocaleString()}</p>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setProofModal(challan)
                          }}
                          className="text-blue-600 text-sm font-medium flex items-center gap-1 hover:text-blue-700"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          View Proof
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment Summary Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl border border-gray-200 p-6 sticky top-24">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Payment Summary</h3>
                <p className="text-sm text-blue-600 mb-6">{selectedChallans.length} challans selected</p>

                <div className="space-y-4 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="text-gray-900">₹{getSelectedTotal().toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Convenience Fee</span>
                    <span className="text-gray-900">₹{convenienceFee.toFixed(2)}</span>
                  </div>
                  <div className="border-t pt-4 flex justify-between">
                    <span className="font-semibold text-gray-900">Total Payable</span>
                    <span className="text-2xl font-bold text-blue-600">₹{totalPayable.toLocaleString()}</span>
                  </div>
                </div>

                <button
                  disabled={selectedChallans.length === 0}
                  className="w-full bg-blue-600 text-white py-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                  Pay Securely
                </button>

                <p className="text-xs text-gray-500 text-center mt-4 flex items-center justify-center gap-1">
                  <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  256-bit SSL Encrypted Payment
                </p>

                {/* Issue Report */}
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-blue-600 font-bold text-sm">?</span>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 text-sm">Issue with these challans?</h4>
                      <p className="text-xs text-gray-500 mt-1">
                        If you believe a challan is incorrect or the vehicle was not yours at the time, please report it.
                      </p>
                      <Link to="/support" className="text-blue-600 text-sm font-medium mt-2 inline-block hover:text-blue-700">
                        Report an Issue
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Proof Modal */}
        {proofModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setProofModal(null)}>
            <div className="bg-white rounded-2xl max-w-lg w-full p-6" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Challan Proof</h3>
                <button onClick={() => setProofModal(null)} className="text-gray-400 hover:text-gray-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <img 
                src={proofModal.proofImage} 
                alt="Violation proof" 
                className="w-full rounded-lg mb-4"
              />
              <div className="text-sm text-gray-600">
                <p><strong>Challan ID:</strong> {proofModal.id}</p>
                <p><strong>Violation:</strong> {proofModal.description}</p>
                <p><strong>Date:</strong> {proofModal.date} at {proofModal.time}</p>
                <p><strong>Location:</strong> {proofModal.location}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
