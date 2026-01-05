import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'

export default function VehicleInfo() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [vehicleNumber, setVehicleNumber] = useState(searchParams.get('vehicle') || '')
  const [vehicle, setVehicle] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [expandedSections, setExpandedSections] = useState({
    ownership: false,
    vehicleDetails: false,
    importantDates: false,
    otherInfo: false
  })

  useEffect(() => {
    const vehicleParam = searchParams.get('vehicle')
    if (vehicleParam) {
      setVehicleNumber(vehicleParam)
      fetchVehicleInfo(vehicleParam)
    }
  }, [searchParams])

  const fetchVehicleInfo = async (number) => {
    if (!number.trim()) return
    
    setLoading(true)
    setError('')
    setVehicle(null)

    try {
      const response = await fetch(`http://localhost:5000/api/vehicle/${encodeURIComponent(number.trim())}`)
      const data = await response.json()

      if (data.success) {
        setVehicle(data.vehicle)
      } else {
        setError(data.message || 'Vehicle not found')
      }
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    if (vehicleNumber.trim()) {
      navigate(`/vehicle-info?vehicle=${encodeURIComponent(vehicleNumber.trim())}`)
      fetchVehicleInfo(vehicleNumber)
    }
  }

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const getInsuranceStatusColor = (status) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-50'
      case 'expired': return 'text-red-600 bg-red-50'
      case 'expiring_soon': return 'text-orange-600 bg-orange-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const getInsuranceStatusText = (status, date) => {
    switch (status) {
      case 'active': return `Valid till ${date}`
      case 'expired': return `Expired on ${date}`
      case 'expiring_soon': return `Expiring on ${date}`
      default: return 'Status Unknown'
    }
  }

  const AccordionSection = ({ title, sectionKey, children }) => (
    <div className="border-b border-gray-200">
      <button
        onClick={() => toggleSection(sectionKey)}
        className="w-full flex items-center justify-between py-4 px-4 text-left hover:bg-gray-50 transition-colors"
      >
        <span className="font-medium text-gray-900">{title}</span>
        <svg 
          className={`w-5 h-5 text-gray-500 transition-transform ${expandedSections[sectionKey] ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {expandedSections[sectionKey] && (
        <div className="px-4 pb-4 bg-gray-50">
          {children}
        </div>
      )}
    </div>
  )

  const InfoRow = ({ label, value }) => (
    <div className="flex justify-between py-2 border-b border-gray-100 last:border-0">
      <span className="text-gray-600 text-sm">{label}</span>
      <span className="text-gray-900 text-sm font-medium text-right">{value || 'N/A'}</span>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Search Header */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-6 text-center">
            Vehicle Information
          </h1>
          
          <form onSubmit={handleSearch} className="flex gap-3">
            <div className="flex-1 relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </span>
              <input
                type="text"
                placeholder="Enter Vehicle Number (e.g., MH-12-AB-1234)"
                value={vehicleNumber}
                onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
                className="w-full pl-12 pr-4 py-3 border-0 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              )}
              Search
            </button>
          </form>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <svg className="w-12 h-12 text-red-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="text-red-600 font-medium">{error}</p>
            <p className="text-gray-500 text-sm mt-2">Please check the vehicle number and try again.</p>
          </div>
        )}

        {/* Vehicle Info */}
        {vehicle && (
          <div className="space-y-4">
            {/* Vehicle Summary Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-4 md:p-6">
                {/* Owner and Vehicle Info */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <h2 className="text-lg font-bold text-gray-900">{vehicle.owner}</h2>
                      <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v4a1 1 0 102 0V7z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800 border border-gray-300">
                        • {vehicle.number} •
                      </span>
                      <span className="text-sm text-gray-600">{vehicle.ownershipType}</span>
                    </div>
                    <p className="text-gray-700 font-medium">{vehicle.model}</p>
                  </div>
                  <img 
                    src={vehicle.image} 
                    alt={vehicle.model}
                    className="w-24 h-16 object-cover rounded-lg"
                  />
                </div>

                {/* Insurance Status */}
                <div className={`flex items-center justify-between p-3 rounded-lg ${vehicle.insuranceStatus === 'expired' ? 'bg-red-50' : vehicle.insuranceStatus === 'expiring_soon' ? 'bg-orange-50' : 'bg-green-50'}`}>
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${vehicle.insuranceStatus === 'expired' ? 'bg-red-100' : vehicle.insuranceStatus === 'expiring_soon' ? 'bg-orange-100' : 'bg-green-100'}`}>
                      {vehicle.insuranceStatus === 'expired' ? (
                        <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <div>
                      <p className={`font-medium ${vehicle.insuranceStatus === 'expired' ? 'text-red-700' : vehicle.insuranceStatus === 'expiring_soon' ? 'text-orange-700' : 'text-green-700'}`}>
                        {vehicle.insuranceStatus === 'expired' ? 'Insurance Expired' : vehicle.insuranceStatus === 'expiring_soon' ? 'Insurance Expiring Soon' : 'Insurance Active'}
                      </p>
                      <p className={`text-sm ${vehicle.insuranceStatus === 'expired' ? 'text-red-600' : vehicle.insuranceStatus === 'expiring_soon' ? 'text-orange-600' : 'text-green-600'}`}>
                        {getInsuranceStatusText(vehicle.insuranceStatus, vehicle.insuranceExpiry)}
                      </p>
                    </div>
                  </div>
                  <button className={`px-4 py-2 rounded-lg text-sm font-medium border ${vehicle.insuranceStatus === 'expired' ? 'border-red-300 text-red-600 hover:bg-red-100' : vehicle.insuranceStatus === 'expiring_soon' ? 'border-orange-300 text-orange-600 hover:bg-orange-100' : 'border-green-300 text-green-600 hover:bg-green-100'} transition-colors`}>
                    View Plans
                  </button>
                </div>

                {/* Quick Actions */}
                <div className="flex gap-4 mt-4 pt-4 border-t border-gray-100">
                  <button className="flex items-center gap-2 text-gray-600 hover:text-gray-900 text-sm font-medium">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Refresh Data
                  </button>
                  <span className="w-px bg-gray-200" />
                  <button className="flex items-center gap-2 text-gray-600 hover:text-gray-900 text-sm font-medium">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    My Virtual RC
                  </button>
                </div>
              </div>

              {/* Insurance Promo Banner */}
              {vehicle.insuranceStatus === 'expired' && (
                <div className="bg-gradient-to-r from-red-600 to-red-500 p-4 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">Renew Your Car Insurance</p>
                      <p className="text-sm opacity-90">Just ₹6/Day »</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Insurance Details Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-medium text-gray-900">Insurance Details</p>
                  <p className="text-xs text-gray-500">Updated {vehicle.insuranceUpdated}</p>
                </div>
                <button className="flex items-center gap-1 text-blue-600 text-sm font-medium border border-blue-200 px-3 py-1 rounded-lg hover:bg-blue-50 transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Refresh
                </button>
              </div>
              <div className="border-t border-gray-100 pt-3">
                <p className="font-medium text-gray-900">{vehicle.insuranceCompany}</p>
                <p className="text-sm text-gray-500">Insurance Company</p>
              </div>
              <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between items-center">
                <div>
                  <p className={`font-medium ${vehicle.insuranceStatus === 'expired' ? 'text-red-600' : 'text-gray-900'}`}>
                    {getInsuranceStatusText(vehicle.insuranceStatus, vehicle.insuranceExpiry)}
                  </p>
                  <p className="text-sm text-gray-500">Insurance Valid Upto</p>
                </div>
                <button className="text-red-600 font-medium text-sm border border-red-200 px-4 py-2 rounded-lg hover:bg-red-50 transition-colors">
                  Insure Now
                </button>
              </div>
            </div>


            {/* Accordion Sections */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <AccordionSection title="Ownership Details" sectionKey="ownership">
                <InfoRow label="Owner Name" value={vehicle.owner} />
                <InfoRow label="Ownership Type" value={vehicle.ownershipType} />
                <InfoRow label="Registration Authority" value={vehicle.registrationAuthority} />
                <InfoRow label="RC Status" value={vehicle.rcStatus} />
                <InfoRow label="Hypothecation" value={vehicle.hypothecation || 'None'} />
                {vehicle.hypothecationValidUpto && (
                  <InfoRow label="Hypothecation Valid Upto" value={vehicle.hypothecationValidUpto} />
                )}
              </AccordionSection>

              <AccordionSection title="Vehicle Details" sectionKey="vehicleDetails">
                <InfoRow label="Model" value={vehicle.model} />
                <InfoRow label="Manufacturer" value={vehicle.manufacturer} />
                <InfoRow label="Vehicle Class" value={vehicle.vehicleClass} />
                <InfoRow label="Body Type" value={vehicle.bodyType} />
                <InfoRow label="Fuel Type" value={vehicle.fuelType} />
                <InfoRow label="Color" value={vehicle.color} />
                <InfoRow label="Seating Capacity" value={vehicle.seatingCapacity} />
                <InfoRow label="Engine Number" value={vehicle.engineNumber} />
                <InfoRow label="Chassis Number" value={vehicle.chassisNumber} />
                <InfoRow label="Wheelbase (mm)" value={vehicle.wheelbase} />
                <InfoRow label="Unladen Weight (kg)" value={vehicle.unladenWeight} />
              </AccordionSection>

              <AccordionSection title="Important Dates" sectionKey="importantDates">
                <InfoRow label="Registration Date" value={vehicle.registrationDate} />
                <InfoRow label="Fitness Valid Upto" value={vehicle.fitnessValidUpto} />
                <InfoRow label="PUC Valid Upto" value={vehicle.pucValidUpto} />
                <InfoRow label="Tax Valid Upto" value={vehicle.taxValidUpto} />
                <InfoRow label="Insurance Valid Upto" value={vehicle.insuranceExpiry} />
              </AccordionSection>

              <AccordionSection title="Other Information" sectionKey="otherInfo">
                <InfoRow label="Blacklist Status" value={vehicle.blacklistStatus ? 'Yes' : 'No'} />
                <InfoRow label="NOC Details" value={vehicle.nocDetails || 'Not Available'} />
              </AccordionSection>
            </div>
          </div>
        )}

        {/* Initial State */}
        {!vehicle && !error && !loading && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Search for Vehicle Information</h3>
            <p className="text-gray-500">Enter a vehicle number above to view detailed information about the vehicle including ownership, insurance status, and more.</p>
          </div>
        )}
      </div>
    </div>
  )
}
