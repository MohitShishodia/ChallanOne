import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import AnimatedCounter from '../components/ui/AnimatedCounter'

export default function Home() {
  const [vehicleType, setVehicleType] = useState('')
  const [vehicleNumber, setVehicleNumber] = useState('')
  const [currentTestimonial, setCurrentTestimonial] = useState(0)
  const navigate = useNavigate()

  const testimonials = [
    {
      id: 1,
      name: 'Ravi Kumar',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=50&h=50&fit=crop&crop=face',
      rating: 5,
      date: '2 days ago',
      comment: 'I was worried about my pending challans, but this site made it so easy to clear them instantly. The interface is clean and very secure!',
      likes: 12
    },
    {
      id: 2,
      name: 'Anita Desai',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=50&h=50&fit=crop&crop=face',
      rating: 5,
      date: '1 week ago',
      comment: 'Excellent support team. They helped me resolve a wrong challan issue within 24 hours. I really appreciate the quick turnaround.',
      likes: 45,
      dislikes: 1
    },
    {
      id: 3,
      name: 'Sandeep Singh',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=50&h=50&fit=crop&crop=face',
      rating: 4,
      date: '2 weeks ago',
      comment: 'Good experience overall. The payment process is smooth and the receipt generation is instant. Tracking status is very reliable.',
      likes: 8
    }
  ]

  const nextTestimonial = () => {
    setCurrentTestimonial((prev) => (prev + 1) % testimonials.length)
  }

  const prevTestimonial = () => {
    setCurrentTestimonial((prev) => (prev - 1 + testimonials.length) % testimonials.length)
  }

  const renderStars = (rating) => {
    return [...Array(5)].map((_, i) => (
      <svg
        key={i}
        className={`w-4 h-4 ${i < rating ? 'text-yellow-400' : 'text-gray-300'}`}
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    ))
  }

  const handleSearch = (e) => {
    e.preventDefault()
    if (vehicleNumber.trim()) {
      navigate(`/track-challan?vehicle=${encodeURIComponent(vehicleNumber.trim())}`)
    }
  }

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden">
        {/* Background Image Overlay */}
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-30"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=1920&q=80')`
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900/90 to-slate-900/70" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              Pay Your Traffic<br />
              <span className="text-blue-400">Challans Instantly</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-300 mb-10">
              Enter your vehicle details below to check pending fines securely and easily.
            </p>

            {/* Search Form - Glassmorphism Card */}
            <form onSubmit={handleSearch} className="glass-card p-6 md:p-8 max-w-3xl mx-auto">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <label className="block text-left text-sm font-medium text-gray-600 mb-2">
                    Vehicle Type
                  </label>
                  <select
                    value={vehicleType}
                    onChange={(e) => setVehicleType(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Type</option>
                    <option value="car">Car</option>
                    <option value="bike">Bike</option>
                    <option value="auto">Auto</option>
                    <option value="commercial">Commercial</option>
                  </select>
                </div>
                
                <div className="flex-[2]">
                  <label className="block text-left text-sm font-medium text-gray-600 mb-2">
                    Vehicle Number
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </span>
                    <input
                      type="text"
                      placeholder="EX: MH-02-AB-1234"
                      value={vehicleNumber}
                      onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
                      className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase"
                    />
                  </div>
                </div>
                
                <div className="md:self-end">
                  <button
                    type="submit"
                    className="btn-premium w-full md:w-auto px-8 py-3.5 rounded-xl flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    Get Details
                  </button>
                </div>
              </div>
              
              <p className="text-xs text-gray-500 mt-4 flex items-center justify-center gap-1">
                <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                100% Secure Official Government Data Access
              </p>
            </form>
          </div>
        </div>
      </section>

      {/* Trusted Platform Section */}
      <section className="section-spacing bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Live Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-20">
            <div className="stats-card">
              <p className="text-3xl md:text-4xl font-bold text-blue-600">
                <AnimatedCounter end={25000} suffix="+" duration={2500} />
              </p>
              <p className="text-base text-gray-600 mt-3 font-medium">Challans Paid This Month</p>
            </div>
            <div className="stats-card">
              <p className="text-3xl md:text-4xl font-bold text-blue-500">
                <AnimatedCounter end={2} suffix="M+" duration={2000} />
              </p>
              <p className="text-base text-gray-600 mt-3 font-medium">Satisfied Users</p>
            </div>
            <div className="stats-card">
              <p className="text-3xl md:text-4xl font-bold text-blue-700">
                <AnimatedCounter end={50} suffix="+" duration={1500} />
              </p>
              <p className="text-base text-gray-600 mt-3 font-medium">Cities Covered</p>
            </div>
            <div className="stats-card">
              <p className="text-3xl md:text-4xl font-bold text-indigo-600">
                <AnimatedCounter end={99} suffix="%" duration={2000} />
              </p>
              <p className="text-base text-gray-600 mt-3 font-medium">Success Rate</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div>
              <span className="inline-block bg-blue-100 text-blue-700 text-xs font-semibold px-3 py-1 rounded-full mb-4">
                TRUSTED PLATFORM
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6 leading-tight">
                Trusted by Millions of Drivers
              </h2>
              <p className="text-gray-600 mb-8 leading-relaxed">
                See how we help users clear their dues securely and hassle-free. Our transparent process ensures you're always in the driver's seat of your finances.
              </p>
              <div className="flex gap-4">
                <button className="btn-premium px-6 py-3 rounded-xl">
                  Read Success Stories
                </button>
                <button className="border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors">
                  View Statistics
                </button>
              </div>
            </div>

            {/* Right Image */}
            <div className="relative">
              <div className="rounded-2xl overflow-hidden shadow-2xl">
                <img
                  src="https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=600&h=400&fit=crop"
                  alt="Happy driver using Challan One app"
                  className="w-full h-80 object-cover"
                />
                <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur-sm rounded-xl p-4">
                  <p className="font-semibold text-gray-900">Hassle-free payments</p>
                  <p className="text-sm text-gray-600">Join 2M+ satisfied users</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="text-center p-8 rounded-2xl bg-white border border-gray-100 hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-3">Secure Payments</h3>
              <p className="text-gray-600 text-base leading-relaxed">
                Your transactions are encrypted and processed through official government gateways.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="text-center p-8 rounded-2xl bg-white border border-gray-100 hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-3">Real-time Updates</h3>
              <p className="text-gray-600 text-base leading-relaxed">
                Challan status is updated instantly after payment. Download receipts immediately.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="text-center p-8 rounded-2xl bg-white border border-gray-100 hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-3">24/7 Support</h3>
              <p className="text-gray-600 text-base leading-relaxed">
                Have a dispute or payment issue? Our support team is available around the clock.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Real Stories / Testimonials Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Real Stories from Verified Users</h2>
              <p className="text-gray-600 mt-2 text-base">See what people are saying about their experience with Challan One.</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={prevTestimonial}
                className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition-colors"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={nextTestimonial}
                className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center hover:bg-red-700 transition-colors"
              >
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>

          {/* Testimonial Cards */}
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <div
                key={testimonial.id}
                className={`bg-white rounded-xl p-6 border border-gray-200 transition-all ${
                  index === currentTestimonial ? 'ring-2 ring-red-500 shadow-lg' : ''
                }`}
              >
                <div className="flex items-center gap-3 mb-4">
                  <img
                    src={testimonial.avatar}
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div>
                    <h4 className="font-semibold text-gray-900">{testimonial.name}</h4>
                    <p className="text-sm text-gray-500">{testimonial.date}</p>
                  </div>
                </div>
                <div className="flex gap-1 mb-3">
                  {renderStars(testimonial.rating)}
                </div>
                <p className="text-gray-600 text-sm leading-relaxed mb-4">"{testimonial.comment}"</p>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                    </svg>
                    {testimonial.likes}
                  </span>
                  {testimonial.dislikes && (
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" />
                      </svg>
                      {testimonial.dislikes}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">How It Works</h2>
          <p className="text-gray-600 mb-12">
            Paying your fine is simple and takes less than 2 minutes.
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="relative">
              <div className="w-10 h-10 bg-red-600 text-white rounded-full flex items-center justify-center text-lg font-bold mx-auto mb-6">
                1
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Enter Details</h3>
              <p className="text-gray-600 text-sm">Input vehicle number</p>
            </div>

            {/* Step 2 */}
            <div className="relative">
              <div className="w-10 h-10 bg-red-600 text-white rounded-full flex items-center justify-center text-lg font-bold mx-auto mb-6">
                2
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Verify Challan</h3>
              <p className="text-gray-600 text-sm">Check fine amount & photos</p>
            </div>

            {/* Step 3 */}
            <div className="relative">
              <div className="w-10 h-10 bg-red-600 text-white rounded-full flex items-center justify-center text-lg font-bold mx-auto mb-6">
                3
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Pay Securely</h3>
              <p className="text-gray-600 text-sm">Use Card, UPI, or NetBanking</p>
            </div>
          </div>
        </div>
      </section>

      {/* How Can We Help Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">How can we help you today?</h2>
          <p className="text-gray-600 mb-12">Explore our resources or get in touch with our dedicated support team.</p>

          <div className="grid md:grid-cols-3 gap-8">
            {/* FAQ */}
            <div className="p-8 border border-gray-200 rounded-2xl hover:shadow-lg transition-shadow">
              <div className="w-14 h-14 bg-red-100 rounded-xl flex items-center justify-center mx-auto mb-6">
                <svg className="w-7 h-7 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Frequently Asked Questions</h3>
              <p className="text-gray-600 text-sm mb-4">
                Find answers to common questions about payments, tracking challans, and receipt downloads.
              </p>
              <Link to="/faq" className="text-red-600 font-medium text-sm inline-flex items-center gap-1 hover:text-red-700">
                View FAQs
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>

            {/* Legal & Privacy */}
            <div className="p-8 border border-gray-200 rounded-2xl hover:shadow-lg transition-shadow">
              <div className="w-14 h-14 bg-red-100 rounded-xl flex items-center justify-center mx-auto mb-6">
                <svg className="w-7 h-7 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Legal & Privacy</h3>
              <p className="text-gray-600 text-sm mb-4">
                Read our terms of service, privacy policies, and information about secure data handling.
              </p>
              <Link to="/" className="text-red-600 font-medium text-sm inline-flex items-center gap-1 hover:text-red-700">
                Read Policies
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>

            {/* Customer Care */}
            <div className="p-8 border border-gray-200 rounded-2xl hover:shadow-lg transition-shadow">
              <div className="w-14 h-14 bg-red-100 rounded-xl flex items-center justify-center mx-auto mb-6">
                <svg className="w-7 h-7 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Customer Care</h3>
              <p className="text-gray-600 text-sm mb-4">
                Need help with a payment dispute? Chat with our support team or raise a ticket.
              </p>
              <Link to="/support" className="text-red-600 font-medium text-sm inline-flex items-center gap-1 hover:text-red-700">
                Contact Support
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Secure Partner Banner */}
      <section className="py-8 bg-red-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center gap-3">
            <svg className="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <div>
              <span className="font-semibold text-gray-900">Secure & Official Partner</span>
              <span className="text-gray-600 text-sm ml-2">
                All payments are processed through government approved secure gateways.
              </span>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
