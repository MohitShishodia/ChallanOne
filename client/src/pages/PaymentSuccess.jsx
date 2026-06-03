import { Link, useLocation, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import PageHeader from '../components/PageHeader'
import PostPaymentSteps from '../components/PostPaymentSteps'
import { saveUserPayment } from '../utils/userStorage'

export default function PaymentSuccess() {
  const location = useLocation()
  const { receipt } = location.state || {}

  useEffect(() => {
    if (receipt) saveUserPayment(receipt)
  }, [receipt])

  if (!receipt) return <Navigate to="/" replace />

  const formatDate = (isoString) => {
    const date = new Date(isoString)
    return date.toLocaleDateString('en-IN', {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    })
  }

  const orderId = receipt.id?.replace(/^RCPT-/, '').slice(-7) || receipt.id

  const handleDownload = () => {
    const receiptHTML = `
      <!DOCTYPE html><html><head><title>Payment Receipt - ${receipt.id}</title>
      <style>
        *{margin:0;padding:0;box-sizing:border-box;}
        body{font-family:'Inter','Segoe UI',Arial,sans-serif;padding:32px;background:#f1f5f9;color:#0f172a;}
        .receipt{max-width:560px;margin:0 auto;background:#fff;padding:32px;border-radius:16px;box-shadow:0 8px 24px -8px rgba(15,23,42,0.1);}
        .header{text-align:center;margin-bottom:24px;padding-bottom:18px;border-bottom:1px solid #e2e8f0;}
        .logo{font-size:20px;font-weight:700;color:#dc2626;margin-bottom:8px;}
        .icon{width:54px;height:54px;background:#dcfce7;border-radius:50%;margin:0 auto 12px;display:flex;align-items:center;justify-content:center;}
        h1{font-size:20px;margin-bottom:4px;}
        .row{display:flex;justify-content:space-between;padding:9px 0;border-bottom:1px solid #f1f5f9;font-size:13.5px;}
        .label{color:#64748b}.value{color:#0f172a;font-weight:600;}
        .total{background:#fef2f2;padding:18px;border-radius:12px;margin-top:18px;display:flex;justify-content:space-between;align-items:center;}
        .total-value{font-size:22px;font-weight:700;color:#dc2626;}
        .badge{display:inline-block;background:#dcfce7;color:#16a34a;padding:3px 10px;border-radius:9999px;font-size:11px;font-weight:700;}
        @media print{body{padding:0;background:#fff;}.receipt{box-shadow:none;}}
      </style></head><body>
        <div class="receipt">
          <div class="header">
            <div class="logo">Challan One</div>
            <div class="icon"><svg width="26" fill="none" stroke="#16a34a" stroke-width="3" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg></div>
            <h1>Payment Successful</h1>
            <p style="font-size:13px;color:#64748b;">Our agent will call you for OTP verification</p>
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
      <PageHeader title="Order Summary" />

      <div className="screen-content">
        <div className="container-main py-8 md:py-12 space-y-8">
          <PostPaymentSteps orderId={orderId} />

          <div className="surface-card p-5 md:p-6 max-w-2xl mx-auto animate-fade-up">
            <h3 className="text-[16px] font-bold text-slate-900">Payment Summary</h3>
            <p className="text-[13px] text-slate-500 mt-0.5">
              {receipt.challans?.length || 0} challan(s) · {receipt.vehicleNumber}
            </p>
            <p className="mt-3 text-[28px] font-bold text-brand-red">₹ {receipt.totalAmount?.toLocaleString()}</p>
            <div className="mt-4 divide-y divide-slate-100 text-[13px]">
              <Row label="Receipt ID" value={receipt.id} />
              <Row label="Date" value={formatDate(receipt.paidAt)} />
              <Row label="Status" value={<span className="pill pill-success">PAID</span>} />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 max-w-2xl mx-auto">
            <button onClick={handleDownload} className="btn-primary flex-1">
              Download Receipt
            </button>
            <Link to="/profile" className="btn-secondary flex-1">View in Profile</Link>
            <Link to="/" className="btn-ghost flex-1 justify-center">Home</Link>
          </div>
        </div>
      </div>
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between py-2.5">
      <span className="text-slate-500">{label}</span>
      <span className="font-semibold text-slate-900">{value}</span>
    </div>
  )
}
