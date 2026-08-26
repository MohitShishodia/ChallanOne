import { API_BASE_URL } from '../config/api'

function maskOwnerName(name) {
  if (!name) return 'Unknown'
  const parts = name.split(' ')
  if (parts.length === 1) return parts[0]
  return parts.map((p, i) => (i === 0 ? p : p[0] + '***')).join(' ')
}

function formatDateString(dateStr) {
  if (!dateStr || dateStr === '1900-01-01') return 'N/A'
  try {
    return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
  } catch {
    return dateStr
  }
}

/**
 * Fetch RC details from the external RTO API and map them into the shape used by the UI.
 * Concurrent requests for the same number share one network call, and the
 * request aborts after REQUEST_TIMEOUT_MS so the UI never hangs forever.
 * @param {string} number vehicle registration number
 * @returns {Promise<object>} mapped vehicle object
 * @throws {Error} with a user-facing message on failure
 */
const REQUEST_TIMEOUT_MS = 30000
const inflightRequests = new Map()

export function fetchVehicleInfo(number) {
  const trimmed = String(number || '').trim().toUpperCase()
  if (!trimmed) return Promise.reject(new Error('Please enter a vehicle registration number'))

  if (inflightRequests.has(trimmed)) return inflightRequests.get(trimmed)

  const promise = doFetchVehicleInfo(trimmed).finally(() => {
    inflightRequests.delete(trimmed)
  })
  inflightRequests.set(trimmed, promise)
  return promise
}

async function doFetchVehicleInfo(trimmed) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  let data
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/external/vehicle/${encodeURIComponent(trimmed)}`,
      { signal: controller.signal }
    )
    data = await response.json()
  } catch (err) {
    throw new Error(
      err?.name === 'AbortError'
        ? 'The request is taking longer than expected. Please try again.'
        : 'Network error. Please try again.'
    )
  } finally {
    clearTimeout(timer)
  }

  if (!(data.success && data.vehicle?.response)) {
    throw new Error(data.message || 'Vehicle not found')
  }

  const v = data.vehicle.response
  return {
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
  }
}
