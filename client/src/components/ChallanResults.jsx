import { useMemo, useState } from 'react'
import DetailDrawer, { DetailRow } from './DetailDrawer'
import ReceiptViewer from './ReceiptViewer'
import { sumChallanFineAmounts } from '../utils/challanUtils'
import { downloadChallansPdf } from '../utils/challanPdf'

const TABS = {
  ALL: 'all',
  PENDING: 'pending',
  PAID: 'paid',
  COURT: 'court',
}

const INDIAN_STATES = [
  { code: 'AN', name: 'Andaman & Nicobar', keywords: ['andaman', 'nicobar', 'port blair'] },
  { code: 'AP', name: 'Andhra Pradesh', keywords: ['andhra pradesh', 'vijayawada', 'visakhapatnam', 'tirupati'] },
  { code: 'AR', name: 'Arunachal Pradesh', keywords: ['arunachal pradesh', 'itanagar'] },
  { code: 'AS', name: 'Assam', keywords: ['assam', 'guwahati', 'dispur'] },
  { code: 'BR', name: 'Bihar', keywords: ['bihar', 'patna', 'gaya'] },
  { code: 'CH', name: 'Chandigarh', keywords: ['chandigarh'] },
  { code: 'CG', name: 'Chhattisgarh', keywords: ['chhattisgarh', 'raipur', 'bilaspur'] },
  { code: 'DD', name: 'Dadra & Nagar Haveli and Daman & Diu', keywords: ['daman', 'diu', 'silvassa'] },
  { code: 'DL', name: 'Delhi', keywords: ['delhi', 'new delhi', 'rohini', 'dwarka', 'rajouri', 'saket', 'karol bagh', 'narela'] },
  { code: 'GA', name: 'Goa', keywords: ['goa', 'panaji', 'margao'] },
  { code: 'GJ', name: 'Gujarat', keywords: ['gujarat', 'ahmedabad', 'surat', 'vadodara', 'rajkot'] },
  { code: 'HR', name: 'Haryana', keywords: ['haryana', 'gurugram', 'gurgaon', 'faridabad', 'panipat'] },
  { code: 'HP', name: 'Himachal Pradesh', keywords: ['himachal pradesh', 'shimla', 'manali'] },
  { code: 'JK', name: 'Jammu & Kashmir', keywords: ['jammu', 'kashmir', 'srinagar'] },
  { code: 'JH', name: 'Jharkhand', keywords: ['jharkhand', 'ranchi', 'jamshedpur'] },
  { code: 'KA', name: 'Karnataka', keywords: ['karnataka', 'bengaluru', 'bangalore', 'mysuru', 'mangalore'] },
  { code: 'KL', name: 'Kerala', keywords: ['kerala', 'kochi', 'ernakulam', 'thiruvananthapuram', 'kozhikode'] },
  { code: 'LA', name: 'Ladakh', keywords: ['ladakh', 'leh'] },
  { code: 'LD', name: 'Lakshadweep', keywords: ['lakshadweep', 'kavaratti'] },
  { code: 'MP', name: 'Madhya Pradesh', keywords: ['madhya pradesh', 'bhopal', 'indore', 'gwalior'] },
  { code: 'MH', name: 'Maharashtra', keywords: ['maharashtra', 'mumbai', 'pune', 'nagpur', 'nashik'] },
  { code: 'MN', name: 'Manipur', keywords: ['manipur', 'imphal'] },
  { code: 'ML', name: 'Meghalaya', keywords: ['meghalaya', 'shillong'] },
  { code: 'MZ', name: 'Mizoram', keywords: ['mizoram', 'aizawl'] },
  { code: 'NL', name: 'Nagaland', keywords: ['nagaland', 'kohima', 'dimapur'] },
  { code: 'OD', name: 'Odisha', aliases: ['OR'], keywords: ['odisha', 'orissa', 'bhubaneswar', 'cuttack'] },
  { code: 'PY', name: 'Puducherry', keywords: ['puducherry', 'pondicherry'] },
  { code: 'PB', name: 'Punjab', keywords: ['punjab', 'ludhiana', 'amritsar', 'jalandhar'] },
  { code: 'RJ', name: 'Rajasthan', keywords: ['rajasthan', 'jaipur', 'jodhpur', 'udaipur', 'kota'] },
  { code: 'SK', name: 'Sikkim', keywords: ['sikkim', 'gangtok'] },
  { code: 'TN', name: 'Tamil Nadu', keywords: ['tamil nadu', 'chennai', 'coimbatore', 'madurai'] },
  { code: 'TS', name: 'Telangana', keywords: ['telangana', 'hyderabad', 'secunderabad'] },
  { code: 'TR', name: 'Tripura', keywords: ['tripura', 'agartala'] },
  { code: 'UP', name: 'Uttar Pradesh', keywords: ['uttar pradesh', 'noida', 'ghaziabad', 'lucknow', 'kanpur', 'agra', 'varanasi'] },
  { code: 'UK', name: 'Uttarakhand', aliases: ['UA'], keywords: ['uttarakhand', 'dehradun', 'haridwar', 'haldwani'] },
  { code: 'WB', name: 'West Bengal', keywords: ['west bengal', 'kolkata', 'howrah', 'siliguri'] },
]

function getChallanStateCode(challan) {
  const identifiers = [challan.noticeId, challan.challanNumber, challan.id]
    .filter(Boolean)
    .map((value) => String(value).trim().toUpperCase())
  const location = String(challan.location || '').toLowerCase()

  const identifierMatch = INDIAN_STATES.find((state) =>
    [state.code, ...(state.aliases || [])].some((code) =>
      identifiers.some((identifier) => new RegExp(`^${code}(?:[^A-Z]|$)`).test(identifier))
    )
  )
  if (identifierMatch) return identifierMatch.code

  return INDIAN_STATES.find((state) =>
    state.keywords.some((keyword) => location.includes(keyword))
  )?.code || 'OTHER'
}

function isCourtChallan(challan) {
  return Boolean(challan.isCourtChallan || challan.sentToRegCourt || challan.courtName)
}

function getChallanIdStatePrefix(challan) {
  const identifiers = [challan.noticeId, challan.challanNumber, challan.id]
    .filter(Boolean)
    .map((value) => String(value).trim().toUpperCase())

  for (const identifier of identifiers) {
    const prefix = identifier.slice(0, 2)
    if (/^[A-Z]{2}$/.test(prefix)) return prefix
  }
  return ''
}

function canOpenPortalPrint(challan, dataSource) {
  if (dataSource === 'DELHI_OTP') return false
  const prefix = getChallanIdStatePrefix(challan)
  if (!prefix) return false
  return prefix !== 'DL' && prefix !== 'UP'
}

function portalPrintDisabledReason(challan, dataSource, actionLabel) {
  if (dataSource === 'DELHI_OTP') {
    return `${actionLabel} is not available for Delhi challans`
  }
  const prefix = getChallanIdStatePrefix(challan)
  if (prefix === 'DL' || prefix === 'UP') {
    return `${actionLabel} is not available for Delhi and UP challans`
  }
  if (!prefix) {
    return `${actionLabel} is unavailable until the challan state is identified`
  }
  return `${actionLabel} is unavailable`
}

function getChallanNumber(challan) {
  return challan.noticeId || challan.challanNumber || challan.id
}

function formatAmount(amount) {
  return `₹${(amount || 0).toLocaleString('en-IN')}`
}

function truncateText(text, max = 36) {
  const value = String(text || '').trim()
  if (value.length <= max) return value
  return `${value.slice(0, max - 1)}…`
}

function StatusBadge({ challan }) {
  if (challan.status === 'PAID') {
    return <span className="pill pill-success">Paid</span>
  }
  if (isCourtChallan(challan)) {
    return <span className="pill pill-warning">Court</span>
  }
  return <span className="pill pill-pending">Pending</span>
}

function getViolationKind(challan) {
  const text = [
    challan.offenceDetails,
    challan.type,
    challan.description,
    challan.displayType,
    challan.section,
    challan.violationType,
  ]
    .filter((v) => v && v !== 'N/A')
    .join(' ')
    .toLowerCase()

  if (/mobile|phone|cellphone|cell phone|handheld|using phone|talking on/.test(text)) return 'mobile'
  if (/seat\s*belt|seatbelt|safety belt|not wearing belt/.test(text)) return 'seatbelt'
  if (/speed|overspeed|over speed|over-speed|speeding|excess speed/.test(text)) return 'speed'
  if (/helmet|without helmet|no helmet/.test(text)) return 'helmet'
  if (/red\s*light|red signal|signal jump|traffic signal|signal violat/.test(text)) return 'signal'
  if (/no\s*entry|no-entry|one way|wrong (?:side|way|direction)/.test(text)) return 'noentry'
  if (/parking|parked|no parking/.test(text)) return 'parking'
  if (/drink|drunk|alcohol|intoxicat|dui/.test(text)) return 'alcohol'
  if (/triple|triple riding|pillion|extra rider/.test(text)) return 'triple'
  if (isCourtChallan(challan)) return 'court'
  return 'default'
}

function ViolationIcon({ challan }) {
  const kind = getViolationKind(challan)

  const styles = {
    court: 'bg-amber-50 text-amber-600 ring-amber-100',
    speed: 'bg-rose-50 text-rose-500 ring-rose-100',
    seatbelt: 'bg-sky-50 text-sky-600 ring-sky-100',
    mobile: 'bg-rose-50 text-rose-500 ring-rose-100',
    helmet: 'bg-violet-50 text-violet-600 ring-violet-100',
    signal: 'bg-orange-50 text-orange-500 ring-orange-100',
    noentry: 'bg-rose-50 text-rose-600 ring-rose-100',
    parking: 'bg-indigo-50 text-indigo-600 ring-indigo-100',
    alcohol: 'bg-rose-50 text-rose-600 ring-rose-100',
    triple: 'bg-teal-50 text-teal-600 ring-teal-100',
    default: 'bg-slate-100 text-slate-600 ring-slate-200',
  }

  const labels = {
    court: 'Court challan',
    speed: 'Speeding',
    seatbelt: 'Seat belt',
    mobile: 'Mobile phone',
    helmet: 'Helmet',
    signal: 'Signal jump',
    noentry: 'No entry',
    parking: 'Parking',
    alcohol: 'Drink & drive',
    triple: 'Triple riding',
    default: 'Traffic violation',
  }

  const icons = {
    /* Speedometer with needle — speeding */
    speed: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="13" r="8" stroke="currentColor" strokeWidth="1.8" />
        <path d="M12 13l5-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <circle cx="12" cy="13" r="1.6" fill="currentColor" />
        <path d="M7.2 17.5a6.2 6.2 0 019.6 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        <path d="M8 9.2l.7.7M16 9.2l-.7.7M12 7.2v1" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    ),
    /* Judge gavel — court */
    court: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M20.5 20.25H3.5a.75.75 0 000 1.5h17a.75.75 0 000-1.5z" />
        <path d="M13.78 3.22a.75.75 0 00-1.06 0L4.97 10.97a.75.75 0 001.06 1.06l1.47-1.47 2.12 2.12-4.24 4.24a.75.75 0 001.06 1.06l4.24-4.24 2.12 2.12-1.47 1.47a.75.75 0 001.06 1.06l7.75-7.75a.75.75 0 000-1.06L13.78 3.22zm-1.59 2.12l5.63 5.63-2.12 2.12-5.63-5.63 2.12-2.12z" />
      </svg>
    ),
    /* Person with seatbelt */
    seatbelt: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <circle cx="12" cy="5" r="2.4" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21v-4c0-2.2 2-4 4.5-4s4.5 1.8 4.5 4v4" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.5 10.5l11 6" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.8 9.6l1.8 3.2" />
        <rect x="10.2" y="12.2" width="2.4" height="2.4" rx="0.4" fill="currentColor" stroke="none" />
      </svg>
    ),
    /* Phone with ban circle */
    mobile: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="9" y="5.5" width="6" height="10" rx="1.2" stroke="currentColor" strokeWidth="1.7" />
        <path d="M11.2 13.4h1.6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
        <path d="M6.4 6.4l11.2 11.2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
    /* Helmet */
    helmet: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 14.5A7.5 7.5 0 0112 7a7.5 7.5 0 017.5 7.5V17H4.5v-2.5z" />
        <path strokeLinecap="round" d="M3.5 17.5h17" />
        <path strokeLinecap="round" d="M12 7v3.5" />
        <path strokeLinecap="round" d="M9 17.5v1.5M15 17.5v1.5" />
      </svg>
    ),
    /* Traffic light */
    signal: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="7.5" y="2.5" width="9" height="19" rx="2.5" stroke="currentColor" strokeWidth="1.8" />
        <circle cx="12" cy="7" r="1.6" fill="currentColor" />
        <circle cx="12" cy="12" r="1.6" fill="currentColor" />
        <circle cx="12" cy="17" r="1.6" fill="currentColor" />
      </svg>
    ),
    /* No entry / wrong way */
    noentry: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
        <path d="M6.5 12h11" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      </svg>
    ),
    /* Parking P */
    parking: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="3.5" y="3.5" width="17" height="17" rx="3" stroke="currentColor" strokeWidth="1.8" />
        <path d="M9 17.5V6.5h4.5a3.2 3.2 0 010 6.4H9" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    /* Drink glass */
    alcohol: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 3h9l-1.4 6.2A4.8 4.8 0 0112 18a4.8 4.8 0 01-3.1-8.8L7.5 3z" />
        <path strokeLinecap="round" d="M12 18v3.5" />
        <path strokeLinecap="round" d="M9 21.5h6" />
      </svg>
    ),
    /* Triple riding — 3 people */
    triple: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <circle cx="8" cy="7" r="2" />
        <circle cx="12" cy="6.5" r="2" />
        <circle cx="16" cy="7" r="2" />
        <path strokeLinecap="round" d="M4.5 18c.4-2.4 2.2-4 4.2-4s3.5 1.2 4 3.2" />
        <path strokeLinecap="round" d="M9.8 14.2c.7-1.5 2-2.4 3.5-2.4 2.1 0 3.8 1.5 4.2 3.7" />
        <path strokeLinecap="round" d="M7.2 14.5c-.3-.8-.9-1.4-1.7-1.7" />
      </svg>
    ),
    /* Generic car / traffic */
    default: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 14l1.8-5.2A2 2 0 016.7 7.5h10.6a2 2 0 011.9 1.3L21 14v4.5a1 1 0 01-1 1h-1.2a1 1 0 01-1-1V17H6.2v1.5a1 1 0 01-1 1H4a1 1 0 01-1-1V14z" />
        <circle cx="7.2" cy="14.8" r="1.2" fill="currentColor" stroke="none" />
        <circle cx="16.8" cy="14.8" r="1.2" fill="currentColor" stroke="none" />
      </svg>
    ),
  }

  return (
    <div
      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ring-1 ${styles[kind]}`}
      title={labels[kind]}
      aria-label={labels[kind]}
    >
      {icons[kind]}
    </div>
  )
}

function LoadingSkeleton({ vehicleNumber = '' }) {
  return (
    <div className="space-y-3 animate-fade-up">
      <div className="surface-card flex items-center gap-3 px-4 py-3.5 md:px-5">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-red-100 border-t-brand-red" />
        </span>
        <div className="min-w-0">
          <p className="text-[14px] font-bold text-slate-900">
            Searching challans{vehicleNumber ? ` for ${vehicleNumber}` : '…'}
          </p>
          <p className="mt-0.5 text-[12px] text-slate-500">
            Fetching live records from official government sources
          </p>
        </div>
      </div>
      <div className="surface-card overflow-hidden animate-pulse">
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 p-5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 rounded-xl bg-slate-100" />
          ))}
        </div>
        <div className="space-y-3 border-t border-slate-100 p-5">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 rounded-xl bg-slate-100" />
          ))}
        </div>
      </div>
    </div>
  )
}

export { LoadingSkeleton as ChallanResultsSkeleton }

export default function ChallanResults({
  data,
  dataSource,
  selectedChallans,
  onToggleChallan,
  onSelectAllPending,
  onDeselectAll,
  onPay,
  onBack,
  onRefresh,
  paymentLoading,
  filters,
  onFiltersChange,
}) {
  const [drawer, setDrawer] = useState(null)
  const [copiedId, setCopiedId] = useState(null)
  const [receiptChallanNumber, setReceiptChallanNumber] = useState(null)
  const [receiptVariant, setReceiptVariant] = useState('receipt')
  const [pdfLoading, setPdfLoading] = useState(false)

  const copyChallanId = async (id) => {
    if (!id) return
    try {
      await navigator.clipboard.writeText(String(id))
    } catch {
      const input = document.createElement('input')
      input.value = String(id)
      document.body.appendChild(input)
      input.select()
      document.execCommand('copy')
      document.body.removeChild(input)
    }
    setCopiedId(id)
    window.setTimeout(() => setCopiedId((current) => (current === id ? null : current)), 1500)
  }

  const activeTab = filters?.activeTab || TABS.ALL
  const selectedState = filters?.selectedState || 'all'
  const searchQuery = filters?.searchQuery || ''
  const courtFilter = filters?.courtFilter || 'all'
  const sortBy = filters?.sortBy || 'newest'

  const updateFilters = (patch) => {
    onFiltersChange?.({ ...filters, ...patch })
  }

  const pendingChallans = useMemo(
    () => data.challans.filter((c) => c.status !== 'PAID'),
    [data.challans]
  )
  const paidChallans = useMemo(
    () => data.challans.filter((c) => c.status === 'PAID'),
    [data.challans]
  )
  const courtChallans = useMemo(
    () => data.challans.filter((c) => isCourtChallan(c) && c.status !== 'PAID'),
    [data.challans]
  )

  const availableStates = useMemo(() => {
    const counts = data.challans.reduce((result, challan) => {
      const code = getChallanStateCode(challan)
      result[code] = (result[code] || 0) + 1
      return result
    }, {})

    return Object.entries(counts)
      .map(([code, count]) => ({
        code,
        count,
        name: INDIAN_STATES.find((state) => state.code === code)?.name || 'Other / Unidentified',
      }))
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [data.challans])

  const filteredChallans = useMemo(() => {
    let list = data.challans

    if (selectedState !== 'all') {
      list = list.filter((challan) => getChallanStateCode(challan) === selectedState)
    }

    if (activeTab === TABS.PENDING) list = list.filter((c) => c.status !== 'PAID')
    if (activeTab === TABS.PAID) list = list.filter((c) => c.status === 'PAID')
    if (activeTab === TABS.COURT) list = list.filter((c) => isCourtChallan(c) && c.status !== 'PAID')

    if (courtFilter === 'court') list = list.filter((c) => isCourtChallan(c))
    if (courtFilter === 'regular') list = list.filter((c) => !isCourtChallan(c))

    const q = searchQuery.trim().toLowerCase()
    if (q) {
      list = list.filter((c) => {
        const haystack = [
          c.noticeId,
          c.challanNumber,
          c.id,
          c.location,
          c.offenceDetails,
          c.type,
          c.section,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
        return haystack.includes(q)
      })
    }

    const sorted = [...list].sort((a, b) => {
      const aKey = `${a.date || ''} ${a.time || ''}`
      const bKey = `${b.date || ''} ${b.time || ''}`
      if (sortBy === 'oldest') return aKey.localeCompare(bKey)
      if (sortBy === 'amount-high') return (b.amount || 0) - (a.amount || 0)
      if (sortBy === 'amount-low') return (a.amount || 0) - (b.amount || 0)
      return bKey.localeCompare(aKey)
    })

    return sorted
  }, [data.challans, selectedState, activeTab, courtFilter, searchQuery, sortBy])

  const selectedPending = pendingChallans.filter((c) => selectedChallans.includes(c.id))
  const allPendingSelected =
    pendingChallans.length > 0 && selectedPending.length === pendingChallans.length

  const totalDue = sumChallanFineAmounts(pendingChallans)
  const paidTotal = sumChallanFineAmounts(paidChallans)
  const totalCount = data.challans.length || 1
  const pendingPct = Math.round((pendingChallans.length / totalCount) * 100)
  const paidPct = Math.max(0, 100 - pendingPct)

  const tabs = [
    { id: TABS.ALL, label: 'All', count: data.challans.length, dot: null },
    { id: TABS.PENDING, label: 'Pending', count: pendingChallans.length, dot: 'bg-rose-500' },
    { id: TABS.PAID, label: 'Paid', count: paidChallans.length, dot: 'bg-emerald-500' },
    { id: TABS.COURT, label: 'Court', count: courtChallans.length, dot: 'bg-amber-500' },
  ]

  const handleDownloadPdf = () => {
    setPdfLoading(true)
    try {
      downloadChallansPdf(data.vehicle, data.challans)
    } finally {
      setTimeout(() => setPdfLoading(false), 400)
    }
  }

  const selectClass =
    'h-10 appearance-none rounded-xl border border-slate-200 bg-white py-2 pl-3 pr-8 text-[12px] font-semibold text-slate-700 shadow-sm outline-none transition hover:border-slate-300 focus:border-brand-red focus:ring-4 focus:ring-red-50'

  return (
    <div className="space-y-3.5 animate-fade-up">
      {/* Vehicle identity + owner strip */}
      <div className="surface-card overflow-hidden">
        <div className="flex flex-wrap items-center gap-3 px-4 py-3 md:px-5">
          <div className="flex h-10 w-12 shrink-0 flex-col items-center justify-center gap-0.5 rounded-lg bg-brand-red text-white">
            <span className="text-[7px] font-bold tracking-wider">IND</span>
            <svg className="h-3 w-4.5 rounded-[1px]" viewBox="0 0 30 20" aria-label="Indian flag">
              <rect width="30" height="6.67" y="0" fill="#FF9933" />
              <rect width="30" height="6.67" y="6.67" fill="#FFFFFF" />
              <rect width="30" height="6.66" y="13.34" fill="#138808" />
              <circle cx="15" cy="10" r="2.4" fill="none" stroke="#000080" strokeWidth="0.7" />
              <circle cx="15" cy="10" r="0.45" fill="#000080" />
            </svg>
          </div>
          <p className="truncate text-[20px] font-extrabold tracking-wide text-slate-900 md:text-[22px]">
            {data.vehicle?.number}
          </p>
          {data.vehicle?.isVerified && (
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700">
              <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Verified
            </span>
          )}
        </div>

        <div className="grid gap-2.5 border-t border-slate-100 bg-slate-50/80 px-4 py-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_auto] lg:items-center md:px-5">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-slate-500 ring-1 ring-slate-100">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </span>
            <div className="min-w-0">
              <p className="text-[10px] font-medium text-slate-500">Owner Name</p>
              <p className="truncate text-[13px] font-bold text-slate-900">{data.vehicle?.owner || '—'}</p>
            </div>
          </div>

          <div className="flex min-w-0 items-center gap-2.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-slate-500 ring-1 ring-slate-100">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 13l2-5a2 2 0 012-1.5h10A2 2 0 0119 8l2 5v5a1 1 0 01-1 1h-1a1 1 0 01-1-1v-1H6v1a1 1 0 01-1 1H4a1 1 0 01-1-1v-5z" />
                <circle cx="7.5" cy="15.5" r="1.2" />
                <circle cx="16.5" cy="15.5" r="1.2" />
              </svg>
            </span>
            <div className="min-w-0">
              <p className="text-[10px] font-medium text-slate-500">Vehicle Type</p>
              <p className="truncate text-[13px] font-bold text-slate-900">
                {data.vehicle?.vehicleType || 'Private Vehicle'}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:col-span-2 sm:flex-row sm:items-center sm:justify-between lg:col-span-1 lg:justify-end lg:gap-3.5">
            <div className="text-left lg:text-right">
              <p className="text-[10px] font-medium text-slate-500">Total Outstanding</p>
              <p className="text-[20px] font-extrabold leading-none text-brand-red">
                {formatAmount(totalDue)}
              </p>
            </div>
            {pendingChallans.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  onSelectAllPending?.()
                  onPay?.(pendingChallans.map((c) => c.id))
                }}
                disabled={paymentLoading}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-brand-red px-3.5 py-2 text-[12px] font-bold text-white transition hover:bg-brand-red-dark disabled:opacity-50"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Pay All Pending
              </button>
            )}
          </div>
        </div>

        {dataSource === 'DELHI_OTP' && (
          <div className="border-t border-orange-100 bg-orange-50/70 px-4 py-1.5 text-[11px] font-medium text-orange-700">
            Delhi OTP Verified — results from Delhi Traffic Police
          </div>
        )}
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        <button
          type="button"
          onClick={() => updateFilters({ activeTab: TABS.ALL })}
          className="flex items-center gap-3 rounded-2xl border border-sky-100 bg-sky-50/80 px-3.5 py-3 text-left shadow-sm transition hover:bg-sky-50"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sky-600">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </span>
          <div className="min-w-0">
            <p className="text-[11px] font-medium text-slate-500">Total Challans</p>
            <p className="mt-0.5 text-[20px] font-extrabold leading-none text-slate-900">{data.challans.length}</p>
            <span className="mt-1 inline-block text-[11px] font-semibold text-sky-600">View All →</span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => updateFilters({ activeTab: TABS.PENDING })}
          className="flex items-center gap-3 rounded-2xl border border-orange-100 bg-orange-50/80 px-3.5 py-3 text-left shadow-sm transition hover:bg-orange-50"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </span>
          <div className="min-w-0">
            <p className="text-[11px] font-medium text-slate-500">Pending</p>
            <p className="mt-0.5 text-[20px] font-extrabold leading-none text-slate-900">
              {pendingChallans.length}
              <span className="ml-1.5 text-[12px] font-bold text-brand-red">{formatAmount(totalDue)}</span>
            </p>
            <span className="mt-1 inline-block text-[11px] font-semibold text-brand-red">Pay Now →</span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => updateFilters({ activeTab: TABS.PAID })}
          className="flex items-center gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/80 px-3.5 py-3 text-left shadow-sm transition hover:bg-emerald-50"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </span>
          <div className="min-w-0">
            <p className="text-[11px] font-medium text-slate-500">Paid</p>
            <p className="mt-0.5 text-[20px] font-extrabold leading-none text-slate-900">
              {paidChallans.length}
              <span className="ml-1.5 text-[12px] font-bold text-emerald-600">{formatAmount(paidTotal)}</span>
            </p>
            <span className="mt-1 inline-block text-[11px] font-semibold text-emerald-600">View Receipts →</span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => updateFilters({ activeTab: TABS.COURT })}
          className="flex items-center gap-3 rounded-2xl border border-violet-100 bg-violet-50/80 px-3.5 py-3 text-left shadow-sm transition hover:bg-violet-50"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-600">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 6l9-4 9 4M4 10h16M8 10v8m8-8v8M6 18h12" />
            </svg>
          </span>
          <div className="min-w-0">
            <p className="text-[11px] font-medium text-slate-500">Court Cases</p>
            <p className="mt-0.5 text-[20px] font-extrabold leading-none text-slate-900">{courtChallans.length}</p>
            <span className="mt-1 inline-block text-[11px] font-semibold text-violet-600">View Details →</span>
          </div>
        </button>
      </div>

      {/* Overall status + utility actions */}
      <div className="surface-card flex flex-col gap-3 px-4 py-3 md:flex-row md:items-center md:justify-between md:px-5">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <p className="text-[12px] font-bold text-slate-900">Overall Status</p>
            <span className="text-[11px] font-semibold text-brand-red">{pendingPct}% Pending</span>
            <span className="text-[11px] font-semibold text-emerald-600">{paidPct}% Paid</span>
          </div>
          <div className="mt-2 flex h-2 overflow-hidden rounded-full bg-slate-100">
            <div className="bg-brand-red transition-all" style={{ width: `${pendingPct}%` }} />
            <div className="bg-emerald-500 transition-all" style={{ width: `${paidPct}%` }} />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={pdfLoading || data.challans.length === 0}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-brand-red/25 bg-white px-3 py-2 text-[12px] font-bold text-brand-red transition hover:bg-red-50 disabled:opacity-50"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            {pdfLoading ? 'Preparing…' : 'Download PDF'}
          </button>
          {onRefresh && (
            <button type="button" onClick={onRefresh} className="btn-secondary !px-3 !py-2 text-[12px]">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          )}
          <button type="button" onClick={onBack} className="btn-secondary !px-3 !py-2 text-[12px]">
            New Search
          </button>
        </div>
      </div>

      {/* Filters + table */}
      <div className="surface-card">
        <div className="space-y-3 border-b border-slate-100 bg-slate-50/60 px-4 py-3 md:px-5 rounded-t-2xl">
          <div className="flex flex-col gap-2 xl:flex-row xl:items-center">
            <div className="relative min-w-0 flex-1">
              <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 18a7 7 0 100-14 7 7 0 000 14z" />
              </svg>
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => updateFilters({ searchQuery: e.target.value })}
                placeholder="Search by Challan No., Location, Violation"
                className="h-10 w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-[13px] outline-none transition focus:border-brand-red focus:ring-4 focus:ring-red-50"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <label className="relative">
                <select
                  value={selectedState}
                  onChange={(e) => updateFilters({ selectedState: e.target.value })}
                  className={selectClass}
                >
                  <option value="all">State (All States)</option>
                  {availableStates.map((state) => (
                    <option key={state.code} value={state.code}>
                      {state.name} ({state.count})
                    </option>
                  ))}
                </select>
                <svg className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </label>

              <label className="relative">
                <select
                  value={courtFilter}
                  onChange={(e) => updateFilters({ courtFilter: e.target.value })}
                  className={selectClass}
                >
                  <option value="all">Court (All)</option>
                  <option value="court">Court Challans</option>
                  <option value="regular">Regular Challans</option>
                </select>
                <svg className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </label>

              <label className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => updateFilters({ sortBy: e.target.value })}
                  className={selectClass}
                >
                  <option value="newest">Sort by Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="amount-high">Amount: High to Low</option>
                  <option value="amount-low">Amount: Low to High</option>
                </select>
                <svg className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </label>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {tabs.map((tab) => {
              const active = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => updateFilters({ activeTab: tab.id })}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12px] font-semibold transition ${
                    active
                      ? 'bg-brand-red text-white shadow-sm'
                      : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {tab.dot && <span className={`h-1.5 w-1.5 rounded-full ${tab.dot}`} />}
                  {tab.label}
                  <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${active ? 'bg-white/20' : 'bg-slate-100 text-slate-500'}`}>
                    {tab.count}
                  </span>
                </button>
              )
            })}

            {pendingChallans.length > 0 && (
              <div className="ml-auto flex items-center gap-3 text-[12px]">
                <button
                  type="button"
                  onClick={onSelectAllPending}
                  disabled={allPendingSelected}
                  className="font-semibold text-brand-red hover:text-brand-red-dark disabled:text-slate-400"
                >
                  Select all pending
                </button>
                <button
                  type="button"
                  onClick={onDeselectAll}
                  disabled={selectedPending.length === 0}
                  className="font-medium text-slate-500 hover:text-slate-800 disabled:text-slate-300"
                >
                  Clear
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="w-full overflow-x-auto">
          <table className="w-full min-w-[780px] table-fixed text-left">
            <thead className="border-b border-slate-100 bg-slate-50/80">
              <tr className="border-b border-slate-100">
                <th className="w-9 px-2 py-3 md:px-3" />
                <th className="w-[24%] px-2 py-3 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  Challan / Date
                </th>
                <th className="w-[10%] px-2 py-3 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  Status
                </th>
                <th className="w-[24%] px-2 py-3 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  Violation
                </th>
                <th className="w-[14%] px-2 py-3 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  Court
                </th>
                <th className="w-[12%] px-2 py-3 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  Amount
                </th>
                <th className="w-[10%] px-2 py-3 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredChallans.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center">
                    <div className="mx-auto flex max-w-sm flex-col items-center">
                      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.6">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 18a7 7 0 100-14 7 7 0 000 14z" />
                        </svg>
                      </div>
                      <p className="text-[14px] font-semibold text-slate-700">No challans match your filters</p>
                      <p className="mt-1 text-[12px] text-slate-500">
                        Try clearing search or switching tabs.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredChallans.map((challan) => {
                  const isPaid = challan.status === 'PAID'
                  const isSelected = selectedChallans.includes(challan.id)
                  const violationTitle =
                    challan.offenceDetails && challan.offenceDetails !== 'N/A'
                      ? challan.offenceDetails
                      : challan.type || 'Traffic Violation'
                  const hasCourt = isCourtChallan(challan)

                  return (
                    <tr
                      key={`${challan.id}-${challan.challanNumber || ''}`}
                      className={`border-b border-slate-50 last:border-0 transition-colors ${
                        isSelected ? 'bg-red-50/35' : 'hover:bg-slate-50/70'
                      }`}
                    >
                      <td className="px-2 py-3.5 align-top md:px-3">
                        {!isPaid ? (
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => onToggleChallan(challan.id)}
                            className="mt-1 h-4 w-4 rounded border-slate-300 text-brand-red accent-brand-red focus:ring-brand-red"
                            aria-label={`Select challan ${challan.noticeId || challan.id}`}
                          />
                        ) : (
                          <span className="block w-4" />
                        )}
                      </td>

                      <td className="px-2 py-3.5 align-top">
                        <div className="flex items-start gap-2">
                          <ViolationIcon challan={challan} />
                          <div className="min-w-0 flex-1">
                            {(() => {
                              const challanId = challan.noticeId || challan.challanNumber || challan.id
                              const isCopied = copiedId === challanId
                              return (
                                <div className="flex items-start gap-1.5">
                                  <p className="min-w-0 break-all text-[13px] font-bold leading-snug text-slate-900">
                                    {challanId}
                                  </p>
                                  <button
                                    type="button"
                                    onClick={() => copyChallanId(challanId)}
                                    className={`mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md transition ${
                                      isCopied
                                        ? 'bg-emerald-50 text-emerald-600'
                                        : 'text-slate-400 hover:bg-slate-100 hover:text-slate-700'
                                    }`}
                                    title={isCopied ? 'Copied!' : 'Copy challan ID'}
                                    aria-label={isCopied ? 'Challan ID copied' : 'Copy challan ID'}
                                  >
                                    {isCopied ? (
                                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                      </svg>
                                    ) : (
                                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                      </svg>
                                    )}
                                  </button>
                                </div>
                              )
                            })()}
                            <p className="mt-0.5 text-[12px] font-medium text-slate-700">{challan.date}</p>
                            <p className="text-[11px] text-slate-400">{challan.time || '00:00'}</p>
                            <p className="mt-1 flex items-start gap-1 text-[11px] leading-snug text-slate-500">
                              <svg className="mt-0.5 h-3 w-3 shrink-0 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 21s7-4.438 7-11a7 7 0 10-14 0c0 6.562 7 11 7 11z" />
                                <circle cx="12" cy="10" r="2.25" />
                              </svg>
                              <span className="line-clamp-2 break-words">{challan.location || '—'}</span>
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-2 py-3.5 align-top">
                        <StatusBadge challan={challan} />
                      </td>

                      <td className="px-2 py-3.5 align-top">
                        <p className="text-[13px] font-semibold leading-snug text-slate-900 line-clamp-2">
                          {violationTitle}
                        </p>
                        {challan.section && (
                          <p className="mt-0.5 text-[11px] text-slate-400">Section {challan.section}</p>
                        )}
                        <button
                          type="button"
                          onClick={() =>
                            setDrawer({
                              type: 'violation',
                              challan,
                              title: 'Violation Details',
                              subtitle: challan.noticeId || challan.id,
                            })
                          }
                          className="mt-1 text-[11px] font-semibold text-brand-red hover:text-brand-red-dark"
                        >
                          View Details
                        </button>
                      </td>

                      <td className="px-2 py-3.5 align-top">
                        {hasCourt ? (
                          <div>
                            <p className="text-[12px] font-semibold text-slate-800">
                              {truncateText(challan.courtName || 'Traffic Court', 22)}
                            </p>
                            <button
                              type="button"
                              onClick={() =>
                                setDrawer({
                                  type: 'court',
                                  challan,
                                  title: 'Court Details',
                                  subtitle: challan.noticeId || challan.id,
                                })
                              }
                              className="mt-1 text-[11px] font-semibold text-brand-red hover:text-brand-red-dark"
                            >
                              View Details
                            </button>
                          </div>
                        ) : (
                          <span className="inline-flex rounded-full bg-slate-100 px-2 py-1 text-[10px] font-medium text-slate-500">
                            Not assigned
                          </span>
                        )}
                      </td>

                      <td className="px-2 py-3.5 align-top">
                        <p className="text-[14px] font-bold text-brand-red">{formatAmount(challan.amount)}</p>
                        <p className="mt-0.5 text-[10px] font-medium text-slate-400">
                          {challan.displayType || 'E-Challan'}
                        </p>
                      </td>

                      <td className="px-2 py-3.5 align-top">
                        {isPaid ? (
                          canOpenPortalPrint(challan, dataSource) ? (
                            <button
                              type="button"
                              onClick={() => {
                                setDrawer(null)
                                setReceiptVariant('receipt')
                                setReceiptChallanNumber(getChallanNumber(challan))
                              }}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-2.5 py-1.5 text-[11px] font-semibold text-white transition hover:bg-emerald-700"
                              title="View payment receipt"
                            >
                              View Receipt
                            </button>
                          ) : (
                            <button
                              type="button"
                              disabled
                              className="inline-flex cursor-not-allowed items-center gap-1.5 rounded-lg bg-emerald-100 px-2.5 py-1.5 text-[11px] font-semibold text-emerald-300"
                              title={portalPrintDisabledReason(challan, dataSource, 'View Receipt')}
                            >
                              View Receipt
                            </button>
                          )
                        ) : canOpenPortalPrint(challan, dataSource) ? (
                          <button
                            type="button"
                            onClick={() => {
                              setDrawer(null)
                              setReceiptVariant('pdf')
                              setReceiptChallanNumber(getChallanNumber(challan))
                            }}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-brand-red px-2.5 py-1.5 text-[11px] font-semibold text-white transition hover:bg-brand-red-dark"
                            title="View challan PDF"
                          >
                            View PDF
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled
                            className="inline-flex cursor-not-allowed items-center gap-1.5 rounded-lg bg-rose-100 px-2.5 py-1.5 text-[11px] font-semibold text-rose-300"
                            title={portalPrintDisabledReason(challan, dataSource, 'View PDF')}
                          >
                            View PDF
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <DetailDrawer
        open={Boolean(drawer)}
        onClose={() => setDrawer(null)}
        title={drawer?.title}
        subtitle={drawer?.subtitle}
      >
        {drawer?.challan && (
          <div>
            <DetailRow label="Challan No." value={drawer.challan.noticeId || drawer.challan.challanNumber || drawer.challan.id} />
            <DetailRow label="Date" value={`${drawer.challan.date || '—'} · ${drawer.challan.time || '00:00'}`} />
            <DetailRow label="Amount" value={formatAmount(drawer.challan.amount)} />
            <DetailRow
              label="Status"
              value={
                drawer.challan.status === 'PAID'
                  ? 'Paid'
                  : isCourtChallan(drawer.challan)
                    ? 'Court'
                    : 'Pending'
              }
            />
            {(drawer.type === 'violation' || drawer.type === 'full') && (
              <>
                <DetailRow
                  label="Violation"
                  value={
                    drawer.challan.offenceDetails && drawer.challan.offenceDetails !== 'N/A'
                      ? drawer.challan.offenceDetails
                      : drawer.challan.type || 'Traffic Violation'
                  }
                />
                <DetailRow label="Section" value={drawer.challan.section ? `Section ${drawer.challan.section}` : null} />
                <DetailRow label="Type" value={drawer.challan.displayType} />
                <DetailRow label="Location" value={drawer.challan.location} />
              </>
            )}
            {(drawer.type === 'court' || drawer.type === 'full') && (
              <>
                <DetailRow
                  label="Court Name"
                  value={drawer.challan.courtName || (isCourtChallan(drawer.challan) ? 'Traffic Court' : null)}
                />
                <DetailRow label="Judge" value={drawer.challan.judge || null} />
                <DetailRow label="Court Address" value={drawer.challan.courtAddress} />
                <DetailRow
                  label="Court Status"
                  value={
                    drawer.challan.sentToRegCourt
                      ? 'Sent to Regular Court'
                      : isCourtChallan(drawer.challan)
                        ? 'Court Challan'
                        : 'Not assigned'
                  }
                />
              </>
            )}
            {drawer.type === 'full' && (
              <DetailRow label="Location" value={drawer.challan.location} />
            )}
            <div className="mt-4 space-y-2 border-t border-slate-100 pt-4">
              {drawer.challan.status === 'PAID' ? (
                <button
                  type="button"
                  onClick={() => {
                    if (!canOpenPortalPrint(drawer.challan, dataSource)) return
                    setDrawer(null)
                    setReceiptVariant('receipt')
                    setReceiptChallanNumber(getChallanNumber(drawer.challan))
                  }}
                  disabled={!canOpenPortalPrint(drawer.challan, dataSource)}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-[14px] font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-100 disabled:text-emerald-300"
                  title={
                    canOpenPortalPrint(drawer.challan, dataSource)
                      ? 'View payment receipt'
                      : portalPrintDisabledReason(drawer.challan, dataSource, 'View Receipt')
                  }
                >
                  View Receipt
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      if (!canOpenPortalPrint(drawer.challan, dataSource)) return
                      setDrawer(null)
                      setReceiptVariant('pdf')
                      setReceiptChallanNumber(getChallanNumber(drawer.challan))
                    }}
                    disabled={!canOpenPortalPrint(drawer.challan, dataSource)}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-red px-4 py-2.5 text-[14px] font-semibold text-white transition hover:bg-brand-red-dark disabled:cursor-not-allowed disabled:bg-rose-100 disabled:text-rose-300"
                    title={
                      canOpenPortalPrint(drawer.challan, dataSource)
                        ? 'View challan PDF'
                        : portalPrintDisabledReason(drawer.challan, dataSource, 'View PDF')
                    }
                  >
                    View PDF
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDrawer(null)
                      onPay?.(drawer.challan.id)
                    }}
                    disabled={paymentLoading}
                    className="btn-primary w-full disabled:opacity-50"
                  >
                    Pay Now
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </DetailDrawer>

      <ReceiptViewer
        open={Boolean(receiptChallanNumber)}
        challanNumber={receiptChallanNumber}
        variant={receiptVariant}
        onClose={() => {
          setReceiptChallanNumber(null)
          setReceiptVariant('receipt')
        }}
      />
    </div>
  )
}
