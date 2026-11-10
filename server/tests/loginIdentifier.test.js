import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveLoginIdentifier } from '../utils/loginIdentifier.js';

test('resolves email addresses case-insensitively', () => {
  assert.deepEqual(resolveLoginIdentifier(' User@Example.com '), {
    type: 'email',
    query: { email: 'user@example.com' }
  });
});

test('resolves Indian mobile numbers with optional country-code formatting', () => {
  const expected = {
    type: 'phone',
    query: { phone: { $in: ['9876543210', '919876543210', '+919876543210'] } }
  };

  assert.deepEqual(resolveLoginIdentifier('9876543210'), expected);
  assert.deepEqual(resolveLoginIdentifier('+91 98765-43210'), expected);
  assert.deepEqual(resolveLoginIdentifier('0091 (987) 654-3210'), expected);
});

test('rejects invalid login identifiers', () => {
  assert.equal(resolveLoginIdentifier('not-an-email'), null);
  assert.equal(resolveLoginIdentifier('1234567890'), null);
  assert.equal(resolveLoginIdentifier(null), null);
});
