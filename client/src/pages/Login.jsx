import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { API, API_BASE_URL } from '../config/api'
import { useAuth } from '../context/AuthContext'
import PageHeader from '../components/PageHeader'
import { getMsg91AccessToken } from '../utils/msg91'

function loadMsg91WidgetScript() {
  if (window.initSendOTP) return Promise.resolve()
  if (window.msg91WidgetScriptPromise) return window.msg91WidgetScriptPromise

  window.msg91WidgetScriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = 'https://verify.msg91.com/otp-provider.js'
    script.async = true
    script.onload = () => {
      if (window.initSendOTP) resolve()
      else reject(new Error('MSG91 OTP widget did not initialize.'))
    }
    script.onerror = () => {
      window.msg91WidgetScriptPromise = null
      reject(new Error('Unable to load the MSG91 OTP widget.'))
    }
    document.head.appendChild(script)
  })

  return window.msg91WidgetScriptPromise
}

function getMsg91WidgetMethods() {
  if (typeof window.sendOtp !== 'function' || typeof window.verifyOtp !== 'function') {
    throw new Error('MSG91 OTP widget is still loading. Please try again.')
  }
  return { sendOtp: window.sendOtp, verifyOtp: window.verifyOtp }
}

async function waitForMsg91WidgetMethods() {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    if (typeof window.sendOtp === 'function' && typeof window.verifyOtp === 'function') return
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  throw new Error('MSG91 OTP widget methods were not initialized.')
}

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
  const [signupStep, setSignupStep] = useState('details')
  const [signupOtp, setSignupOtp] = useState('')
  const [forgotPhone, setForgotPhone] = useState('')
  const [forgotOtp, setForgotOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmNewPassword, setConfirmNewPassword] = useState('')
  const [forgotStep, setForgotStep] = useState('email')
  const [countdown, setCountdown] = useState(0)

  const navigate = useNavigate()
  const { login } = useAuth()

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

  const requestSignupOtp = async () => {
    setError(''); setSuccess('')
    if (!name.trim()) return setError('Name is required')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setError('Enter a valid email address')
    if (!/^[6-9]\d{9}$/.test(phone)) return setError('Enter a valid 10-digit mobile number')
    if (password.length < 6) return setError('Password must be at least 6 characters long')
    if (password !== confirmPassword) return setError('Passwords do not match')

    setLoading(true)
    try {
      const configResponse = await fetch(API.auth.registrationWidgetConfig)
      const config = await configResponse.json()
      if (!configResponse.ok || !config.success) {
        throw new Error(config.message || 'MSG91 OTP widget is not configured.')
      }

      await loadMsg91WidgetScript()
      if (window.msg91InitializedWidgetId !== config.widgetId) {
        window.initSendOTP({
          widgetId: config.widgetId,
          tokenAuth: config.tokenAuth,
          identifier: `91${phone}`,
          exposeMethods: true,
          success: () => {},
          failure: () => {}
        })
        await waitForMsg91WidgetMethods()
        window.msg91InitializedWidgetId = config.widgetId
      }

      const { sendOtp } = getMsg91WidgetMethods()
      await new Promise((resolve, reject) => {
        sendOtp(
          `91${phone}`,
          resolve,
          (providerError) => reject(new Error(
            providerError?.message || providerError?.error || 'MSG91 could not send the SMS OTP.'
          ))
        )
      })
      setSignupStep('otp')
      setSignupOtp('')
      setCountdown(config.expiresIn || 900)
      setSuccess(`OTP sent to +91 ${phone}.`)
    } catch (error) {
      setError(error.message || 'Unable to send the SMS OTP. Check the MSG91 widget configuration and try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(''); setSuccess('')

    if (activeTab === 'signup') {
      return requestSignupOtp()
    }

    setLoading(true)
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      const data = await res.json()
      if (data.success) {
        login(data.user, data.token)
        setSuccess('Login successful! Redirecting...')
        setTimeout(() => navigate('/'), 800)
      } else {
        setError(data.message || 'Login failed')
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifySignupOtp = async (e) => {
    e.preventDefault()
    setError(''); setSuccess('')
    if (!/^\d{6}$/.test(signupOtp)) return setError('Enter the 6-digit OTP')

    setLoading(true)
    try {
      const { verifyOtp } = getMsg91WidgetMethods()
      const accessToken = await new Promise((resolve, reject) => {
        verifyOtp(
          signupOtp,
          resolve,
          (providerError) => reject(new Error(
            providerError?.message || providerError?.error || 'MSG91 could not verify the OTP.'
          ))
        )
      })
      const widgetAccessToken = getMsg91AccessToken(accessToken)
      if (!widgetAccessToken) {
        throw new Error('MSG91 did not return a verification token.')
      }

      const res = await fetch(API.auth.verifyRegistrationOtp, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          name,
          phone,
          password,
          accessToken: widgetAccessToken
        })
      })
      const data = await res.json()
      if (data.success) {
        login(data.user, data.token)
        setSuccess('Account created! Redirecting...')
        setTimeout(() => navigate('/'), 800)
      } else setError(data.message || 'OTP verification failed')
    } catch (error) {
      setError(error.message || 'OTP verification failed. Please check the code and try again.')
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
        body: JSON.stringify({ phone: forgotPhone })
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
        body: JSON.stringify({ phone: forgotPhone, otp: forgotOtp, newPassword })
      })
      const data = await res.json()
      if (data.success) {
        setSuccess(data.message)
        setTimeout(() => {
          setShowForgot(false); setForgotStep('email')
          setForgotPhone(''); setForgotOtp(''); setNewPassword(''); setConfirmNewPassword('')
          setEmail(forgotPhone); setError(''); setSuccess('')
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

      <div className="screen-content">
        <div className="container-narrow py-8 md:py-12 space-y-5">
        <div className="text-center pt-2 animate-fade-up">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl overflow-hidden border-2 border-red-100 shadow-lg">
            <img src="/logo.png" alt="Challan One" className="h-full w-full object-contain" />
          </div>
          <h1 className="h-display">
            {showForgot
              ? (forgotStep === 'email' ? 'Forgot Password' : forgotStep === 'otp' ? 'Verify OTP' : 'Set New Password')
              : (activeTab === 'login' ? 'Welcome Back' : signupStep === 'otp' ? 'Verify Mobile Number' : 'Create Account')}
          </h1>
          <p className="mt-1 text-[13.5px] text-slate-500">
            {showForgot
              ? (forgotStep === 'email' ? "We'll send a 6-digit SMS OTP to your registered mobile number" : forgotStep === 'otp' ? `Enter the OTP sent to +91 ${forgotPhone}` : 'Choose a strong password')
              : (activeTab === 'login'
                ? 'Login to manage your challans'
                : signupStep === 'otp'
                  ? `Enter the SMS OTP sent to +91 ${phone}`
                  : 'Sign up in seconds to get started')}
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
                onClick={() => { setActiveTab('login'); setSignupStep('details'); setError(''); setSuccess('') }}
                className={`rounded-lg py-2 text-[13px] font-semibold transition ${activeTab === 'login' ? 'bg-white text-slate-900 shadow' : 'text-slate-500'}`}
              >Login</button>
              <button
                onClick={() => { setActiveTab('signup'); setSignupStep('details'); setError(''); setSuccess('') }}
                className={`rounded-lg py-2 text-[13px] font-semibold transition ${activeTab === 'signup' ? 'bg-white text-slate-900 shadow' : 'text-slate-500'}`}
              >Sign Up</button>
            </div>

            <form
              onSubmit={activeTab === 'signup' && signupStep === 'otp' ? handleVerifySignupOtp : handleSubmit}
              className="surface-card p-4 space-y-3 animate-fade-up"
            >
              {activeTab === 'signup' && signupStep === 'otp' ? (
                <>
                  <div>
                    <label className="field-label">6-digit SMS OTP</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      value={signupOtp}
                      onChange={(e) => setSignupOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="Enter OTP"
                      className="input-field tracking-[0.5em] text-center text-lg"
                      required
                    />
                    <p className="mt-2 text-[12px] text-slate-500">
                      {countdown > 0 ? `OTP expires in ${formatTime(countdown)}` : 'OTP expired. Request a new one.'}
                    </p>
                  </div>
                  <button type="submit" disabled={loading || signupOtp.length !== 6} className="btn-primary mt-1">
                    {loading ? 'Verifying...' : 'Verify OTP & Create Account'}
                  </button>
                  <button
                    type="button"
                    onClick={requestSignupOtp}
                    disabled={loading || countdown > 0}
                    className="btn-ghost w-full"
                  >
                    {countdown > 0 ? `Resend OTP in ${formatTime(countdown)}` : 'Resend OTP'}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setSignupStep('details'); setSignupOtp(''); setError(''); setSuccess('') }}
                    className="btn-ghost w-full"
                  >
                    Change registration details
                  </button>
                </>
              ) : (
                <>
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
                <label className="field-label">{activeTab === 'login' ? 'Email or Mobile Number' : 'Email Address'}</label>
                <input
                  type={activeTab === 'login' ? 'text' : 'email'}
                  inputMode={activeTab === 'login' ? 'text' : 'email'}
                  autoComplete={activeTab === 'login' ? 'username' : 'email'}
                  placeholder={activeTab === 'login' ? 'Enter your email or 10-digit mobile number' : 'Enter your email'}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="input-field"
                />
              </div>
              {activeTab === 'signup' && (
                <div>
                  <label className="field-label" htmlFor="signup-phone">Mobile Number <span aria-hidden="true">*</span></label>
                  <div className="flex">
                    <span className="flex items-center rounded-l-xl border border-r-0 border-slate-200 bg-slate-100 px-3 text-[13px] text-slate-500">+91</span>
                    <input
                      id="signup-phone"
                      type="tel"
                      inputMode="numeric"
                      placeholder="10 digit mobile"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      required
                      aria-required="true"
                      maxLength={10}
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
                {loading ? 'Please wait...' : (activeTab === 'login' ? 'Login' : 'Send SMS OTP')}
              </button>
                </>
              )}
            </form>

            <p className="text-center text-[12.5px] text-slate-500">
              {activeTab === 'login' ? "Don't have an account? " : 'Already have an account? '}
              <button
                onClick={() => {
                  setActiveTab(activeTab === 'login' ? 'signup' : 'login')
                  setSignupStep('details')
                  setError('')
                  setSuccess('')
                }}
                className="font-semibold text-brand-red"
              >
                {activeTab === 'login' ? 'Sign up' : 'Login'}
              </button>
            </p>
          </>
        ) : (
          <>
            {forgotStep === 'email' && (
              <form onSubmit={handleSendForgotOtp} className="surface-card p-4 space-y-3 animate-fade-up">
                <div>
                  <label className="field-label">Registered Mobile Number</label>
                  <div className="flex">
                    <span className="flex items-center rounded-l-xl border border-r-0 border-slate-200 bg-slate-100 px-3 text-[13px] text-slate-500">+91</span>
                    <input
                      type="tel"
                      inputMode="numeric"
                      required
                      maxLength={10}
                      placeholder="10 digit mobile number"
                      value={forgotPhone}
                      onChange={(e) => setForgotPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      className="input-field rounded-l-none"
                    />
                  </div>
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
    </div>
  )
}
