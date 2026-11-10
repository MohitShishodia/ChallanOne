import { describe, expect, it } from 'vitest'
import { getMsg91AccessToken } from './msg91'

const jwt = 'header.payload.signature'

describe('getMsg91AccessToken', () => {
  it.each(['access-token', 'accessToken', 'access_token', 'token', 'jwt'])(
    'extracts a JWT from the %s field',
    (field) => {
      expect(getMsg91AccessToken({ [field]: jwt })).toBe(jwt)
    }
  )

  it('finds a JWT nested in a response object', () => {
    expect(getMsg91AccessToken({ type: 'success', data: { access_token: jwt } })).toBe(jwt)
  })

  it('parses a JSON-encoded response', () => {
    expect(getMsg91AccessToken(JSON.stringify({ data: { accessToken: jwt } }))).toBe(jwt)
  })

  it('does not mistake a status message for a token', () => {
    expect(getMsg91AccessToken({ message: 'OTP verified successfully' })).toBe('')
  })
})
