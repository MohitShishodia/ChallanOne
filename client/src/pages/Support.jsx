import { useState } from 'react'

export default function Support() {
  const [activeTab, setActiveTab] = useState('contact')
  const [expandedFaq, setExpandedFaq] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    category: '',
    challanNumber: '',
    message: ''
  })
  const [formSubmitted, setFormSubmitted] = useState(false)
  const [ticketId, setTicketId] = useState('')

  const faqs = [
    {
      id: 1,
      question: 'How do I pay my traffic challan online?',
      answer: 'Simply enter your vehicle number on our homepage, view your pending challans, select the ones you want to pay, and complete the payment using UPI, Credit/Debit Card, or Net Banking. You will receive an instant receipt via email and SMS.'
    },
    {
      id: 2,
      question: 'What payment methods are accepted?',
      answer: 'We accept all major payment methods including UPI (Google Pay, PhonePe, Paytm), Credit Cards (Visa, Mastercard, Rupay), Debit Cards, and Net Banking from all major Indian banks.'
    },
    {
      id: 3,
      question: 'How long does it take for challan status to update after payment?',
      answer: 'Usually, the challan status updates within 2-4 hours after successful payment. In rare cases, it may take up to 24 hours. You can track your payment status in the "Track Challan" section.'
    },
    {
      id: 4,
      question: 'What if I paid but the challan still shows unpaid?',
      answer: 'Don\'t worry! This can happen due to bank processing delays. Please wait for 24 hours. If the issue persists, contact our support with your Transaction ID and we\'ll resolve it within 2 working days.'
    },
    {
      id: 5,
      question: 'Can I dispute a traffic challan?',
      answer: 'Yes, you can raise a dispute for incorrect challans. Go to the challan details page and click on "Raise Dispute". You\'ll need to provide supporting documents. Our team will review and respond within 5-7 working days.'
    },
    {
      id: 6,
      question: 'How do I download my payment receipt?',
      answer: 'After successful payment, you can download your receipt from the Payment Success page. You can also access all your receipts from your Profile > Payment History section anytime.'
    },
    {
      id: 7,
      question: 'Is my payment information secure?',
      answer: 'Absolutely! We use bank-grade 256-bit SSL encryption. We never store your card details. All payments are processed through RBI-approved payment gateways like Razorpay.'
    },
    {
      id: 8,
      question: 'What should I do if my payment failed but money was deducted?',
      answer: 'In case of failed transactions where money was deducted, the amount will be automatically refunded to your account within 5-7 working days. If not received, contact us with your Transaction ID.'
    }
  ]

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    // Simulate form submission
    const newTicketId = `TKT-${Date.now().toString().slice(-8)}`
    setTicketId(newTicketId)
    setFormSubmitted(true)
    setTimeout(() => {
      setFormData({
        name: '',
        email: '',
        phone: '',
        category: '',
        challanNumber: '',
        message: ''
      })
    }, 500)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=1920&q=80')] bg-cover bg-center opacity-10" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900/95 to-blue-900/90" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
          <div className="text-center max-w-3xl mx-auto">
            <span className="inline-flex items-center gap-2 bg-blue-500/20 text-blue-300 text-sm font-medium px-4 py-2 rounded-full mb-6 border border-blue-500/30">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              24/7 SUPPORT AVAILABLE
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              How Can We <span className="text-blue-400">Help You</span> Today?
            </h1>
            <p className="text-lg md:text-xl text-gray-300 mb-8">
              Our dedicated support team is here to assist you with any questions about your challans, payments, or disputes.
            </p>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-6 max-w-lg mx-auto mt-10">
              <div className="text-center">
                <p className="text-3xl font-bold text-white">&lt; 2hr</p>
                <p className="text-sm text-gray-400 mt-1">Avg Response</p>
              </div>
              <div className="text-center border-x border-gray-700">
                <p className="text-3xl font-bold text-white">98%</p>
                <p className="text-sm text-gray-400 mt-1">Resolution Rate</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-white">4.9★</p>
                <p className="text-sm text-gray-400 mt-1">User Rating</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Contact Options */}
      <section className="relative -mt-10 z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-3 gap-6">
          {/* Phone Support */}
          <div className="glass-card p-6 hover-lift cursor-pointer group">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">Call Us</h3>
                <p className="text-2xl font-bold text-blue-600">1800-XXX-XXXX</p>
                <p className="text-sm text-gray-500 mt-1">Toll-free • 24/7 Available</p>
              </div>
            </div>
          </div>

          {/* Email Support */}
          <div className="glass-card p-6 hover-lift cursor-pointer group">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">Email Us</h3>
                <p className="text-lg font-semibold text-indigo-600">support@challanone.in</p>
                <p className="text-sm text-gray-500 mt-1">Response within 2 hours</p>
              </div>
            </div>
          </div>

          {/* WhatsApp Support */}
          <div className="glass-card p-6 hover-lift cursor-pointer group">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">WhatsApp</h3>
                <p className="text-lg font-semibold text-green-600">+91 98XXX XXXXX</p>
                <p className="text-sm text-gray-500 mt-1">Quick chat support</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content - Tabs */}
      <section className="py-16 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Tab Buttons */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          <button
            onClick={() => setActiveTab('contact')}
            className={`px-6 py-3 rounded-xl font-semibold transition-all flex items-center gap-2 ${activeTab === 'contact'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
              : 'bg-white text-gray-600 border border-gray-200 hover:border-blue-300 hover:text-blue-600'
              }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            Contact Us
          </button>
          <button
            onClick={() => setActiveTab('faq')}
            className={`px-6 py-3 rounded-xl font-semibold transition-all flex items-center gap-2 ${activeTab === 'faq'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
              : 'bg-white text-gray-600 border border-gray-200 hover:border-blue-300 hover:text-blue-600'
              }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            FAQs
          </button>
          <button
            onClick={() => setActiveTab('track')}
            className={`px-6 py-3 rounded-xl font-semibold transition-all flex items-center gap-2 ${activeTab === 'track'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
              : 'bg-white text-gray-600 border border-gray-200 hover:border-blue-300 hover:text-blue-600'
              }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
            Track Ticket
          </button>
        </div>

        {/* Contact Form Tab */}
        {activeTab === 'contact' && (
          <div className="grid lg:grid-cols-5 gap-10">
            {/* Left Info */}
            <div className="lg:col-span-2 space-y-8">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-4">Get in Touch</h2>
                <p className="text-gray-600 leading-relaxed">
                  Fill out the form and our team will get back to you within 2 hours. We're here to help with any challan-related queries.
                </p>
              </div>

              {/* Support Categories */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">We can help you with:</h3>
                <div className="space-y-3">
                  {[
                    { icon: '💳', text: 'Payment Issues & Refunds' },
                    { icon: '📋', text: 'Challan Disputes & Appeals' },
                    { icon: '🔍', text: 'Vehicle & Challan Information' },
                    { icon: '📱', text: 'Technical Support' },
                    { icon: '📄', text: 'Receipt & Documentation' }
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                      <span className="text-xl">{item.icon}</span>
                      <span className="text-gray-700">{item.text}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Office Hours */}
              <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-100">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Office Hours
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Phone Support</span>
                    <span className="font-medium text-gray-900">24/7 Available</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Email Support</span>
                    <span className="font-medium text-gray-900">24/7 Available</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Live Chat</span>
                    <span className="font-medium text-gray-900">9 AM - 9 PM</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-3">
              {formSubmitted ? (
                <div className="glass-card p-12 text-center">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">Request Submitted!</h3>
                  <p className="text-gray-600 mb-6">
                    Your ticket has been created successfully. Our team will contact you within 2 hours.
                  </p>
                  <p className="text-sm text-gray-500 mb-6">
                    Ticket ID: <span className="font-mono font-semibold text-blue-600">{ticketId}</span>
                  </p>
                  <button
                    onClick={() => setFormSubmitted(false)}
                    className="btn-premium px-8 py-3 rounded-xl"
                  >
                    Submit Another Request
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="glass-card p-8 space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        placeholder="Enter your full name"
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Email Address *</label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        placeholder="your@email.com"
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number *</label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        required
                        placeholder="+91 98XXX XXXXX"
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Issue Category *</label>
                      <select
                        name="category"
                        value={formData.category}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
                      >
                        <option value="">Select category</option>
                        <option value="payment">Payment Issue</option>
                        <option value="refund">Refund Request</option>
                        <option value="dispute">Challan Dispute</option>
                        <option value="technical">Technical Problem</option>
                        <option value="receipt">Receipt/Documentation</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Challan/Transaction Number (Optional)</label>
                    <input
                      type="text"
                      name="challanNumber"
                      value={formData.challanNumber}
                      onChange={handleInputChange}
                      placeholder="Enter challan or transaction number if applicable"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Describe Your Issue *</label>
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleInputChange}
                      required
                      rows={5}
                      placeholder="Please describe your issue in detail. Include any relevant dates, amounts, or reference numbers..."
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full btn-premium py-4 rounded-xl text-lg flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                    Submit Support Request
                  </button>
                </form>
              )}
            </div>
          </div>
        )}

        {/* FAQ Tab */}
        {activeTab === 'faq' && (
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
              <p className="text-gray-600">Find quick answers to common questions about our services</p>
            </div>

            <div className="space-y-4">
              {faqs.map((faq) => (
                <div
                  key={faq.id}
                  className={`glass-card overflow-hidden transition-all ${expandedFaq === faq.id ? 'ring-2 ring-blue-500' : ''
                    }`}
                >
                  <button
                    onClick={() => setExpandedFaq(expandedFaq === faq.id ? null : faq.id)}
                    className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
                  >
                    <span className="font-semibold text-gray-900 pr-4">{faq.question}</span>
                    <svg
                      className={`w-5 h-5 text-blue-600 flex-shrink-0 transition-transform ${expandedFaq === faq.id ? 'rotate-180' : ''
                        }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {expandedFaq === faq.id && (
                    <div className="px-6 pb-5 text-gray-600 leading-relaxed border-t border-gray-100 pt-4">
                      {faq.answer}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-12 text-center p-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-100">
              <h3 className="text-xl font-bold text-gray-900 mb-2">Still have questions?</h3>
              <p className="text-gray-600 mb-6">Can't find the answer you're looking for? Please contact our friendly team.</p>
              <button
                onClick={() => setActiveTab('contact')}
                className="btn-premium px-8 py-3 rounded-xl"
              >
                Contact Support
              </button>
            </div>
          </div>
        )}

        {/* Track Ticket Tab */}
        {activeTab === 'track' && (
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Track Your Support Ticket</h2>
              <p className="text-gray-600">Enter your ticket ID to check the status of your support request</p>
            </div>

            <div className="glass-card p-8">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Ticket ID</label>
                  <input
                    type="text"
                    placeholder="Enter your ticket ID (e.g., TKT-12345678)"
                    className="w-full px-4 py-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-center text-lg font-mono"
                  />
                </div>

                <button className="w-full btn-premium py-4 rounded-xl text-lg flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  Track Ticket
                </button>
              </div>

              <div className="mt-8 pt-8 border-t border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-4 text-center">Ticket Status Legend</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 bg-yellow-400 rounded-full"></span>
                    <span className="text-gray-600">Open - Under Review</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
                    <span className="text-gray-600">In Progress</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 bg-orange-500 rounded-full"></span>
                    <span className="text-gray-600">Awaiting Response</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                    <span className="text-gray-600">Resolved</span>
                  </div>
                </div>
              </div>
            </div>

            <p className="text-center text-sm text-gray-500 mt-6">
              Lost your ticket ID? Check your email for the confirmation we sent when you submitted your request.
            </p>
          </div>
        )}
      </section>

      {/* Trust Banner */}
      <section className="py-12 bg-gradient-to-r from-blue-600 to-indigo-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Government Authorized Partner</h3>
                <p className="text-blue-100">All transactions are 100% secure and officially recognized</p>
              </div>
            </div>
            <div className="flex items-center gap-6 text-white">
              <div className="text-center">
                <p className="text-2xl font-bold">2M+</p>
                <p className="text-sm text-blue-100">Happy Users</p>
              </div>
              <div className="h-10 w-px bg-white/20"></div>
              <div className="text-center">
                <p className="text-2xl font-bold">₹50Cr+</p>
                <p className="text-sm text-blue-100">Processed</p>
              </div>
              <div className="h-10 w-px bg-white/20"></div>
              <div className="text-center">
                <p className="text-2xl font-bold">50+</p>
                <p className="text-sm text-blue-100">Cities</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
