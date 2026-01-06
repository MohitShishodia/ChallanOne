import { Link, useLocation, Navigate } from 'react-router-dom'
import { useRef } from 'react'

export default function PaymentSuccess() {
  const location = useLocation()
  const receiptRef = useRef(null)
  
  // Get receipt data from navigation state
  const { receipt, vehicleNumber } = location.state || {}
  
  // Redirect if no receipt data
  if (!receipt) {
    return <Navigate to="/" replace />
  }

  const formatDate = (isoString) => {
    const date = new Date(isoString)
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleDownload = () => {
    // Create receipt HTML for printing/saving as PDF
    const receiptHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Payment Receipt - ${receipt.id}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; background: #f9fafb; }
          .receipt { max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
          .header { text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #e5e7eb; }
          .logo { font-size: 24px; font-weight: 700; color: #2563eb; margin-bottom: 8px; }
          .success-icon { width: 60px; height: 60px; background: #dcfce7; border-radius: 50%; margin: 0 auto 15px; display: flex; align-items: center; justify-content: center; }
          .success-icon svg { width: 30px; height: 30px; color: #16a34a; }
          h1 { font-size: 22px; color: #111827; margin-bottom: 5px; }
          .subtitle { color: #6b7280; font-size: 14px; }
          .section { margin-bottom: 25px; }
          .section-title { font-size: 12px; text-transform: uppercase; color: #6b7280; margin-bottom: 12px; font-weight: 600; letter-spacing: 0.5px; }
          .row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f3f4f6; }
          .row:last-child { border-bottom: none; }
          .label { color: #6b7280; font-size: 14px; }
          .value { color: #111827; font-weight: 500; font-size: 14px; }
          .challan-item { background: #f9fafb; padding: 12px; border-radius: 8px; margin-bottom: 8px; }
          .challan-id { font-weight: 600; color: #111827; }
          .challan-desc { font-size: 13px; color: #6b7280; margin-top: 4px; }
          .challan-amount { float: right; font-weight: 600; color: #111827; }
          .total-section { background: #eff6ff; padding: 20px; border-radius: 8px; margin-top: 20px; }
          .total-row { display: flex; justify-content: space-between; align-items: center; }
          .total-label { font-weight: 600; color: #111827; font-size: 16px; }
          .total-value { font-size: 24px; font-weight: 700; color: #2563eb; }
          .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 2px solid #e5e7eb; }
          .footer-text { color: #6b7280; font-size: 12px; }
          .paid-badge { display: inline-block; background: #dcfce7; color: #16a34a; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }
          @media print { body { padding: 0; background: white; } .receipt { box-shadow: none; } }
        </style>
      </head>
      <body>
        <div class="receipt">
          <div class="header">
            <div class="logo">E-Challan</div>
            <div class="success-icon">
              <svg fill="none" stroke="#16a34a" stroke-width="3" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"></path></svg>
            </div>
            <h1>Payment Successful</h1>
            <p class="subtitle">Your challan payment has been processed successfully</p>
          </div>
          
          <div class="section">
            <div class="section-title">Transaction Details</div>
            <div class="row">
              <span class="label">Receipt ID</span>
              <span class="value">${receipt.id}</span>
            </div>
            <div class="row">
              <span class="label">Payment ID</span>
              <span class="value">${receipt.razorpayPaymentId}</span>
            </div>
            <div class="row">
              <span class="label">Date & Time</span>
              <span class="value">${formatDate(receipt.paidAt)}</span>
            </div>
            <div class="row">
              <span class="label">Vehicle Number</span>
              <span class="value">${receipt.vehicleNumber}</span>
            </div>
            <div class="row">
              <span class="label">Status</span>
              <span class="paid-badge">PAID</span>
            </div>
          </div>
          
          <div class="section">
            <div class="section-title">Challans Paid (${receipt.challans?.length || 0})</div>
            ${receipt.challans?.map(c => `
              <div class="challan-item">
                <span class="challan-amount">₹${c.amount?.toLocaleString() || 0}</span>
                <div class="challan-id">#${c.id}</div>
                <div class="challan-desc">${c.description || 'Traffic Violation'}</div>
              </div>
            `).join('') || ''}
          </div>
          
          <div class="section">
            <div class="section-title">Payment Summary</div>
            <div class="row">
              <span class="label">Subtotal</span>
              <span class="value">₹${receipt.subtotal?.toLocaleString() || 0}</span>
            </div>
            <div class="row">
              <span class="label">Convenience Fee</span>
              <span class="value">₹${receipt.convenienceFee?.toFixed(2) || '0.00'}</span>
            </div>
          </div>
          
          <div class="total-section">
            <div class="total-row">
              <span class="total-label">Total Amount Paid</span>
              <span class="total-value">₹${receipt.totalAmount?.toLocaleString() || 0}</span>
            </div>
          </div>
          
          <div class="footer">
            <p class="footer-text">This is a computer-generated receipt and does not require a signature.</p>
            <p class="footer-text" style="margin-top: 8px;">For any queries, contact support@echallan.in</p>
          </div>
        </div>
      </body>
      </html>
    `
    
    // Open in new window for printing/saving as PDF
    const printWindow = window.open('', '_blank')
    printWindow.document.write(receiptHTML)
    printWindow.document.close()
    printWindow.focus()
    
    // Trigger print dialog after content loads
    setTimeout(() => {
      printWindow.print()
    }, 250)
  }

  const handleEmail = () => {
    const subject = encodeURIComponent(`E-Challan Payment Receipt - ${receipt.id}`)
    const body = encodeURIComponent(`
Payment Receipt

Receipt ID: ${receipt.id}
Payment ID: ${receipt.razorpayPaymentId}
Vehicle Number: ${receipt.vehicleNumber}
Date: ${formatDate(receipt.paidAt)}
Amount Paid: ₹${receipt.totalAmount?.toLocaleString()}

Thank you for your payment!
    `)
    window.open(`mailto:?subject=${subject}&body=${body}`)
  }

  const handlePrint = () => {
    handleDownload()
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4">
        {/* Success Icon */}
        <div className="text-center mb-8">
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-12 h-12 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
          <p className="text-gray-600">
            Your payment for <span className="font-semibold text-gray-900">{receipt.challans?.length || 0} challan(s)</span> has been processed successfully.
          </p>
        </div>

        {/* Transaction Summary Card */}
        <div ref={receiptRef} className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Transaction Summary</h2>
            <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              Paid
            </span>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Receipt ID</span>
              <span className="text-gray-900 font-medium flex items-center gap-2">
                {receipt.id}
                <button 
                  onClick={() => navigator.clipboard.writeText(receipt.id)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
              </span>
            </div>
            
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Payment ID</span>
              <span className="text-gray-900 font-mono text-xs">{receipt.razorpayPaymentId}</span>
            </div>
            
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Vehicle Number</span>
              <span className="text-gray-900 font-semibold">{receipt.vehicleNumber}</span>
            </div>
            
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Challans Paid</span>
              <span className="text-gray-900">{receipt.challans?.length || 0}</span>
            </div>
            
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Date & Time</span>
              <span className="text-gray-900">{formatDate(receipt.paidAt)}</span>
            </div>

            <div className="border-t pt-4 mt-4">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-500">Subtotal</span>
                <span className="text-gray-900">₹{receipt.subtotal?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-500">Convenience Fee</span>
                <span className="text-gray-900">₹{receipt.convenienceFee?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="font-semibold text-gray-900">Total Amount Paid</span>
                <span className="text-2xl font-bold text-green-600">₹{receipt.totalAmount?.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mb-6">
          <button
            onClick={handleDownload}
            className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download Receipt
          </button>
          <button
            onClick={handleEmail}
            className="flex-1 border border-gray-300 py-3 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Email Receipt
          </button>
          <button
            onClick={handlePrint}
            className="px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
          </button>
        </div>

        {/* Back to Dashboard */}
        <div className="text-center">
          <Link
            to="/"
            className="text-blue-600 font-medium hover:text-blue-700 inline-flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Dashboard
          </Link>
        </div>

        {/* Support Notice */}
        <p className="text-center text-sm text-gray-500 mt-8">
          Need help with this transaction?{' '}
          <Link to="/support" className="text-blue-600 hover:underline">Contact Support</Link>
        </p>

        <p className="text-center text-xs text-gray-400 mt-4 flex items-center justify-center gap-1">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
          </svg>
          Secured by Razorpay
        </p>
      </div>
    </div>
  )
}

