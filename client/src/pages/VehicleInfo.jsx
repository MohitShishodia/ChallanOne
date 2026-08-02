import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { API_BASE_URL } from '../config/api'
import { RcDocIllustration } from '../components/Illustrations'
import PageTitleBar from '../components/PageTitleBar'
import { useFeatures } from '../context/FeatureContext'

export default function VehicleInfo() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { isFeatureEnabled } = useFeatures()
  const [vehicleNumber, setVehicleNumber] = useState(searchParams.get('vehicle') || '')
  const [vehicle, setVehicle] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const v = searchParams.get('vehicle')
    if (v) {
      setVehicleNumber(v)
      fetchVehicleInfo(v)
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
        const v = data.vehicle.response
        setVehicle({
          number: v.license_plate,
          owner: maskOwnerName(v.owner_name),
          fatherName: maskOwnerName(v.father_name),
          fuelType: v.fuel_type || 'N/A',
          vehicleClass: v.class || 'N/A',
          category: v.category || 'N/A',
          type: v.class?.includes('Scooter') || v.class?.includes('2W') ? 'Bike' : 'Car',
          seatingCapacity: v.seating_capacity || 'N/A',
          insuranceExpiry: formatDateString(v.insurance_expiry),
          insuranceCompany: v.insurance_company || 'N/A',
          insurancePolicy: v.insurance_policy || 'N/A',
          registrationDate: formatDateString(v.registration_date),
          rto: v.rto_name || 'N/A',
          rcStatus: v.rc_status || 'N/A',
          isFinanced: v.is_financed || false,
          financer: v.financer || 'N/A',
          brandModel: v.brand_model || 'N/A',
          brandName: v.brand_name || 'N/A',
          bodyType: v.body_type || 'N/A',
          color: v.color || 'N/A',
          cubicCapacity: v.cubic_capacity || 'N/A',
          cylinders: v.cylinders || 'N/A',
          grossWeight: v.gross_weight || 'N/A',
          unladenWeight: v.unladen_weight || 'N/A',
          wheelbase: v.wheelbase || 'N/A',
          norms: v.norms || 'N/A',
          chassisNumber: v.chassis_number || 'N/A',
          engineNumber: v.engine_number || 'N/A',
          fitUpTo: formatDateString(v.fit_up_to),
          puccUpto: formatDateString(v.pucc_upto),
          puccNumber: v.pucc_number || 'N/A',
          taxUpto: formatDateString(v.tax_upto),
          ownerCount: v.owner_count || '1',
          manufacturingDate: v.manufacturing_date_formatted || v.manufacturing_date || 'N/A',
        })
      } else {
        setError(data.message || 'Vehicle not found')
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const maskOwnerName = (name) => {
    if (!name) return 'Unknown'
    const parts = name.split(' ')
    if (parts.length === 1) return parts[0]
    return parts.map((p, i) => i === 0 ? p : (p[0] + '***')).join(' ')
  }

  const maskLastDigits = (str) => {
    if (!str) return 'N/A'
    if (str.length <= 4) return '****'
    return '****' + str.slice(-4)
  }

  const formatDateString = (dateStr) => {
    if (!dateStr || dateStr === '1900-01-01') return 'N/A'
    try {
      return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    } catch {
      return dateStr
    }
  }

  const isInsuranceActive = (expiry) => {
    if (!expiry || expiry === 'N/A') return false
    try {
      return new Date(expiry) > new Date()
    } catch {
      return false
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    if (vehicleNumber.trim()) {
      navigate(`/vehicle-info?vehicle=${encodeURIComponent(vehicleNumber.trim())}`)
      fetchVehicleInfo(vehicleNumber.trim())
    }
  }

  const handleDownloadRC = () => {
    if (!vehicle) return

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>RC Details - ${vehicle.number}</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: 'Segoe UI', Inter, Arial, sans-serif; background: #f1f5f9; padding: 32px; color: #0f172a; }
          .card { max-width: 760px; margin: 0 auto; background: #fff; border-radius: 16px; border: 1px solid #e2e8f0; box-shadow: 0 8px 24px -12px rgba(15,23,42,.15); overflow: hidden; }
          .header { background: #fff; color: #0f172a; padding: 24px 28px; border-bottom: 1px solid #e2e8f0; }
          .header .reg-no { font-size: 28px; font-weight: 800; letter-spacing: 2px; color: #0f172a; }
          .header .model { font-size: 15px; font-weight: 600; margin-top: 4px; color: #64748b; }
          .header .mfr { font-size: 12px; color: #94a3b8; margin-top: 2px; }
          .header .ind { display: inline-flex; flex-direction: column; align-items: center; justify-content: center; width: 48px; height: 40px; border-radius: 8px; background: #dc2626; color: #fff; font-size: 8px; font-weight: 700; letter-spacing: 1px; margin-right: 14px; vertical-align: middle; }
          .insurance-bar { display: flex; align-items: center; justify-content: space-between; padding: 14px 28px; background: ${isInsuranceActive(vehicle.insuranceExpiry) ? '#ecfdf5' : '#fef2f2'}; border-bottom: 1px solid ${isInsuranceActive(vehicle.insuranceExpiry) ? '#bbf7d0' : '#fecaca'}; }
          .ins-label { font-size: 14px; font-weight: 700; color: ${isInsuranceActive(vehicle.insuranceExpiry) ? '#047857' : '#dc2626'}; }
          .ins-date { font-size: 12px; color: #64748b; }
          .quick-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0; border-bottom: 1px solid #e2e8f0; }
          .quick-item { padding: 20px 12px; text-align: center; border-right: 1px solid #f1f5f9; }
          .quick-item:last-child { border-right: none; }
          .quick-val { font-size: 14px; font-weight: 700; color: #0f172a; margin-bottom: 2px; }
          .quick-label { font-size: 10px; font-weight: 600; color: #94a3b8; letter-spacing: 1px; text-transform: uppercase; }
          .section { padding: 0 28px; }
          .section-title { font-size: 14px; font-weight: 700; color: #0f172a; padding: 18px 0 12px; border-bottom: 1px solid #f1f5f9; display: flex; align-items: center; gap: 8px; }
          .row { display: flex; justify-content: space-between; gap: 16px; padding: 11px 0; border-bottom: 1px solid #f8fafc; }
          .row:last-child { border-bottom: none; }
          .label { color: #64748b; font-size: 13px; }
          .value { color: #0f172a; font-size: 13px; font-weight: 600; text-align: right; max-width: 55%; word-break: break-word; }
          .active { color: #047857; font-weight: 700; }
          .expired { color: #dc2626; font-weight: 700; }
          .foot { padding: 20px 28px; color: #94a3b8; font-size: 11px; text-align: center; border-top: 1px solid #f1f5f9; }
          @media print { body { background: #fff; padding: 0; } .card { box-shadow: none; border: none; } }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="header">
            <div style="display:flex;align-items:center;gap:14px;">
              <div class="ind">IND</div>
              <div>
                <div class="reg-no">${vehicle.number}</div>
                <div class="model">${vehicle.brandModel}</div>
                <div class="mfr">${vehicle.brandName}</div>
              </div>
            </div>
          </div>
          <div class="insurance-bar">
            <div>
              <div class="ins-label">${isInsuranceActive(vehicle.insuranceExpiry) ? '✅ Insurance Active' : '❌ Insurance Expired'}</div>
              <div class="ins-date">Valid till ${vehicle.insuranceExpiry}</div>
            </div>
          </div>
          <div class="quick-grid">
            <div class="quick-item"><div class="quick-val">${vehicle.fuelType}</div><div class="quick-label">Fuel Type</div></div>
            <div class="quick-item"><div class="quick-val">${vehicle.seatingCapacity} Seats</div><div class="quick-label">Seating</div></div>
            <div class="quick-item"><div class="quick-val">${vehicle.vehicleClass}</div><div class="quick-label">Class</div></div>
            <div class="quick-item"><div class="quick-val">${vehicle.registrationDate}</div><div class="quick-label">Reg. Date</div></div>
          </div>
          <div class="section">
            <div class="section-title">👤 Ownership Details</div>
            <div class="row"><span class="label">Owner Name</span><span class="value">${vehicle.owner}</span></div>
            <div class="row"><span class="label">Father's Name</span><span class="value">${vehicle.fatherName}</span></div>
            <div class="row"><span class="label">Ownership Type</span><span class="value">Owner ${vehicle.ownerCount}</span></div>
            <div class="row"><span class="label">Registration Authority</span><span class="value">${vehicle.rto}</span></div>
            <div class="row"><span class="label">RC Status</span><span class="value ${vehicle.rcStatus === 'ACTIVE' ? 'active' : 'expired'}">${vehicle.rcStatus}</span></div>
            <div class="row"><span class="label">Hypothecation</span><span class="value">${vehicle.isFinanced ? vehicle.financer : 'None'}</span></div>
          </div>
          <div class="section">
            <div class="section-title">🚗 Vehicle Specifications</div>
            <div class="row"><span class="label">Model</span><span class="value">${vehicle.brandModel}</span></div>
            <div class="row"><span class="label">Manufacturer</span><span class="value">${vehicle.brandName}</span></div>
            <div class="row"><span class="label">Vehicle Class</span><span class="value">${vehicle.vehicleClass}</span></div>
            <div class="row"><span class="label">Body Type</span><span class="value">${vehicle.bodyType}</span></div>
            <div class="row"><span class="label">Color</span><span class="value">${vehicle.color}</span></div>
            <div class="row"><span class="label">Fuel Type</span><span class="value">${vehicle.fuelType}</span></div>
            <div class="row"><span class="label">Engine Capacity</span><span class="value">${vehicle.cubicCapacity} cc</span></div>
            <div class="row"><span class="label">Cylinders</span><span class="value">${vehicle.cylinders}</span></div>
            <div class="row"><span class="label">Emission Norms</span><span class="value">${vehicle.norms}</span></div>
            <div class="row"><span class="label">Chassis Number</span><span class="value">${vehicle.chassisNumber}</span></div>
            <div class="row"><span class="label">Engine Number</span><span class="value">${vehicle.engineNumber}</span></div>
          </div>
          <div class="section">
            <div class="section-title">🛡️ Insurance & Compliance</div>
            <div class="row"><span class="label">Insurance Company</span><span class="value">${vehicle.insuranceCompany}</span></div>
            <div class="row"><span class="label">Policy Number</span><span class="value">${vehicle.insurancePolicy}</span></div>
            <div class="row"><span class="label">Insurance Valid Till</span><span class="value ${isInsuranceActive(vehicle.insuranceExpiry) ? 'active' : 'expired'}">${vehicle.insuranceExpiry}</span></div>
            <div class="row"><span class="label">Fitness Valid Till</span><span class="value">${vehicle.fitUpTo}</span></div>
            <div class="row"><span class="label">PUCC Valid Till</span><span class="value">${vehicle.puccUpto}</span></div>
            <div class="row"><span class="label">Tax Paid Upto</span><span class="value">${vehicle.taxUpto}</span></div>
          </div>
          <div class="foot">Generated by ChallanOne RC Lookup · ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
        </div>
      </body>
      </html>
    `

    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      alert('Popup blocked. Please allow popups to download RC.')
      return
    }
    printWindow.document.write(html)
    printWindow.document.close()
    printWindow.focus()
    setTimeout(() => printWindow.print(), 250)
  }

  const showSearch = !vehicle && !loading
  const samples = ['UP32AB1234', 'DL1CDC5678', 'MH01EF9012']

  return (
    <div className="screen">
      <div className="screen-content">
        <PageTitleBar
          title="RC Details"
          subtitle={vehicle ? `Registration details for ${vehicle.number}` : 'Look up any vehicle registration details instantly'}
          onBack={vehicle ? () => setVehicle(null) : undefined}
        />

        {!isFeatureEnabled('rc_details') && showSearch && (
          <div className="container-main py-8">
            <div className="surface-card p-6 text-center animate-fade-up">
              <p className="text-[15px] font-semibold text-red-600">This service is temporarily unavailable</p>
              <p className="text-[13px] text-slate-500 mt-1">RC Details lookup has been disabled. Please check back later.</p>
            </div>
          </div>
        )}

        {isFeatureEnabled('rc_details') && showSearch && (
          <div className="container-main page-section">
            <div className="grid md:grid-cols-2 gap-4 md:gap-12 items-start">
              <div className="space-y-4">
                <form onSubmit={handleSearch} className="surface-card p-4 md:p-6 space-y-3 md:space-y-4 animate-fade-up">
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
                  <button type="submit" disabled={loading} className="btn-primary w-full">
                    {loading ? 'Fetching...' : 'Get RC Details'}
                  </button>
                  {error && <p className="text-sm text-rose-500">{error}</p>}
                </form>

                <div className="animate-fade-up">
                  <p className="field-label">Try a sample number</p>
                  <div className="flex flex-wrap gap-2">
                    {samples.map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setVehicleNumber(num)}
                        className="rounded-full border border-slate-200 bg-white px-4 py-2 text-[13px] font-semibold text-brand-red transition hover:bg-red-50 active:scale-95"
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="page-hero-banner animate-fade-up">
                <RcDocIllustration />
              </div>
            </div>
          </div>
        )}

        {error && vehicleNumber && !loading && !vehicle && (
          <div className="container-main py-12">
            <div className="surface-card p-8 text-center animate-fade-up">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-rose-50 text-rose-500">
                <svg className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-[18px] font-bold text-slate-900">Vehicle Not Found</h3>
              <p className="mt-1 text-[14px] text-slate-500">{error}</p>
              <button
                onClick={() => { setError(''); setVehicleNumber('') }}
                className="btn-primary mt-5"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {loading && (
          <div className="container-main">
            <div className="flex flex-col items-center justify-center py-24">
              <div className="h-14 w-14 animate-spin rounded-full border-4 border-red-100 border-t-brand-red" />
              <p className="mt-5 text-[14px] font-medium text-slate-700">Fetching vehicle details...</p>
              <p className="mt-1 text-[12px] text-slate-400">Accessing official RTO records</p>
            </div>
          </div>
        )}

        {vehicle && (
          <div className="container-main py-6 md:py-10 animate-fade-up">
            <div className="surface-card overflow-hidden max-w-4xl mx-auto">
              {/* Vehicle identity — light theme matching Check Challan */}
              <div className="border-b border-slate-100 bg-white px-5 py-5 md:px-8 md:py-6">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-11 w-14 shrink-0 flex-col items-center justify-center gap-0.5 rounded-lg bg-brand-red text-white">
                    <span className="text-[8px] font-bold tracking-wider">IND</span>
                    <svg
                      className="h-3 w-4 rounded-[1px] shadow-sm"
                      viewBox="0 0 30 20"
                      xmlns="http://www.w3.org/2000/svg"
                      aria-label="Indian flag"
                    >
                      <rect width="30" height="6.67" y="0" fill="#FF9933" />
                      <rect width="30" height="6.67" y="6.67" fill="#FFFFFF" />
                      <rect width="30" height="6.66" y="13.34" fill="#138808" />
                      <circle cx="15" cy="10" r="2.4" fill="none" stroke="#000080" strokeWidth="0.7" />
                      <circle cx="15" cy="10" r="0.45" fill="#000080" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold tracking-widest text-slate-400 uppercase">Registration Number</p>
                    <h2 className="mt-0.5 truncate text-[22px] md:text-[28px] font-extrabold tracking-wider text-slate-900">
                      {vehicle.number}
                    </h2>
                    <p className="mt-0.5 text-[14px] font-semibold text-slate-600">{vehicle.brandModel}</p>
                    <p className="text-[12px] text-slate-400">{vehicle.brandName}</p>
                  </div>
                </div>
              </div>

              {/* Insurance status bar */}
              <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-5 py-3.5 md:px-8 md:py-4 ${isInsuranceActive(vehicle.insuranceExpiry) ? 'bg-emerald-50 border-b border-emerald-200' : 'bg-red-50 border-b border-red-200'}`}>
                <div className="flex items-center gap-3">
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${isInsuranceActive(vehicle.insuranceExpiry) ? 'bg-emerald-100' : 'bg-red-100'}`}>
                    {isInsuranceActive(vehicle.insuranceExpiry) ? (
                      <svg className="h-5 w-5 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                    ) : (
                      <svg className="h-5 w-5 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M12 2l8.485 4.929a1 1 0 01.515.874V12c0 4.993-3.657 9.816-9 11-5.343-1.184-9-6.007-9-11V7.803a1 1 0 01.515-.874L12 2z" /></svg>
                    )}
                  </div>
                  <div>
                    <p className={`text-[14px] font-bold ${isInsuranceActive(vehicle.insuranceExpiry) ? 'text-emerald-700' : 'text-red-600'}`}>
                      {isInsuranceActive(vehicle.insuranceExpiry) ? 'Insurance Active' : 'Insurance Expired'}
                    </p>
                    <p className="text-[12px] text-slate-500">Valid till {vehicle.insuranceExpiry}</p>
                  </div>
                </div>
              </div>

              {/* Quick info cards row */}
              <div className="grid grid-cols-2 md:grid-cols-4 bg-white border-b border-slate-100">
                <QuickInfoCard icon="⛽" iconBg="bg-rose-100" value={vehicle.fuelType} label="FUEL TYPE" />
                <QuickInfoCard icon="💺" iconBg="bg-red-50" value={`${vehicle.seatingCapacity} Seats`} label="SEATING" />
                <QuickInfoCard icon="🚗" iconBg="bg-amber-50" value={vehicle.vehicleClass} label="CLASS" />
                <QuickInfoCard icon="📅" iconBg="bg-emerald-50" value={vehicle.registrationDate} label="REG. DATE" />
              </div>

              {/* Collapsible sections */}
              <div className="bg-white border-t border-slate-100">
                <CollapsibleSection icon="👤" title="Ownership Details">
                  <DetailRow label="Owner Name" value={vehicle.owner} />
                  <DetailRow label="Father's Name" value={vehicle.fatherName} />
                  <DetailRow label="Ownership Type" value={`Owner ${vehicle.ownerCount}`} />
                  <DetailRow label="Registration Authority" value={vehicle.rto} />
                  <DetailRow label="RC Status" value={vehicle.rcStatus} valueClass={vehicle.rcStatus === 'ACTIVE' ? 'text-emerald-600 font-bold' : 'text-red-500 font-bold'} />
                  <DetailRow label="Hypothecation" value={vehicle.isFinanced ? vehicle.financer : 'None'} />
                </CollapsibleSection>

                <CollapsibleSection icon="🔧" title="Vehicle Specifications">
                  <DetailRow label="Model" value={vehicle.brandModel} />
                  <DetailRow label="Manufacturer" value={vehicle.brandName} />
                  <DetailRow label="Vehicle Class" value={vehicle.vehicleClass} />
                  <DetailRow label="Body Type" value={vehicle.bodyType} />
                  <DetailRow label="Color" value={vehicle.color} />
                  <DetailRow label="Fuel Type" value={vehicle.fuelType} />
                  <DetailRow label="Engine Capacity" value={`${vehicle.cubicCapacity} cc`} />
                  <DetailRow label="Cylinders" value={vehicle.cylinders} />
                  <DetailRow label="Gross Weight" value={`${vehicle.grossWeight} kg`} />
                  <DetailRow label="Unladen Weight" value={`${vehicle.unladenWeight} kg`} />
                  <DetailRow label="Wheelbase" value={`${vehicle.wheelbase} mm`} />
                  <DetailRow label="Emission Norms" value={vehicle.norms} />
                  <DetailRow label="Mfg. Date" value={vehicle.manufacturingDate} />
                </CollapsibleSection>

                <CollapsibleSection icon="🛡️" title="Insurance & Finance">
                  <DetailRow label="Insurance Company" value={vehicle.insuranceCompany} />
                  <DetailRow label="Policy Number" value={vehicle.insurancePolicy} />
                  <DetailRow label="Insurance Valid Till" value={vehicle.insuranceExpiry} valueClass={isInsuranceActive(vehicle.insuranceExpiry) ? 'text-emerald-600 font-bold' : 'text-red-500 font-bold'} />
                  <DetailRow label="Financed" value={vehicle.isFinanced ? 'Yes' : 'No'} />
                  {vehicle.isFinanced && <DetailRow label="Financer" value={vehicle.financer} />}
                </CollapsibleSection>

                <CollapsibleSection icon="📋" title="Compliance & Fitness">
                  <DetailRow label="Chassis Number" value={vehicle.chassisNumber} />
                  <DetailRow label="Engine Number" value={vehicle.engineNumber} />
                  <DetailRow label="Fitness Valid Till" value={vehicle.fitUpTo} />
                  <DetailRow label="PUCC Valid Till" value={vehicle.puccUpto} />
                  <DetailRow label="PUCC Number" value={vehicle.puccNumber} />
                  <DetailRow label="Tax Paid Upto" value={vehicle.taxUpto} />
                </CollapsibleSection>
              </div>

              {/* Action buttons */}
              <div className="bg-white px-5 py-5 md:px-8 md:py-6">
                <div className="flex flex-col sm:flex-row gap-3">
                  <button onClick={handleDownloadRC} className="btn-primary flex-1">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download RC
                  </button>
                  <button onClick={() => { setVehicle(null); setVehicleNumber('') }} className="btn-secondary flex-1">
                    New Search
                  </button>
                </div>
                <p className="text-center text-[11px] text-slate-400 mt-4">
                  Data sourced from official RTO records · Powered by <span className="font-semibold text-slate-500">ChallanOne</span>
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/* ---- Quick info card with emoji icon ---- */
function QuickInfoCard({ icon, iconBg, value, label }) {
  return (
    <div className="flex flex-col items-center py-5 px-3 border-b border-slate-100 odd:border-r md:border-r md:[&:nth-child(4n)]:border-r-0 transition hover:bg-slate-50/50">
      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconBg} text-[18px] mb-2.5`}>
        {icon}
      </div>
      <p className="text-[13px] md:text-[14px] font-bold text-slate-900 text-center leading-tight">{value}</p>
      <p className="text-[10px] font-semibold text-slate-400 tracking-wider mt-1">{label}</p>
    </div>
  )
}

/* ---- Collapsible section ---- */
function CollapsibleSection({ icon, title, children }) {
  const [open, setOpen] = useState(true)

  return (
    <div className="border-b border-slate-100 last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 md:px-8 md:py-4.5 hover:bg-slate-50/50 transition-colors"
      >
        <span className="flex items-center gap-2.5">
          <span className="text-[18px]">{icon}</span>
          <span className="text-[14px] md:text-[15px] font-bold text-slate-900">{title}</span>
        </span>
        <svg
          className={`h-5 w-5 text-slate-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="px-5 pb-4 md:px-8 md:pb-5 divide-y divide-slate-50">
          {children}
        </div>
      )}
    </div>
  )
}

/* ---- Detail row ---- */
function DetailRow({ label, value, valueClass = '' }) {
  return (
    <div className="flex items-center justify-between py-3">
      <span className="text-[13px] md:text-[14px] text-slate-500">{label}</span>
      <span className={`text-[13px] md:text-[14px] font-semibold text-slate-900 text-right max-w-[60%] break-words ${valueClass}`}>
        {value}
      </span>
    </div>
  )
}
