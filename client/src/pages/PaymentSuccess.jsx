import { Link, useLocation, Navigate } from 'react-router-dom'
import PageHeader from '../components/PageHeader'

export default function PaymentSuccess() {
  const location = useLocation()
  const { receipt } = location.state || {}

  if (!receipt) return <Navigate to="/" replace />

  const formatDate = (isoString) => {
    const date = new Date(isoString)
    return date.toLocaleDateString('en-IN', {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    })
  }

  const handleDownload = () => {
    const receiptHTML = `
      <!DOCTYPE html><html><head><title>Payment Receipt - ${receipt.id}</title>
      <style>
        *{margin:0;padding:0;box-sizing:border-box;}
        body{font-family:'Inter','Segoe UI',Arial,sans-serif;padding:32px;background:#f1f5f9;color:#0f172a;}
        .receipt{max-width:560px;margin:0 auto;background:#fff;padding:32px;border-radius:16px;box-shadow:0 8px 24px -8px rgba(15,23,42,0.1);}
        .header{text-align:center;margin-bottom:24px;padding-bottom:18px;border-bottom:1px solid #e2e8f0;}
        .logo{font-size:20px;font-weight:700;color:#2563eb;margin-bottom:8px;}
        .icon{width:54px;height:54px;background:#dcfce7;border-radius:50%;margin:0 auto 12px;display:flex;align-items:center;justify-content:center;}
        h1{font-size:20px;margin-bottom:4px;}
        .row{display:flex;justify-content:space-between;padding:9px 0;border-bottom:1px solid #f1f5f9;font-size:13.5px;}
        .label{color:#64748b}.value{color:#0f172a;font-weight:600;}
        .total{background:#eff6ff;padding:18px;border-radius:12px;margin-top:18px;display:flex;justify-content:space-between;align-items:center;}
        .total-value{font-size:22px;font-weight:700;color:#2563eb;}
        .badge{display:inline-block;background:#dcfce7;color:#16a34a;padding:3px 10px;border-radius:9999px;font-size:11px;font-weight:700;}
        @media print{body{padding:0;background:#fff;}.receipt{box-shadow:none;}}
      </style></head><body>
        <div class="receipt">
          <div class="header">
            <div class="logo">ChallanOne</div>
            <div class="icon"><svg width="26" fill="none" stroke="#16a34a" stroke-width="3" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg></div>
            <h1>Payment Successful</h1>
            <p style="font-size:13px;color:#64748b;">Your challan payment has been processed</p>
          </div>
          <div class="row"><span class="label">Receipt ID</span><span class="value">${receipt.id}</span></div>
          <div class="row"><span class="label">Payment ID</span><span class="value">${receipt.razorpayPaymentId}</span></div>
          <div class="row"><span class="label">Vehicle Number</span><span class="value">${receipt.vehicleNumber}</span></div>
          <div class="row"><span class="label">Date</span><span class="value">${formatDate(receipt.paidAt)}</span></div>
          <div class="row"><span class="label">Status</span><span class="badge">PAID</span></div>
          <div class="total"><span class="value">Total Paid</span><span class="total-value">₹${receipt.totalAmount?.toLocaleString()}</span></div>
        </div>
      </body></html>`
    const w = window.open('', '_blank')
    w.document.write(receiptHTML); w.document.close(); w.focus()
    setTimeout(() => w.print(), 250)
  }

  return (
    <div className="screen">
      <PageHeader title="Payment Receipt" />

      <div className="screen-content">
        <div className="container-narrow py-8 md:py-12 space-y-6">
          <div className="surface-card p-6 md:p-8 text-center animate-fade-up">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <svg className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="mt-3 text-[22px] font-bold text-slate-900">Payment Successful</h1>
            <p className="mt-1 text-[14px] text-slate-500">
              {receipt.challans?.length || 0} challan(s) cleared for {receipt.vehicleNumber}
            </p>
            <p className="mt-4 text-[13px] font-medium text-slate-500">Total Paid</p>
            <p className="text-[32px] font-bold text-blue-600">₹ {receipt.totalAmount?.toLocaleString()}</p>
          </div>

          <div className="surface-card p-5 md:p-6 animate-fade-up">
            <h3 className="h-section">Transaction Details</h3>
            <div className="mt-3 divide-y divide-slate-100">
              <Row label="Receipt ID" value={receipt.id} />
              <Row label="Payment ID" value={receipt.razorpayPaymentId} mono />
              <Row label="Vehicle" value={receipt.vehicleNumber} />
              <Row label="Date" value={formatDate(receipt.paidAt)} />
              <Row label="Status" value={<span className="pill pill-success">PAID</span>} />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button onClick={handleDownload} className="btn-primary flex-1">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download Receipt
            </button>
            <Link to="/" className="btn-secondary flex-1">Back to Home</Link>
          </div>

          <p className="text-center text-[12px] text-slate-400 flex items-center justify-center gap-1">
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" clipRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" />
            </svg>
            Secured by Razorpay
          </p>
        </div>
      </div>
    </div>
  )
}

function Row({ label, value, mono }) {
  return (
    <div className="flex items-center justify-between py-3">
      <span className="text-[12.5px] text-slate-500">{label}</span>
      <span className={`text-[13.5px] font-semibold text-slate-900 max-w-[60%] truncate text-right ${mono ? 'font-mono text-[12px]' : ''}`}>
        {value}
      </span>
    </div>
  )
}
