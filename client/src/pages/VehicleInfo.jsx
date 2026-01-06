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
    ownership: true,
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

  const getInsuranceStatusText = (status, date) => {
    switch (status) {
      case 'active': return `Valid till ${date}`
      case 'expired': return `Expired on ${date}`
      case 'expiring_soon': return `Expiring on ${date}`
      default: return 'Status Unknown'
    }
  }

  const AccordionSection = ({ title, sectionKey, icon, children }) => (
    <div className="border-b border-gray-100 last:border-0">
      <button
        onClick={() => toggleSection(sectionKey)}
        className="w-full flex items-center justify-between py-4 px-5 text-left hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
            {icon}
          </div>
          <span className="font-semibold text-gray-900">{title}</span>
        </div>
        <svg 
          className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${expandedSections[sectionKey] ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <div className={`overflow-hidden transition-all duration-200 ${expandedSections[sectionKey] ? 'max-h-[500px]' : 'max-h-0'}`}>
        <div className="px-5 pb-5 pt-2 bg-gray-50/50">
          {children}
        </div>
      </div>
    </div>
  )

  const InfoRow = ({ label, value, highlight }) => (
    <div className="flex justify-between py-3 border-b border-gray-100 last:border-0">
      <span className="text-gray-500 text-sm">{label}</span>
      <span className={`text-sm font-medium text-right ${highlight ? 'text-blue-600' : 'text-gray-900'}`}>
        {value || 'N/A'}
      </span>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=1920&q=80')] bg-cover bg-center opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900/95 to-slate-900/80" />
        
        <div className="relative max-w-6xl mx-auto px-4 py-12 md:py-16">
          {/* Trust Badges */}
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            <span className="flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white/90 text-xs font-medium px-4 py-2 rounded-full border border-white/20">
              <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              100% Authentic
            </span>
            <span className="flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white/90 text-xs font-medium px-4 py-2 rounded-full border border-white/20">
              <svg className="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              RTO Verified
            </span>
            <span className="flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white/90 text-xs font-medium px-4 py-2 rounded-full border border-white/20">
              <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
              </svg>
              Instant Access
            </span>
          </div>

          {/* Title */}
          <h1 className="text-3xl md:text-4xl font-bold text-white text-center mb-3">
            Get Complete <span className="text-blue-400">Vehicle Report</span>
          </h1>
          <p className="text-gray-300 text-center mb-8 max-w-xl mx-auto">
            Enter your vehicle number to get detailed information including ownership, insurance status, and more.
          </p>
          
          {/* Search Form */}
          <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
            <div className="flex gap-3 bg-white p-2 rounded-full shadow-xl">
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
                  className="w-full pl-12 pr-4 py-3 border-0 rounded-full bg-transparent text-gray-900 placeholder-gray-500 focus:outline-none uppercase text-sm font-medium"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 text-white px-8 py-3 rounded-full font-semibold hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-blue-600/30"
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
                <span className="hidden sm:inline">Get Report</span>
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-100 rounded-2xl p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Vehicle Not Found</h3>
            <p className="text-gray-500">{error}</p>
          </div>
        )}

        {/* Vehicle Info */}
        {vehicle && (
          <div className="space-y-6">
            {/* Vehicle Summary Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h2 className="text-xl font-bold text-gray-900">{vehicle.owner}</h2>
                      <span className="flex items-center gap-1 bg-blue-50 text-blue-600 text-xs font-medium px-2 py-1 rounded-full">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Verified
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 mb-3">
                      <span className="inline-flex items-center px-4 py-1.5 rounded-lg text-sm font-bold bg-gray-900 text-white tracking-wider">
                        {vehicle.number}
                      </span>
                      <span className="text-sm text-gray-500">{vehicle.ownershipType}</span>
                    </div>
                    <p className="text-gray-700 font-medium">{vehicle.model}</p>
                    <p className="text-sm text-gray-500">{vehicle.manufacturer}</p>
                  </div>
                  <div className="w-28 h-20 rounded-xl overflow-hidden bg-gray-100">
                    <img 
                      src={vehicle.image} 
                      alt={vehicle.model}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>

                {/* Insurance Status Banner */}
                <div className={`flex items-center justify-between p-4 rounded-xl ${
                  vehicle.insuranceStatus === 'expired' 
                    ? 'bg-gradient-to-r from-red-50 to-red-100 border border-red-200' 
                    : vehicle.insuranceStatus === 'expiring_soon' 
                    ? 'bg-gradient-to-r from-orange-50 to-orange-100 border border-orange-200' 
                    : 'bg-gradient-to-r from-green-50 to-green-100 border border-green-200'
                }`}>
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      vehicle.insuranceStatus === 'expired' 
                        ? 'bg-red-500' 
                        : vehicle.insuranceStatus === 'expiring_soon' 
                        ? 'bg-orange-500' 
                        : 'bg-green-500'
                    }`}>
                      {vehicle.insuranceStatus === 'expired' ? (
                        <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <div>
                      <p className={`font-semibold ${
                        vehicle.insuranceStatus === 'expired' 
                          ? 'text-red-700' 
                          : vehicle.insuranceStatus === 'expiring_soon' 
                          ? 'text-orange-700' 
                          : 'text-green-700'
                      }`}>
                        {vehicle.insuranceStatus === 'expired' ? 'Insurance Expired' : vehicle.insuranceStatus === 'expiring_soon' ? 'Insurance Expiring Soon' : 'Insurance Active'}
                      </p>
                      <p className={`text-sm ${
                        vehicle.insuranceStatus === 'expired' 
                          ? 'text-red-600' 
                          : vehicle.insuranceStatus === 'expiring_soon' 
                          ? 'text-orange-600' 
                          : 'text-green-600'
                      }`}>
                        {getInsuranceStatusText(vehicle.insuranceStatus, vehicle.insuranceExpiry)}
                      </p>
                    </div>
                  </div>
                  <button className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                    vehicle.insuranceStatus === 'expired' 
                      ? 'bg-red-600 text-white hover:bg-red-700' 
                      : vehicle.insuranceStatus === 'expiring_soon' 
                      ? 'bg-orange-600 text-white hover:bg-orange-700' 
                      : 'bg-green-600 text-white hover:bg-green-700'
                  }`}>
                    {vehicle.insuranceStatus === 'active' ? 'View Details' : 'Renew Now'}
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl p-4 border border-gray-100 text-center">
                <p className="text-2xl font-bold text-gray-900">{vehicle.fuelType}</p>
                <p className="text-xs text-gray-500 mt-1">Fuel Type</p>
              </div>
              <div className="bg-white rounded-xl p-4 border border-gray-100 text-center">
                <p className="text-2xl font-bold text-gray-900">{vehicle.seatingCapacity}</p>
                <p className="text-xs text-gray-500 mt-1">Seats</p>
              </div>
              <div className="bg-white rounded-xl p-4 border border-gray-100 text-center">
                <p className="text-2xl font-bold text-blue-600">{vehicle.vehicleClass}</p>
                <p className="text-xs text-gray-500 mt-1">Class</p>
              </div>
              <div className="bg-white rounded-xl p-4 border border-gray-100 text-center">
                <p className="text-2xl font-bold text-gray-900">{vehicle.registrationDate?.split('-')[0]}</p>
                <p className="text-xs text-gray-500 mt-1">Reg. Year</p>
              </div>
            </div>

            {/* Accordion Sections */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <AccordionSection 
                title="Ownership Details" 
                sectionKey="ownership"
                icon={<svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>}
              >
                <InfoRow label="Owner Name" value={vehicle.owner} />
                <InfoRow label="Ownership Type" value={vehicle.ownershipType} />
                <InfoRow label="Registration Authority" value={vehicle.registrationAuthority} />
                <InfoRow label="RC Status" value={vehicle.rcStatus} highlight />
                <InfoRow label="Hypothecation" value={vehicle.hypothecation || 'None'} />
                {vehicle.hypothecationValidUpto && (
                  <InfoRow label="Hypothecation Valid Upto" value={vehicle.hypothecationValidUpto} />
                )}
              </AccordionSection>

              <AccordionSection 
                title="Vehicle Details" 
                sectionKey="vehicleDetails"
                icon={<svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>}
              >
                <InfoRow label="Model" value={vehicle.model} />
                <InfoRow label="Manufacturer" value={vehicle.manufacturer} />
                <InfoRow label="Vehicle Class" value={vehicle.vehicleClass} />
                <InfoRow label="Body Type" value={vehicle.bodyType} />
                <InfoRow label="Fuel Type" value={vehicle.fuelType} />
                <InfoRow label="Color" value={vehicle.color} />
                <InfoRow label="Seating Capacity" value={vehicle.seatingCapacity} />
                <InfoRow label="Engine Number" value={vehicle.engineNumber} />
                <InfoRow label="Chassis Number" value={vehicle.chassisNumber} />
              </AccordionSection>

              <AccordionSection 
                title="Important Dates" 
                sectionKey="importantDates"
                icon={<svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
              >
                <InfoRow label="Registration Date" value={vehicle.registrationDate} />
                <InfoRow label="Fitness Valid Upto" value={vehicle.fitnessValidUpto} />
                <InfoRow label="PUC Valid Upto" value={vehicle.pucValidUpto} />
                <InfoRow label="Tax Valid Upto" value={vehicle.taxValidUpto} />
                <InfoRow label="Insurance Valid Upto" value={vehicle.insuranceExpiry} highlight />
              </AccordionSection>

              <AccordionSection 
                title="Other Information" 
                sectionKey="otherInfo"
                icon={<svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
              >
                <InfoRow label="Blacklist Status" value={vehicle.blacklistStatus ? 'Yes' : 'No'} />
                <InfoRow label="NOC Details" value={vehicle.nocDetails || 'Not Available'} />
              </AccordionSection>
            </div>
          </div>
        )}

        {/* Initial State - How It Works */}
        {!vehicle && !error && !loading && (
          <div className="space-y-8">
            {/* How It Works */}
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">How to Get Vehicle Report</h2>
              <p className="text-gray-500">Simple steps to access complete vehicle information</p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-white rounded-2xl p-6 border border-gray-100 text-center relative">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">1</div>
                <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4 mt-2">
                  <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Enter Vehicle Number</h3>
                <p className="text-sm text-gray-500">Enter the registration number of the vehicle</p>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-gray-100 text-center relative">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">2</div>
                <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4 mt-2">
                  <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Fetch Details</h3>
                <p className="text-sm text-gray-500">We fetch data from official RTO records</p>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-gray-100 text-center relative">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">3</div>
                <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4 mt-2">
                  <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">View Report</h3>
                <p className="text-sm text-gray-500">Get complete ownership & insurance details</p>
              </div>
            </div>

            {/* Features */}
            <div className="bg-white rounded-2xl p-8 border border-gray-100">
              <h3 className="font-semibold text-gray-900 mb-6 text-center">What Information You'll Get</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {['Owner Details', 'Insurance Status', 'RC Validity', 'Loan Status', 'Fitness Info', 'Tax Details', 'Blacklist Check', 'PUC Status'].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-gray-600">
                    <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

