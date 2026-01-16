import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { API_BASE_URL } from '../config/api'

export default function VehicleInfo() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [vehicleNumber, setVehicleNumber] = useState(searchParams.get('vehicle') || '')
  const [vehicle, setVehicle] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [expandedSections, setExpandedSections] = useState({
    ownership: true,
    vehicleDetails: true,
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
      const response = await fetch(`${API_BASE_URL}/api/external/vehicle/${encodeURIComponent(number.trim())}`)
      const data = await response.json()

      if (data.success && data.vehicle?.response) {
        // Transform external API response to match UI expected format
        const v = data.vehicle.response
        const transformedVehicle = {
          id: v.request_id,
          number: v.license_plate,
          type: v.class?.includes('Scooter') || v.class?.includes('2W') ? 'Bike' : 'Car',
          owner: maskOwnerName(v.owner_name),
          ownerFull: v.owner_name,
          vehicleType: v.class,
          isVerified: true,
          image: v.class?.includes('Scooter') || v.class?.includes('2W')
            ? 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=100&h=60&fit=crop'
            : 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=100&h=60&fit=crop',
          ownershipType: `Owner ${v.owner_count || 1}`,
          model: v.brand_model,
          manufacturer: v.brand_name,
          color: v.color,
          fuelType: v.fuel_type,
          engineNumber: v.engine_number,
          chassisNumber: v.chassis_number,
          registrationDate: formatDateString(v.registration_date),
          registrationAuthority: 'RTO',
          fitnessValidUpto: v.fitness_upto || 'N/A',
          pucValidUpto: formatDateString(v.pucc_upto),
          taxValidUpto: v.tax_upto !== '1900-01-01' ? formatDateString(v.tax_upto) : v.tax_paid_upto,
          insuranceExpiry: formatDateString(v.insurance_expiry),
          insuranceStatus: getInsuranceStatus(v.insurance_expiry),
          insuranceCompany: v.insurance_company,
          unpaidChallanCount: 0,
          seatingCapacity: parseInt(v.seating_capacity) || 2,
          vehicleClass: v.class,
          bodyType: v.class,
          cubicCapacity: v.cubic_capacity,
          grossWeight: v.gross_weight,
          hypothecation: v.financer || null,
          hypothecationValidUpto: null,
          nocDetails: v.noc_details || null,
          blacklistStatus: false,
          rcStatus: v.rc_status || 'ACTIVE'
        }
        setVehicle(transformedVehicle)
      } else {
        setError(data.message || 'Vehicle not found')
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Helper to mask owner name
  const maskOwnerName = (name) => {
    if (!name) return 'Unknown'
    const parts = name.split(' ')
    return parts.map(p => p[0] + '***').join(' ')
  }

  // Helper to format date strings
  const formatDateString = (dateStr) => {
    if (!dateStr || dateStr === '1900-01-01') return 'N/A'
    try {
      const date = new Date(dateStr)
      return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    } catch {
      return dateStr
    }
  }

  // Helper to determine insurance status
  const getInsuranceStatus = (expiryDate) => {
    if (!expiryDate || expiryDate === '1900-01-01') return 'unknown'
    const expiry = new Date(expiryDate)
    const today = new Date()
    const thirtyDaysFromNow = new Date()
    thirtyDaysFromNow.setDate(today.getDate() + 30)

    if (expiry < today) return 'expired'
    if (expiry <= thirtyDaysFromNow) return 'expiring_soon'
    return 'active'
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

  const AccordionSection = ({ title, sectionKey, icon, iconBg, children }) => (
    <div className="border-b border-gray-100 last:border-0">
      <button
        onClick={() => toggleSection(sectionKey)}
        className="w-full flex items-center justify-between py-5 px-6 text-left hover:bg-gray-50/50 transition-colors"
      >
        <div className="flex items-center gap-4">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconBg || 'bg-blue-50'}`}>
            {icon}
          </div>
          <span className="font-bold text-gray-900">{title}</span>
        </div>
        <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${expandedSections[sectionKey] ? 'bg-blue-100 rotate-180' : 'bg-gray-100'}`}>
          <svg
            className={`w-4 h-4 ${expandedSections[sectionKey] ? 'text-blue-600' : 'text-gray-400'}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>
      <div className={`overflow-hidden transition-all duration-300 ${expandedSections[sectionKey] ? 'max-h-[600px]' : 'max-h-0'}`}>
        <div className="px-6 pb-6 pt-2">
          {children}
        </div>
      </div>
    </div>
  )

  const InfoRow = ({ label, value, highlight, icon }) => (
    <div className="flex justify-between items-center py-3 border-b border-gray-100 last:border-0 group">
      <span className="text-gray-500 text-sm flex items-center gap-2">
        {icon && <span className="text-gray-400">{icon}</span>}
        {label}
      </span>
      <span className={`text-sm font-semibold text-right ${highlight ? 'text-blue-600 bg-blue-50 px-3 py-1 rounded-full' : 'text-gray-900'}`}>
        {value || 'N/A'}
      </span>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=1920&q=80')] bg-cover bg-center opacity-15" />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900/95 via-blue-900/90 to-slate-900/95" />
          {/* Floating Elements */}
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-10 right-20 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>

        <div className="relative max-w-6xl mx-auto px-4 py-16 md:py-24">
          {/* Trust Badges */}
          <div className="flex flex-wrap justify-center gap-3 mb-10">
            {[
              { icon: '✓', text: '100% Authentic Data', color: 'green' },
              { icon: '🔒', text: 'RTO Verified', color: 'blue' },
              { icon: '⚡', text: 'Instant Access', color: 'yellow' },
              { icon: '📊', text: 'Complete Report', color: 'purple' }
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
              Get Complete<br />
              <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent">Vehicle Report</span>
            </h1>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto">
              Access detailed vehicle information including ownership, insurance status,
              RC validity, and more from official RTO records.
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
                  disabled={loading}
                  className="btn-premium px-10 py-4 rounded-xl font-semibold flex items-center justify-center gap-3 text-lg disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Fetching...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      Get Report
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>

          {/* Quick Stats */}
          <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto">
            {[
              { value: '10M+', label: 'Vehicles Checked' },
              { value: '100%', label: 'Data Accuracy' },
              { value: '50+', label: 'Cities Covered' },
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

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Error State */}
        {error && (
          <div className="glass-card p-10 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-orange-100 to-orange-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">Vehicle Not Found</h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">{error}. Please check the vehicle number and try again.</p>
            <button
              onClick={() => { setError(''); setVehicleNumber(''); }}
              className="btn-premium px-8 py-3 rounded-xl"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-blue-200 rounded-full animate-spin border-t-blue-600" />
              <div className="absolute inset-0 w-16 h-16 border-4 border-transparent rounded-full animate-ping border-t-blue-400 opacity-30" />
            </div>
            <p className="mt-6 text-gray-600 font-medium">Fetching vehicle details...</p>
            <p className="text-sm text-gray-400 mt-1">Accessing official RTO records</p>
          </div>
        )}

        {/* Vehicle Info */}
        {vehicle && (
          <div className="space-y-6">
            {/* Success Banner */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-4 flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-green-800">Vehicle Report Generated Successfully!</h3>
                <p className="text-sm text-green-600">Data fetched from official RTO records</p>
              </div>
              <button
                onClick={() => { setVehicle(null); setVehicleNumber(''); }}
                className="text-green-700 hover:text-green-800 text-sm font-medium flex items-center gap-1 px-4 py-2 bg-green-100 rounded-lg hover:bg-green-200 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                New Search
              </button>
            </div>

            {/* Vehicle Summary Card - Premium */}
            <div className="glass-card overflow-hidden">
              {/* Header with Gradient */}
              <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h2 className="text-2xl font-bold">{vehicle.owner}</h2>
                      <span className="flex items-center gap-1 bg-green-500/20 text-green-300 text-xs font-medium px-3 py-1 rounded-full border border-green-500/30">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Verified
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 mb-4">
                      <span className="inline-flex items-center px-5 py-2 rounded-xl text-lg font-bold bg-white text-gray-900 tracking-wider shadow-lg">
                        {vehicle.number}
                      </span>
                      <span className="text-sm text-gray-300 bg-white/10 px-3 py-1 rounded-full">{vehicle.ownershipType}</span>
                    </div>
                    <p className="text-white font-medium text-lg">{vehicle.model}</p>
                    <p className="text-gray-400">{vehicle.manufacturer}</p>
                  </div>
                  <div className="w-32 h-24 rounded-xl overflow-hidden bg-white/10 border border-white/20 flex-shrink-0">
                    <img
                      src={vehicle.image}
                      alt={vehicle.model}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=150&h=100&fit=crop'
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Insurance Status Banner */}
              <div className={`flex items-center justify-between p-5 ${vehicle.insuranceStatus === 'expired'
                ? 'bg-gradient-to-r from-red-50 to-orange-50 border-t border-red-100'
                : vehicle.insuranceStatus === 'expiring_soon'
                  ? 'bg-gradient-to-r from-orange-50 to-yellow-50 border-t border-orange-100'
                  : 'bg-gradient-to-r from-green-50 to-emerald-50 border-t border-green-100'
                }`}>
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg ${vehicle.insuranceStatus === 'expired'
                    ? 'bg-gradient-to-br from-red-500 to-red-600'
                    : vehicle.insuranceStatus === 'expiring_soon'
                      ? 'bg-gradient-to-br from-orange-500 to-orange-600'
                      : 'bg-gradient-to-br from-green-500 to-green-600'
                    }`}>
                    {vehicle.insuranceStatus === 'expired' ? (
                      <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <p className={`font-bold text-lg ${vehicle.insuranceStatus === 'expired'
                      ? 'text-red-700'
                      : vehicle.insuranceStatus === 'expiring_soon'
                        ? 'text-orange-700'
                        : 'text-green-700'
                      }`}>
                      {vehicle.insuranceStatus === 'expired' ? '⚠️ Insurance Expired' : vehicle.insuranceStatus === 'expiring_soon' ? '⏰ Insurance Expiring Soon' : '✅ Insurance Active'}
                    </p>
                    <p className={`text-sm ${vehicle.insuranceStatus === 'expired'
                      ? 'text-red-600'
                      : vehicle.insuranceStatus === 'expiring_soon'
                        ? 'text-orange-600'
                        : 'text-green-600'
                      }`}>
                      {getInsuranceStatusText(vehicle.insuranceStatus, vehicle.insuranceExpiry)}
                    </p>
                  </div>
                </div>
                <button className={`px-6 py-3 rounded-xl text-sm font-bold shadow-md transition-all hover:-translate-y-0.5 ${vehicle.insuranceStatus === 'expired'
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : vehicle.insuranceStatus === 'expiring_soon'
                    ? 'bg-orange-600 text-white hover:bg-orange-700'
                    : 'bg-green-600 text-white hover:bg-green-700'
                  }`}>
                  {vehicle.insuranceStatus === 'active' ? 'View Details' : 'Renew Insurance'}
                </button>
              </div>
            </div>

            {/* Quick Stats - Premium */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Fuel Type', value: vehicle.fuelType, icon: '⛽', bg: 'from-blue-500 to-blue-600' },
                { label: 'Seating', value: `${vehicle.seatingCapacity} Seats`, icon: '💺', bg: 'from-indigo-500 to-indigo-600' },
                { label: 'Class', value: vehicle.vehicleClass, icon: '🚗', bg: 'from-purple-500 to-purple-600' },
                { label: 'Reg. Year', value: vehicle.registrationDate?.split('-')[0], icon: '📅', bg: 'from-pink-500 to-pink-600' }
              ].map((stat, idx) => (
                <div key={idx} className="glass-card p-5 text-center hover-lift group">
                  <div className={`w-12 h-12 bg-gradient-to-br ${stat.bg} rounded-xl flex items-center justify-center mx-auto mb-3 text-xl group-hover:scale-110 transition-transform shadow-lg`}>
                    {stat.icon}
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-xs text-gray-500 mt-1 uppercase tracking-wider">{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Accordion Sections - Premium */}
            <div className="glass-card overflow-hidden">
              <AccordionSection
                title="Ownership Details"
                sectionKey="ownership"
                iconBg="bg-gradient-to-br from-blue-100 to-blue-50"
                icon={<svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>}
              >
                <div className="bg-gray-50 rounded-xl p-4">
                  <InfoRow label="Owner Name" value={vehicle.owner} />
                  <InfoRow label="Ownership Type" value={vehicle.ownershipType} />
                  <InfoRow label="Registration Authority" value={vehicle.registrationAuthority} />
                  <InfoRow label="RC Status" value={vehicle.rcStatus} highlight />
                  <InfoRow label="Hypothecation" value={vehicle.hypothecation || 'None'} />
                  {vehicle.hypothecationValidUpto && (
                    <InfoRow label="Hypothecation Valid Upto" value={vehicle.hypothecationValidUpto} />
                  )}
                </div>
              </AccordionSection>

              <AccordionSection
                title="Vehicle Specifications"
                sectionKey="vehicleDetails"
                iconBg="bg-gradient-to-br from-indigo-100 to-indigo-50"
                icon={<svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>}
              >
                <div className="bg-gray-50 rounded-xl p-4">
                  <InfoRow label="Model" value={vehicle.model} />
                  <InfoRow label="Manufacturer" value={vehicle.manufacturer} />
                  <InfoRow label="Vehicle Class" value={vehicle.vehicleClass} />
                  <InfoRow label="Body Type" value={vehicle.bodyType} />
                  <InfoRow label="Fuel Type" value={vehicle.fuelType} />
                  <InfoRow label="Color" value={vehicle.color} />
                  <InfoRow label="Seating Capacity" value={vehicle.seatingCapacity} />
                  <InfoRow label="Engine Number" value={vehicle.engineNumber} />
                  <InfoRow label="Chassis Number" value={vehicle.chassisNumber} />
                </div>
              </AccordionSection>

              <AccordionSection
                title="Important Dates"
                sectionKey="importantDates"
                iconBg="bg-gradient-to-br from-purple-100 to-purple-50"
                icon={<svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
              >
                <div className="bg-gray-50 rounded-xl p-4">
                  <InfoRow label="Registration Date" value={vehicle.registrationDate} />
                  <InfoRow label="Fitness Valid Upto" value={vehicle.fitnessValidUpto} />
                  <InfoRow label="PUC Valid Upto" value={vehicle.pucValidUpto} />
                  <InfoRow label="Tax Valid Upto" value={vehicle.taxValidUpto} />
                  <InfoRow label="Insurance Valid Upto" value={vehicle.insuranceExpiry} highlight />
                </div>
              </AccordionSection>

              <AccordionSection
                title="Other Information"
                sectionKey="otherInfo"
                iconBg="bg-gradient-to-br from-pink-100 to-pink-50"
                icon={<svg className="w-5 h-5 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
              >
                <div className="bg-gray-50 rounded-xl p-4">
                  <InfoRow label="Blacklist Status" value={vehicle.blacklistStatus ? '⚠️ Yes' : '✅ No'} />
                  <InfoRow label="NOC Details" value={vehicle.nocDetails || 'Not Available'} />
                </div>
              </AccordionSection>
            </div>

            {/* CTA Section */}
            <div className="glass-card p-6 bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center text-2xl shadow-lg">
                    💳
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">Have Pending Challans?</h3>
                    <p className="text-gray-600 text-sm">Pay your traffic fines instantly with secure payment</p>
                  </div>
                </div>
                <Link
                  to={`/pay-challan?vehicle=${vehicle.number}`}
                  className="btn-premium px-8 py-3 rounded-xl font-semibold flex items-center gap-2"
                >
                  Check & Pay Challans
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Initial State - How It Works */}
        {!vehicle && !error && !loading && (
          <div className="space-y-10">
            {/* How It Works */}
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-3">How to Get Vehicle Report</h2>
              <p className="text-gray-500">Simple steps to access complete vehicle information</p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {[
                { step: 1, title: 'Enter Vehicle No.', desc: 'Input the registration number of any vehicle', icon: '✏️' },
                { step: 2, title: 'Fetch from RTO', desc: 'We access official government RTO records', icon: '🔍' },
                { step: 3, title: 'View Full Report', desc: 'Get complete ownership & insurance details', icon: '📋' }
              ].map((item) => (
                <div key={item.step} className="glass-card p-6 text-center relative hover-lift">
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl flex items-center justify-center font-bold shadow-lg">
                    {item.step}
                  </div>
                  <div className="text-4xl mb-4 mt-4">{item.icon}</div>
                  <h3 className="font-bold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-sm text-gray-500">{item.desc}</p>
                </div>
              ))}
            </div>

            {/* Features Grid */}
            <div className="glass-card p-8">
              <h3 className="font-bold text-gray-900 mb-8 text-center text-xl">What Information You'll Get</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {[
                  { icon: '👤', label: 'Owner Details' },
                  { icon: '🛡️', label: 'Insurance Status' },
                  { icon: '📄', label: 'RC Validity' },
                  { icon: '🏦', label: 'Loan Status' },
                  { icon: '✅', label: 'Fitness Info' },
                  { icon: '💰', label: 'Tax Details' },
                  { icon: '🚫', label: 'Blacklist Check' },
                  { icon: '🌿', label: 'PUC Status' }
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                    <span className="text-2xl">{item.icon}</span>
                    <span className="text-sm font-medium text-gray-700">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Trust Section */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-white text-center">
              <h3 className="text-2xl font-bold mb-3">Trusted by 10 Million+ Users</h3>
              <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
                Our vehicle information service is trusted by car buyers, sellers, and owners
                across India for accurate and reliable RTO data.
              </p>
              <div className="flex justify-center gap-8">
                {['🔒 Secure', '⚡ Instant', '✅ Accurate'].map((item, idx) => (
                  <span key={idx} className="text-white/90 font-medium">{item}</span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
