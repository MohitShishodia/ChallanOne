// Admin Login Page - Premium glassmorphism design
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Eye, EyeOff, Zap, Lock, Mail, ArrowRight, ShieldCheck } from 'lucide-react'
import toast from 'react-hot-toast'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await login(form.email, form.password)
      toast.success('Welcome back!')
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Animated background blobs */}
      <div style={{
        position: 'absolute', width: 500, height: 500,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(37,99,235,0.15) 0%, transparent 70%)',
        top: '-100px', left: '-100px',
        animation: 'pulse-soft 4s ease-in-out infinite'
      }} />
      <div style={{
        position: 'absolute', width: 400, height: 400,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 70%)',
        bottom: '-80px', right: '-60px',
        animation: 'pulse-soft 5s ease-in-out infinite 1s'
      }} />

      {/* Grid pattern overlay */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
                          linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)`,
        backgroundSize: '40px 40px'
      }} />

      <div style={{ position: 'relative', width: '100%', maxWidth: 420, zIndex: 1 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 58, height: 58,
            borderRadius: 16,
            background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 14px',
            boxShadow: '0 8px 24px rgba(37,99,235,0.4)'
          }}>
            <Zap size={28} color="#fff" strokeWidth={2.5} />
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: '#fff', marginBottom: 4 }}>
            ChallanOne Admin
          </h1>
          <p style={{ fontSize: 14, color: '#94a3b8' }}>
            Secure admin portal — authorized access only
          </p>
        </div>

        {/* Login Card */}
        <div style={{
          background: 'rgba(255,255,255,0.05)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 20,
          padding: 32,
          boxShadow: '0 20px 60px rgba(0,0,0,0.4)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
            <ShieldCheck size={18} color="#2563eb" />
            <span style={{ fontSize: 13, color: '#64748b' }}>SSL Encrypted Session</span>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {/* Email */}
            <div className="form-group">
              <label className="form-label" style={{ color: '#94a3b8' }}>
                Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{
                  position: 'absolute', left: 13, top: '50%',
                  transform: 'translateY(-50%)', color: '#64748b'
                }} />
                <input
                  type="email"
                  id="admin-email"
                  className="form-input"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="admin@challanone.com"
                  required
                  style={{
                    paddingLeft: 38,
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    color: '#fff'
                  }}
                />
              </div>
            </div>

            {/* Password */}
            <div className="form-group">
              <label className="form-label" style={{ color: '#94a3b8' }}>Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{
                  position: 'absolute', left: 13, top: '50%',
                  transform: 'translateY(-50%)', color: '#64748b'
                }} />
                <input
                  type={showPass ? 'text' : 'password'}
                  id="admin-password"
                  className="form-input"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  placeholder="Enter your password"
                  required
                  style={{
                    paddingLeft: 38, paddingRight: 42,
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    color: '#fff'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(v => !v)}
                  style={{
                    position: 'absolute', right: 12, top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none', border: 'none',
                    cursor: 'pointer', color: '#64748b', padding: 2
                  }}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              id="admin-login-btn"
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px 20px',
                background: loading ? '#1d4ed8' : 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                color: '#fff',
                border: 'none',
                borderRadius: 10,
                fontSize: 15,
                fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                boxShadow: '0 4px 14px rgba(37,99,235,0.4)',
                transition: 'all 0.2s ease',
                marginTop: 4
              }}
            >
              {loading ? (
                <>
                  <div style={{
                    width: 16, height: 16,
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderTopColor: '#fff',
                    borderRadius: '50%',
                    animation: 'spin 0.7s linear infinite'
                  }} />
                  Authenticating…
                </>
              ) : (
                <> Sign In <ArrowRight size={16} /> </>
              )}
            </button>
          </form>

          {/* Default credentials hint */}
          <div style={{
            marginTop: 20,
            padding: '12px 14px',
            background: 'rgba(37,99,235,0.1)',
            border: '1px solid rgba(37,99,235,0.2)',
            borderRadius: 8
          }}>
            <p style={{ fontSize: 12, color: '#60a5fa', fontWeight: 600, marginBottom: 4 }}>
              🔑 Default Credentials (change after first login)
            </p>
            <p style={{ fontSize: 12, color: '#94a3b8' }}>
              Email: admin@challanone.com<br />
              Password: Admin@123
            </p>
          </div>
        </div>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 12, color: '#475569' }}>
          ChallanOne Admin v1.0 &nbsp;·&nbsp; Protected by JWT
        </p>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .form-input::placeholder { color: #475569; }
      `}</style>
    </div>
  )
}
