const jwtPattern = /^[\w-]+\.[\w-]+\.[\w-]+$/
const tokenFieldNames = new Set(['accesstoken', 'token', 'jwttoken', 'tokenauth'])

export function getMsg91AccessToken(value) {
  if (typeof value === 'string') {
    if (jwtPattern.test(value)) return value

    try {
      return getMsg91AccessToken(JSON.parse(value))
    } catch {
      return ''
    }
  }
  if (!value || typeof value !== 'object') return ''

  for (const [key, nestedValue] of Object.entries(value)) {
    const normalizedKey = key.toLowerCase().replace(/[^a-z]/g, '')
    if (tokenFieldNames.has(normalizedKey)) {
      const token = getMsg91AccessToken(nestedValue)
      if (token) return token
    }
  }
  for (const nestedValue of Object.values(value)) {
    const token = getMsg91AccessToken(nestedValue)
    if (token) return token
  }
  return ''
}
