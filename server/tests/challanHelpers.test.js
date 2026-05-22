import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  maskName,
  formatChallanDate,
  formatChallanTime,
  normalizeVehicleParam
} from '../utils/challanHelpers.js';

describe('challanHelpers - maskName', () => {
  it('masks each name part', () => {
    assert.equal(maskName('Rahul Sharma'), 'R*** S***');
  });

  it('returns Unknown for empty name', () => {
    assert.equal(maskName(''), 'Unknown');
    assert.equal(maskName(null), 'Unknown');
  });
});

describe('challanHelpers - formatChallanDate', () => {
  it('formats valid ISO date', () => {
    const formatted = formatChallanDate('2024-03-15');
    assert.ok(formatted.includes('2024') || formatted.includes('Mar') || formatted.includes('15'));
  });

  it('returns N/A for missing date', () => {
    assert.equal(formatChallanDate(null), 'N/A');
  });
});

describe('challanHelpers - formatChallanTime', () => {
  it('formats HH:MM from time string', () => {
    assert.equal(formatChallanTime('14:30:00'), '14:30');
  });

  it('returns 00:00 for missing time', () => {
    assert.equal(formatChallanTime(null), '00:00');
  });
});

describe('challanHelpers - normalizeVehicleParam', () => {
  it('strips non-alphanumeric and uppercases', () => {
    assert.equal(normalizeVehicleParam('dl-05 cx 4567'), 'DL05CX4567');
  });
});
