import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { msg91AccessTokenMatchesPhone, normalizeMsg91Phone } from '../utils/msg91Identity.js';

describe('MSG91 verified phone matching', () => {
  it('matches a country-prefixed phone number', () => {
    assert.equal(msg91AccessTokenMatchesPhone(
      { data: { identifier: '919876543210' } },
      '9876543210'
    ), true);
  });

  it('matches an international phone number with formatting', () => {
    assert.equal(msg91AccessTokenMatchesPhone(
      { data: { mobile: '+91 98765-43210' } },
      '9876543210'
    ), true);
  });

  it('matches a numeric phone identifier', () => {
    assert.equal(msg91AccessTokenMatchesPhone(
      { data: { identifier: 919876543210 } },
      '9876543210'
    ), true);
  });

  it('matches a nested identifier object', () => {
    assert.equal(msg91AccessTokenMatchesPhone(
      { data: { identifier: { countryCode: '91', number: '9876543210' } } },
      '9876543210'
    ), true);
  });

  it('matches a number inside a textual MSG91 response field', () => {
    assert.equal(msg91AccessTokenMatchesPhone(
      { message: 'Verified successfully for +91 98765-43210' },
      '9876543210'
    ), true);
  });

  it('matches a JSON-encoded identifier response', () => {
    assert.equal(msg91AccessTokenMatchesPhone(
      { data: JSON.stringify({ identifier: '+91 9876543210' }) },
      '9876543210'
    ), true);
  });

  it('does not match another verified phone number', () => {
    assert.equal(msg91AccessTokenMatchesPhone(
      { data: { identifier: '919876543210' } },
      '9876543211'
    ), false);
  });

  it('normalizes a ten-digit identifier to the configured country code', () => {
    assert.equal(normalizeMsg91Phone('9876543210', '91'), '919876543210');
  });
});
