import { useState } from 'react'
import { calculatePaymentTotal } from '../utils/challanUtils'
import { WHATSAPP, whatsappUrl } from '../constants/brand'

function formatAmount(amount) {
  return `₹${(amount || 0).toLocaleString('en-IN')}`
}

const PAYMENT_LOGOS = [
  { name: 'UPI', label: 'UPI' },
  { name: 'VISA', label: 'VISA' },
  { name: 'MC', label: 'Mastercard' },
  { name: 'RuPay', label: 'RuPay' },
  { name: 'NB', label: 'Net Banking' },
]

export default function PaymentSummaryPanel({
  selectedChallans = [],
  paymentLoading = false,
  onPay,
}) {
  const [coupon, setCoupon] = useState('')
  const [couponApplied, setCouponApplied] = useState(null)
  const [couponError, setCouponError] = useState('')

  const { subtotal, convenienceFee, total } = calculatePaymentTotal(selectedChallans)
  const discount = couponApplied?.amount || 0
  const savings = selectedChallans.reduce((sum, c) => sum + (c.courtFee || 0), 0)
  const payable = Math.max(0, total - discount)

  const applyCoupon = () => {
    const code = coupon.trim().toUpperCase()
    if (!code) {
      setCouponError('Enter a coupon code')
      setCouponApplied(null)
      return
    }
    setCouponError('This coupon is not valid')
    setCouponApplied(null)
  }

  return (
    <div className="space-y-3 lg:sticky lg:top-[84px]">
      <aside className="surface-card overflow-hidden">
        <div className="border-b border-slate-100 px-4 py-3.5">
          <h3 className="text-[15px] font-bold text-slate-900">Payment Summary</h3>
          <p className="mt-0.5 text-[11px] text-slate-500">Review and pay selected challans</p>
        </div>

        <div className="space-y-3 px-4 py-3.5">
          <div className="flex items-center justify-between text-[13px]">
            <span className="text-slate-500">Selected Challans</span>
            <span className="font-semibold text-slate-900">{selectedChallans.length}</span>
          </div>
          <div className="flex items-center justify-between text-[13px]">
            <span className="text-slate-500">Challan Amount</span>
            <span className="font-bold text-slate-900">{formatAmount(subtotal)}</span>
          </div>
          {savings > 0 && (
            <div className="flex items-center justify-between text-[13px]">
              <span className="text-emerald-600">You Save (Court Fine Waived)</span>
              <span className="font-semibold text-emerald-600">− {formatAmount(savings)}</span>
            </div>
          )}
          <div className="flex items-center justify-between text-[13px]">
            <span className="text-slate-500">Convenience Fee</span>
            <span className="font-medium text-slate-700">{formatAmount(convenienceFee)}</span>
          </div>
          {discount > 0 && (
            <div className="flex items-center justify-between text-[13px]">
              <span className="text-emerald-600">Discount</span>
              <span className="font-semibold text-emerald-600">− {formatAmount(discount)}</span>
            </div>
          )}

          <div className="border-t border-dashed border-slate-200 pt-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[13px] font-semibold text-slate-700">Total Payable</span>
              <span className="text-[22px] font-extrabold tracking-tight text-brand-red">
                {formatAmount(selectedChallans.length ? payable : 0)}
              </span>
            </div>
          </div>
        </div>

        <div className="px-4 pb-3.5">
          <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            Coupon Code
          </label>
          <div className="flex overflow-hidden rounded-xl border border-slate-200 bg-white focus-within:border-brand-red focus-within:ring-4 focus-within:ring-red-50">
            <input
              type="text"
              value={coupon}
              onChange={(e) => {
                setCoupon(e.target.value)
                setCouponError('')
              }}
              placeholder="Apply Coupon"
              className="min-w-0 flex-1 bg-transparent px-3 py-2.5 text-[13px] outline-none placeholder:text-slate-400"
            />
            <button
              type="button"
              onClick={applyCoupon}
              className="shrink-0 border-l border-slate-200 px-3 text-[12px] font-bold text-brand-red transition hover:bg-red-50"
            >
              Apply
            </button>
          </div>
          {couponError && <p className="mt-1.5 text-[11px] text-rose-500">{couponError}</p>}
        </div>

        <div className="px-4 pb-4">
          <button
            type="button"
            onClick={() => onPay?.()}
            disabled={paymentLoading || selectedChallans.length === 0}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-red px-4 py-3.5 text-[14px] font-bold text-white shadow-[0_12px_28px_-12px_rgba(220,38,38,0.65)] transition hover:bg-brand-red-dark disabled:cursor-not-allowed disabled:opacity-50"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            {paymentLoading ? 'Processing...' : 'Pay Securely'}
          </button>

          <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5">
            {PAYMENT_LOGOS.map((logo) => (
              <span
                key={logo.name}
                className="inline-flex h-7 min-w-[40px] items-center justify-center rounded-md border border-slate-200 bg-slate-50 px-1.5 text-[9px] font-bold tracking-wide text-slate-600"
                title={logo.label}
              >
                {logo.name}
              </span>
            ))}
          </div>
        </div>

        <div className="border-t border-slate-100 bg-slate-50/80 px-4 py-3.5">
          <p className="text-[12px] font-bold text-slate-800">Why pay with Challan One?</p>
          <ul className="mt-2 space-y-1.5">
            {['Instant Challan Confirmation', '100% Secure & Trusted', 'Your Data is Safe with Us'].map((item) => (
              <li key={item} className="flex items-center gap-1.5 text-[11px] text-slate-600">
                <svg className="h-3.5 w-3.5 shrink-0 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </aside>

      <aside className="surface-card overflow-hidden p-4">
        <p className="text-[13px] font-bold text-slate-900">Need Help?</p>
        <p className="mt-0.5 text-[11px] text-slate-500">Our support team is available 24/7</p>
        <div className="mt-3 space-y-2">
          <a
            href={whatsappUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5 text-[12px] font-semibold text-slate-700 transition hover:bg-emerald-50 hover:text-emerald-700"
          >
            <svg className="h-4 w-4 text-emerald-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
              <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.116 1.523 5.85L.057 23.443a.75.75 0 00.92.92l5.593-1.466A11.95 11.95 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75a9.72 9.72 0 01-4.94-1.34l-.353-.21-3.65.957.974-3.56-.23-.366A9.72 9.72 0 012.25 12C2.25 6.615 6.615 2.25 12 2.25S21.75 6.615 21.75 12 17.385 21.75 12 21.75z" />
            </svg>
            WhatsApp Support
          </a>
          <a
            href="mailto:support@challanone.com"
            className="flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5 text-[12px] font-semibold text-slate-700 transition hover:bg-red-50 hover:text-brand-red"
          >
            <svg className="h-4 w-4 text-brand-red" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Email Support
          </a>
          <a
            href={`tel:+${WHATSAPP.number}`}
            className="flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5 text-[12px] font-semibold text-slate-700 transition hover:bg-sky-50 hover:text-sky-700"
          >
            <svg className="h-4 w-4 text-sky-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            {WHATSAPP.display}
          </a>
        </div>
      </aside>
    </div>
  )
}
