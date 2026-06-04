import { API_BASE_URL } from '../config/api'

export async function submitSupportMessage({ name, email, message, source = 'support' }) {
  const res = await fetch(`${API_BASE_URL}/api/support/contact`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, message, source }),
  })
  const data = await res.json()
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Failed to send message')
  }
  return data
}
