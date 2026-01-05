import { Link } from 'react-router-dom'

export default function PaymentSuccess() {
  // Mock transaction data - will be populated from payment gateway response
  const transaction = {
    id: 'TXN-12345678',
    vehicleNumber: 'KA-01-MJ-2023',
    challanNumber: 'CH-98212',
    paymentMethod: 'Credit Card (**** 1234)',
    dateTime: 'Oct 24, 2023, 10:45 AM',
    amount: 1500
  }

  const handleDownload = () => {
    // TODO: Implement receipt download after payment integration
    alert('Receipt download will be available after payment integration')
  }

  const handleEmail = () => {
    // TODO: Implement email receipt after payment integration
    alert('Email receipt will be available after payment integration')
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-xl mx-auto px-4">
        {/* Success Icon */}
        <div className="text-center mb-8">
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-12 h-12 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
          <p className="text-gray-600">
            Your payment for Challan <span className="font-semibold text-gray-900">#{transaction.challanNumber}</span> has been processed successfully.
          </p>
        </div>

        {/* Transaction Summary Card */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Transaction Summary</h2>
            <span className="badge-paid flex items-center gap-1">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              Paid
            </span>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Transaction ID</span>
              <span className="text-gray-900 font-medium flex items-center gap-2">
                #{transaction.id}
                <button 
                  onClick={() => navigator.clipboard.writeText(transaction.id)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
              </span>
            </div>
            
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Vehicle Number</span>
              <span className="text-gray-900">{transaction.vehicleNumber}</span>
            </div>
            
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Challan Number</span>
              <span className="text-gray-900">#{transaction.challanNumber}</span>
            </div>
            
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Payment Method</span>
              <span className="text-gray-900 flex items-center gap-2">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                {transaction.paymentMethod}
              </span>
            </div>
            
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Date & Time</span>
              <span className="text-gray-900">{transaction.dateTime}</span>
            </div>

            <div className="border-t pt-4 mt-4 flex justify-between items-center">
              <span className="font-semibold text-gray-900">Total Amount Paid</span>
              <span className="text-2xl font-bold text-green-600">₹{transaction.amount.toLocaleString()}</span>
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
          Secured by SecurePay Gateway
        </p>
      </div>
    </div>
  )
}
