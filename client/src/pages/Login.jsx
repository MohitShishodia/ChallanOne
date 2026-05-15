import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { API_BASE_URL } from '../config/api'
import PageHeader from '../components/PageHeader'

export default function Login() {
  const [activeTab, setActiveTab] = useState('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const [showForgot, setShowForgot] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotOtp, setForgotOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmNewPassword, setConfirmNewPassword] = useState('')
  const [forgotStep, setForgotStep] = useState('email')
  const [countdown, setCountdown] = useState(0)

  const navigate = useNavigate()

  useEffect(() => {
    if (countdown > 0) {
      const t = setTimeout(() => setCountdown(c => c - 1), 1000)
      return () => clearTimeout(t)
    }
  }, [countdown])

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(''); setSuccess('')

    if (activeTab === 'signup') {
      if (password.length < 6) return setError('Password must be at least 6 characters long')
      if (password !== confirmPassword) return setError('Passwords do not match')
      if (!name.trim()) return setError('Name is required')
    }

    setLoading(true)
    try {
      if (activeTab === 'login') {
        const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        })
        const data = await res.json()
        if (data.success) {
          localStorage.setItem('authToken', data.token)
          localStorage.setItem('user', JSON.stringify(data.user))
          setSuccess('Login successful! Redirecting...')
          setTimeout(() => navigate('/'), 800)
        } else setError(data.message || 'Login failed')
      } else {
        const res = await fetch(`${API_BASE_URL}/api/auth/signup`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, name, phone })
        })
        const data = await res.json()
        if (data.success) {
          localStorage.setItem('authToken', data.token)
          localStorage.setItem('user', JSON.stringify(data.user))
          setSuccess('Account created! Redirecting...')
          setTimeout(() => navigate('/'), 800)
        } else setError(data.message || 'Signup failed')
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleSendForgotOtp = async (e) => {
    e.preventDefault()
    setError(''); setSuccess(''); setLoading(true)
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail })
      })
      const data = await res.json()
      if (data.success) {
        setSuccess(data.message); setForgotStep('otp'); setCountdown(300)
      } else setError(data.message || 'Failed to send OTP')
    } catch { setError('Network error. Please try again.') }
    finally { setLoading(false) }
  }

  const handleVerifyForgotOtp = (e) => {
    e.preventDefault()
    if (forgotOtp.length === 6) { setForgotStep('password'); setError(''); setSuccess('') }
  }

  const handleResetPassword = async (e) => {
    e.preventDefault()
    setError(''); setSuccess('')
    if (newPassword.length < 6) return setError('Password must be at least 6 characters')
    if (newPassword !== confirmNewPassword) return setError('Passwords do not match')
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail, otp: forgotOtp, newPassword })
      })
      const data = await res.json()
      if (data.success) {
        setSuccess(data.message)
        setTimeout(() => {
          setShowForgot(false); setForgotStep('email')
          setForgotEmail(''); setForgotOtp(''); setNewPassword(''); setConfirmNewPassword('')
          setEmail(forgotEmail); setError(''); setSuccess('')
        }, 1500)
      } else setError(data.message || 'Failed to reset password')
    } catch { setError('Network error. Please try again.') }
    finally { setLoading(false) }
  }

  return (
    <div className="screen">
      <PageHeader
        title={showForgot ? 'Reset Password' : (activeTab === 'login' ? 'Login' : 'Sign Up')}
        onBack={() => showForgot ? setShowForgot(false) : navigate('/')}
      />

      <div className="screen-content space-y-5">
        <div className="text-center pt-2 animate-fade-up">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/30">
            <svg className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h1 className="h-display">
            {showForgot
              ? (forgotStep === 'email' ? 'Forgot Password' : forgotStep === 'otp' ? 'Verify OTP' : 'Set New Password')
              : (activeTab === 'login' ? 'Welcome Back' : 'Create Account')}
          </h1>
          <p className="mt-1 text-[13.5px] text-slate-500">
            {showForgot
              ? (forgotStep === 'email' ? "We'll send a 6-digit OTP to your email" : forgotStep === 'otp' ? `Enter the OTP sent to ${forgotEmail}` : 'Choose a strong password')
              : (activeTab === 'login' ? 'Login to manage your challans' : 'Sign up in seconds to get started')}
          </p>
        </div>

        {error && (
          <div className="rounded-xl border border-rose-100 bg-rose-50 p-3 text-[13px] text-rose-600">{error}</div>
        )}
        {success && (
          <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-3 text-[13px] text-emerald-700">{success}</div>
        )}

        {!showForgot ? (
          <>
            <div className="grid grid-cols-2 rounded-xl bg-slate-100 p-1">
              <button
                onClick={() => { setActiveTab('login'); setError(''); setSuccess('') }}
                className={`rounded-lg py-2 text-[13px] font-semibold transition ${activeTab === 'login' ? 'bg-white text-slate-900 shadow' : 'text-slate-500'}`}
              >Login</button>
              <button
                onClick={() => { setActiveTab('signup'); setError(''); setSuccess('') }}
                className={`rounded-lg py-2 text-[13px] font-semibold transition ${activeTab === 'signup' ? 'bg-white text-slate-900 shadow' : 'text-slate-500'}`}
              >Sign Up</button>
            </div>

            <form onSubmit={handleSubmit} className="surface-card p-4 space-y-3 animate-fade-up">
              {activeTab === 'signup' && (
                <div>
                  <label className="field-label">Full Name</label>
                  <input
                    type="text"
                    placeholder="Enter your full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="input-field"
                  />
                </div>
              )}
              <div>
                <label className="field-label">Email Address</label>
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="input-field"
                />
              </div>
              {activeTab === 'signup' && (
                <div>
                  <label className="field-label">Mobile Number</label>
                  <div className="flex">
                    <span className="flex items-center rounded-l-xl border border-r-0 border-slate-200 bg-slate-100 px-3 text-[13px] text-slate-500">+91</span>
                    <input
                      type="tel"
                      placeholder="10 digit mobile"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      className="input-field rounded-l-none"
                    />
                  </div>
                </div>
              )}
              <div>
                <label className="field-label">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="input-field pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? '🙈' : '👁'}
                  </button>
                </div>
              </div>
              {activeTab === 'signup' && (
                <div>
                  <label className="field-label">Confirm Password</label>
                  <input
                    type="password"
                    placeholder="Re-enter password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                    className="input-field"
                  />
                </div>
              )}
              {activeTab === 'login' && (
                <div className="text-right">
                  <button type="button" onClick={() => setShowForgot(true)} className="btn-link">
                    Forgot password?
                  </button>
                </div>
              )}
              <button type="submit" disabled={loading} className="btn-primary mt-1">
                {loading ? 'Please wait...' : (activeTab === 'login' ? 'Login' : 'Create Account')}
              </button>
            </form>

            <p className="text-center text-[12.5px] text-slate-500">
              {activeTab === 'login' ? "Don't have an account? " : 'Already have an account? '}
              <button onClick={() => setActiveTab(activeTab === 'login' ? 'signup' : 'login')} className="font-semibold text-blue-600">
                {activeTab === 'login' ? 'Sign up' : 'Login'}
              </button>
            </p>
          </>
        ) : (
          <>
            {forgotStep === 'email' && (
              <form onSubmit={handleSendForgotOtp} className="surface-card p-4 space-y-3 animate-fade-up">
                <div>
                  <label className="field-label">Email Address</label>
                  <input type="email" required placeholder="Enter your email" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} className="input-field" />
                </div>
                <button disabled={loading} className="btn-primary mt-1">{loading ? 'Sending...' : 'Send OTP'}</button>
              </form>
            )}
            {forgotStep === 'otp' && (
              <form onSubmit={handleVerifyForgotOtp} className="surface-card p-4 space-y-3 animate-fade-up">
                <div>
                  <label className="field-label">6-digit OTP</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={forgotOtp}
                    onChange={(e) => setForgotOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="Enter OTP"
                    className="input-field tracking-[0.5em] text-center text-lg"
                    required
                  />
                  <p className="mt-2 text-[12px] text-slate-500">
                    {countdown > 0 ? `OTP expires in ${formatTime(countdown)}` : 'OTP expired'}
                  </p>
                </div>
                <button disabled={forgotOtp.length !== 6} className="btn-primary mt-1">Verify OTP</button>
              </form>
            )}
            {forgotStep === 'password' && (
              <form onSubmit={handleResetPassword} className="surface-card p-4 space-y-3 animate-fade-up">
                <div>
                  <label className="field-label">New Password</label>
                  <input type="password" minLength={6} required value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="input-field" placeholder="At least 6 characters" />
                </div>
                <div>
                  <label className="field-label">Confirm New Password</label>
                  <input type="password" minLength={6} required value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)} className="input-field" placeholder="Re-enter new password" />
                </div>
                <button disabled={loading} className="btn-primary mt-1">{loading ? 'Resetting...' : 'Reset Password'}</button>
              </form>
            )}
            <button onClick={() => { setShowForgot(false); setForgotStep('email'); setError(''); setSuccess('') }} className="btn-ghost w-full">
              Back to login
            </button>
          </>
        )}

        <p className="text-center text-[11px] text-slate-400">
          By continuing you agree to our <Link to="/" className="text-slate-500">Terms</Link> & <Link to="/" className="text-slate-500">Privacy Policy</Link>
        </p>
      </div>
    </div>
  )
}
