import { useState } from 'react'
import { isInsuranceActive, openRcReport } from '../utils/rcReport'

/**
 * RC result card — vehicle identity, insurance bar, quick stats and
 * collapsible detail sections. "Download RC" opens the printable
 * report in a new tab via utils/rcReport.
 */
export default function VehicleRcResult({ vehicle, onNewSearch }) {
  if (!vehicle) return null

  const handleDownloadRC = () => openRcReport(vehicle)

  return (
    <div className="surface-card overflow-hidden max-w-4xl mx-auto">
      {/* Vehicle identity */}
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
              <svg className="h-5 w-5 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 00-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.402-.133-2.052-.382-3.016z" /></svg>
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
          <button onClick={onNewSearch} className="btn-secondary flex-1">
            New Search
          </button>
        </div>
        <p className="text-center text-[11px] text-slate-400 mt-4">
          Data sourced from official RTO records · Powered by <span className="font-semibold text-slate-500">ChallanOne</span>
        </p>
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
