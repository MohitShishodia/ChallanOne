/**
 * RC report generation — builds a printable RC report and opens it in a new tab.
 * Shared by the RC result card ("Download RC") and the premium report button.
 * All dynamic vehicle values are HTML-escaped before interpolation.
 */

export function isInsuranceActive(expiry) {
  if (!expiry || expiry === 'N/A') return false
  try {
    return new Date(expiry) > new Date()
  } catch {
    return false
  }
}

function esc(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function buildRcReportHtml(vehicle) {
  const insuranceActive = isInsuranceActive(vehicle.insuranceExpiry)
  return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>RC Details - ${esc(vehicle.number)}</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: 'Segoe UI', Inter, Arial, sans-serif; background: #f1f5f9; padding: 32px; color: #0f172a; }
          .card { max-width: 760px; margin: 0 auto; background: #fff; border-radius: 16px; border: 1px solid #e2e8f0; box-shadow: 0 8px 24px -12px rgba(15,23,42,.15); overflow: hidden; }
          .header { background: #fff; color: #0f172a; padding: 24px 28px; border-bottom: 1px solid #e2e8f0; }
          .header .reg-no { font-size: 28px; font-weight: 800; letter-spacing: 2px; color: #0f172a; }
          .header .model { font-size: 15px; font-weight: 600; margin-top: 4px; color: #64748b; }
          .header .mfr { font-size: 12px; color: #94a3b8; margin-top: 2px; }
          .header .ind { display: inline-flex; flex-direction: column; align-items: center; justify-content: center; width: 48px; height: 40px; border-radius: 8px; background: #dc2626; color: #fff; font-size: 8px; font-weight: 700; letter-spacing: 1px; margin-right: 14px; vertical-align: middle; }
          .insurance-bar { display: flex; align-items: center; justify-content: space-between; padding: 14px 28px; background: ${insuranceActive ? '#ecfdf5' : '#fef2f2'}; border-bottom: 1px solid ${insuranceActive ? '#bbf7d0' : '#fecaca'}; }
          .ins-label { font-size: 14px; font-weight: 700; color: ${insuranceActive ? '#047857' : '#dc2626'}; }
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
                <div class="reg-no">${esc(vehicle.number)}</div>
                <div class="model">${esc(vehicle.brandModel)}</div>
                <div class="mfr">${esc(vehicle.brandName)}</div>
              </div>
            </div>
          </div>
          <div class="insurance-bar">
            <div>
              <div class="ins-label">${insuranceActive ? '✅ Insurance Active' : '❌ Insurance Expired'}</div>
              <div class="ins-date">Valid till ${esc(vehicle.insuranceExpiry)}</div>
            </div>
          </div>
          <div class="quick-grid">
            <div class="quick-item"><div class="quick-val">${esc(vehicle.fuelType)}</div><div class="quick-label">Fuel Type</div></div>
            <div class="quick-item"><div class="quick-val">${esc(vehicle.seatingCapacity)} Seats</div><div class="quick-label">Seating</div></div>
            <div class="quick-item"><div class="quick-val">${esc(vehicle.vehicleClass)}</div><div class="quick-label">Class</div></div>
            <div class="quick-item"><div class="quick-val">${esc(vehicle.registrationDate)}</div><div class="quick-label">Reg. Date</div></div>
          </div>
          <div class="section">
            <div class="section-title"> Ownership Details</div>
            <div class="row"><span class="label">Owner Name</span><span class="value">${esc(vehicle.owner)}</span></div>
            <div class="row"><span class="label">Father's Name</span><span class="value">${esc(vehicle.fatherName)}</span></div>
            <div class="row"><span class="label">Ownership Type</span><span class="value">Owner ${esc(vehicle.ownerCount)}</span></div>
            <div class="row"><span class="label">Registration Authority</span><span class="value">${esc(vehicle.rto)}</span></div>
            <div class="row"><span class="label">RC Status</span><span class="value ${vehicle.rcStatus === 'ACTIVE' ? 'active' : 'expired'}">${esc(vehicle.rcStatus)}</span></div>
            <div class="row"><span class="label">Hypothecation</span><span class="value">${esc(vehicle.isFinanced ? vehicle.financer : 'None')}</span></div>
          </div>
          <div class="section">
            <div class="section-title">🚗 Vehicle Specifications</div>
            <div class="row"><span class="label">Model</span><span class="value">${esc(vehicle.brandModel)}</span></div>
            <div class="row"><span class="label">Manufacturer</span><span class="value">${esc(vehicle.brandName)}</span></div>
            <div class="row"><span class="label">Vehicle Class</span><span class="value">${esc(vehicle.vehicleClass)}</span></div>
            <div class="row"><span class="label">Body Type</span><span class="value">${esc(vehicle.bodyType)}</span></div>
            <div class="row"><span class="label">Color</span><span class="value">${esc(vehicle.color)}</span></div>
            <div class="row"><span class="label">Fuel Type</span><span class="value">${esc(vehicle.fuelType)}</span></div>
            <div class="row"><span class="label">Engine Capacity</span><span class="value">${esc(vehicle.cubicCapacity)} cc</span></div>
            <div class="row"><span class="label">Cylinders</span><span class="value">${esc(vehicle.cylinders)}</span></div>
            <div class="row"><span class="label">Emission Norms</span><span class="value">${esc(vehicle.norms)}</span></div>
            <div class="row"><span class="label">Chassis Number</span><span class="value">${esc(vehicle.chassisNumber)}</span></div>
            <div class="row"><span class="label">Engine Number</span><span class="value">${esc(vehicle.engineNumber)}</span></div>
          </div>
          <div class="section">
            <div class="section-title">🛡️ Insurance & Compliance</div>
            <div class="row"><span class="label">Insurance Company</span><span class="value">${esc(vehicle.insuranceCompany)}</span></div>
            <div class="row"><span class="label">Policy Number</span><span class="value">${esc(vehicle.insurancePolicy)}</span></div>
            <div class="row"><span class="label">Insurance Valid Till</span><span class="value ${insuranceActive ? 'active' : 'expired'}">${esc(vehicle.insuranceExpiry)}</span></div>
            <div class="row"><span class="label">Fitness Valid Till</span><span class="value">${esc(vehicle.fitUpTo)}</span></div>
            <div class="row"><span class="label">PUCC Valid Till</span><span class="value">${esc(vehicle.puccUpto)}</span></div>
            <div class="row"><span class="label">Tax Paid Upto</span><span class="value">${esc(vehicle.taxUpto)}</span></div>
          </div>
          <div class="foot">Generated by ChallanOne RC Lookup · ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
        </div>
      </body>
      </html>
    `
}

/**
 * Open the printable RC report for a mapped vehicle object in a new tab.
 * @param {object} vehicle mapped vehicle object (see utils/vehicleInfo.js)
 * @returns {boolean} true when the report window opened
 */
export function openRcReport(vehicle) {
  const printWindow = window.open('', '_blank')
  if (!printWindow) {
    alert('Popup blocked. Please allow popups to download RC.')
    return false
  }
  printWindow.document.write(buildRcReportHtml(vehicle))
  printWindow.document.close()
  printWindow.focus()
  setTimeout(() => printWindow.print(), 250)
  return true
}

function buildPendingHtml(vehicleNumber) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <title>Generating RC Report - ${esc(vehicleNumber)}</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Segoe UI', Inter, Arial, sans-serif; background: #f8fafc; display: flex; align-items: center; justify-content: center; min-height: 100vh; color: #0f172a; }
        .box { text-align: center; padding: 32px; }
        .spinner { width: 44px; height: 44px; margin: 0 auto 18px; border: 4px solid #fecaca; border-top-color: #dc2626; border-radius: 50%; animation: spin 0.9s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        h1 { font-size: 18px; font-weight: 700; }
        p { font-size: 13px; color: #64748b; margin-top: 8px; }
      </style>
    </head>
    <body>
      <div class="box">
        <div class="spinner"></div>
        <h1>Generating RC Report</h1>
        <p>Fetching official RTO records for ${esc(vehicleNumber)}&hellip;</p>
      </div>
    </body>
    </html>
  `
}

function buildErrorHtml(message) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <title>RC Report Error</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Segoe UI', Inter, Arial, sans-serif; background: #f8fafc; display: flex; align-items: center; justify-content: center; min-height: 100vh; color: #0f172a; }
        .box { text-align: center; padding: 32px; max-width: 480px; }
        h1 { font-size: 18px; font-weight: 700; color: #dc2626; }
        p { font-size: 14px; color: #64748b; margin-top: 10px; }
      </style>
    </head>
    <body>
      <div class="box">
        <h1>Unable to generate report</h1>
        <p>${esc(message)}</p>
      </div>
    </body>
    </html>
  `
}

/**
 * Open the report tab synchronously (inside the click gesture) so popup
 * blockers allow it, showing a "generating" state until data arrives.
 * @returns {Window|null} the opened window, or null when blocked
 */
export function openReportPending(vehicleNumber) {
  const reportWindow = window.open('', '_blank')
  if (!reportWindow) {
    alert('Popup blocked. Please allow popups to download the report.')
    return null
  }
  reportWindow.document.write(buildPendingHtml(vehicleNumber))
  reportWindow.document.close()
  return reportWindow
}

/** Fill a pending report window with the finished report and trigger print. */
export function completeReportWindow(reportWindow, vehicle) {
  try {
    reportWindow.document.open()
    reportWindow.document.write(buildRcReportHtml(vehicle))
    reportWindow.document.close()
    reportWindow.focus()
    setTimeout(() => reportWindow.print(), 250)
  } catch {
    // Window closed in the meantime — nothing to do.
  }
}

/** Show a fetch error inside a pending report window. */
export function failReportWindow(reportWindow, message) {
  try {
    reportWindow.document.open()
    reportWindow.document.write(buildErrorHtml(message))
    reportWindow.document.close()
  } catch {
    // Window closed in the meantime — nothing to do.
  }
}
