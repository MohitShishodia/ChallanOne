import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeLastFourDigits,
  isValidLastFourDigits,
  normalizeVehicleNumber
} from '../utils/normalize.js';

describe('normalizeLastFourDigits', () => {
  it('returns undefined for empty input', () => {
    assert.equal(normalizeLastFourDigits(''), undefined);
    assert.equal(normalizeLastFourDigits(null), undefined);
  });

  it('takes last 4 alphanumeric characters', () => {
    assert.equal(normalizeLastFourDigits('12345'), '2345');
    assert.equal(normalizeLastFourDigits('AB12'), 'AB12');
  });

  it('strips spaces and uppercases', () => {
    assert.equal(normalizeLastFourDigits('ab 12'), 'AB12');
  });
});

describe('isValidLastFourDigits', () => {
  it('allows empty optional fields', () => {
    assert.equal(isValidLastFourDigits(''), true);
    assert.equal(isValidLastFourDigits(undefined), true);
  });

  it('requires exactly 4 characters when provided', () => {
    assert.equal(isValidLastFourDigits('1234'), true);
    assert.equal(isValidLastFourDigits('123'), false);
    assert.equal(isValidLastFourDigits('12345'), false);
  });
});
