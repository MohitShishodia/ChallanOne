// Settings Page
import { useState, useEffect } from 'react'
import { Save, RefreshCw } from 'lucide-react'
import { useApi } from '../../hooks/useFetch'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'

export default function Settings() {
  const { authHeaders } = useAuth()
  const { request, loading: saving } = useApi()
  const [settings, setSettings] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadSettings() }, [])

  async function loadSettings() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/settings', { headers: authHeaders() })
      const data = await res.json()
      if (data.success) setSettings(data.settings)
    } catch { toast.error('Failed to load settings') }
    finally { setLoading(false) }
  }

  const set = (cat, key, val) => setSettings(s => ({
    ...s,
    [cat]: { ...(s[cat] || {}), [key]: val }
  }))

  const handleSave = async () => {
    const settingsArray = Object.entries(settings).flatMap(([cat, keys]) =>
      Object.entries(keys).map(([key, value]) => ({ key, value, category: cat }))
    )
    try {
      const res = await request('/api/admin/settings', { method: 'PUT', body: { settings: settingsArray } })
      if (res.success) toast.success('Settings saved successfully')
      else toast.error('Some settings failed to save')
    } catch { toast.error('Failed to save settings') }
  }

  const Section = ({ title, children }) => (
    <div className="card" style={{ marginBottom: 20 }}>
      <div className="card-header" style={{ marginBottom: 4 }}>
        <span className="card-title">{title}</span>
      </div>
      <div className="card-body">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>{children}</div>
      </div>
    </div>
  )

  const Field = ({ label, cat, k, type = 'text', placeholder }) => (
    <div className="form-group">
      <label className="form-label">{label}</label>
      {type === 'toggle' ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
          <label className="switch">
            <input type="checkbox" checked={settings[cat]?.[k] === 'true'}
              onChange={e => set(cat, k, String(e.target.checked))} />
            <span className="switch-track" />
            <span className="switch-thumb" style={{ position: 'absolute' }} />
          </label>
          <span style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
            {settings[cat]?.[k] === 'true' ? 'Enabled' : 'Disabled'}
          </span>
        </div>
      ) : (
        <input className="form-input" type={type} placeholder={placeholder}
          value={settings[cat]?.[k] || ''}
          onChange={e => set(cat, k, e.target.value)} />
      )}
    </div>
  )

  if (loading) return (
    <div>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="card" style={{ marginBottom: 20 }}>
          <div className="card-body">
            <div className="skeleton" style={{ height: 140, borderRadius: 8 }} />
          </div>
        </div>
      ))}
    </div>
  )

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Configure your platform settings</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary" onClick={loadSettings}><RefreshCw size={14} /></button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            <Save size={14} />
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>

      <Section title="General">
        <Field label="Site Name" cat="general" k="site_name" placeholder="ChallanOne" />
        <Field label="Tagline" cat="general" k="site_tagline" placeholder="Pay Traffic Challans Online" />
        <Field label="Contact Email" cat="general" k="contact_email" type="email" />
        <Field label="Contact Phone" cat="general" k="contact_phone" placeholder="+91-XXXXXXXXXX" />
      </Section>

      <Section title="SEO Metadata">
        <div className="form-group" style={{ gridColumn: '1 / -1' }}>
          <label className="form-label">Meta Title</label>
          <input className="form-input" value={settings.seo?.seo_title || ''}
            onChange={e => set('seo', 'seo_title', e.target.value)} />
        </div>
        <div className="form-group" style={{ gridColumn: '1 / -1' }}>
          <label className="form-label">Meta Description</label>
          <textarea className="form-textarea" style={{ minHeight: 72 }}
            value={settings.seo?.seo_description || ''}
            onChange={e => set('seo', 'seo_description', e.target.value)} />
        </div>
      </Section>

      <Section title="Payment Settings">
        <Field label="Razorpay Enabled" cat="payment" k="razorpay_enabled" type="toggle" />
        <Field label="Convenience Fee (%)" cat="payment" k="convenience_fee_percent" type="number" placeholder="2.5" />
      </Section>

      <Section title="Notifications">
        <Field label="Email Notifications" cat="notifications" k="email_notifications_enabled" type="toggle" />
        <Field label="SMS Notifications" cat="notifications" k="sms_notifications_enabled" type="toggle" />
        <Field label="Push Notifications" cat="notifications" k="push_notifications_enabled" type="toggle" />
      </Section>
    </div>
  )
}
