const PAYMENTS_KEY = 'challanone_payments'
const PENDING_KEY = 'challanone_pending_challans'
const SERVICE_KEY = 'challanone_service_history'

function read(key, fallback = []) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function write(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
}

export function saveUserPayment(receipt) {
  const list = read(PAYMENTS_KEY)
  const entry = { ...receipt, savedAt: new Date().toISOString() }
  const filtered = list.filter((p) => p.id !== entry.id)
  write(PAYMENTS_KEY, [entry, ...filtered].slice(0, 50))
}

export function getUserPayments() {
  return read(PAYMENTS_KEY)
}

export function savePendingChallans(vehicleNumber, challans = []) {
  const list = read(PENDING_KEY)
  const entry = {
    vehicleNumber,
    challans,
    updatedAt: new Date().toISOString(),
  }
  const filtered = list.filter((p) => p.vehicleNumber !== vehicleNumber)
  write(PENDING_KEY, [entry, ...filtered].slice(0, 20))
}

export function getPendingChallans() {
  return read(PENDING_KEY)
}

export function saveServiceRecord(record) {
  const list = read(SERVICE_KEY)
  write(SERVICE_KEY, [{ ...record, id: `SRV-${Date.now()}`, date: new Date().toISOString() }, ...list].slice(0, 30))
}

export function getServiceHistory(vehicleNumber) {
  const all = read(SERVICE_KEY)
  if (!vehicleNumber) return all
  const v = vehicleNumber.toUpperCase().replace(/\s/g, '')
  return all.filter((s) => (s.vehicleNumber || '').toUpperCase().replace(/\s/g, '') === v)
}
