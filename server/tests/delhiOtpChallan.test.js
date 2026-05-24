import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  TERMINAL_STATES,
  transformDelhiChallans,
  isTerminalRunStatus,
  buildRunPollResult,
  getChallanDisplayType,
  mapOtpActionError
} from '../utils/challanTransform.js';
import { isValidIndianMobile, normalizeVehicleNumber } from '../utils/normalize.js';

const sampleChallans = [
  {
    challanNumber: 'DL-2024-001',
    challanType: 'ONLINE',
    amount: 500,
    paymentStatus: 'UNPAID',
    sentToVirtualCourt: false,
    courtChallan: false,
    challanPlace: 'ITO, Delhi',
    challanDate: '2024-03-15T10:30:00',
    offenseDetails: 'Red Light Jump',
    accusedName: 'Rahul Sharma'
  },
  {
    challanNumber: 'DL-2024-002',
    challanType: 'OFFLINE',
    amount: 1000,
    paymentStatus: 'UNPAID',
    sentToVirtualCourt: false,
    courtChallan: true,
    courtFee: 75,
    challanPlace: 'Connaught Place, Delhi',
    challanDate: '2024-03-20T14:00:00',
    offenseDetails: 'Overspeeding'
  },
  {
    challanNumber: 'DL-2024-003',
    challanType: 'ONLINE',
    amount: 200,
    paymentStatus: 'PAID',
    sentToVirtualCourt: false,
    courtChallan: false
  },
  {
    challanNumber: 'DL-2024-004',
    challanType: 'ONLINE',
    amount: 2000,
    paymentStatus: 'UNPAID',
    sentToVirtualCourt: true,
    courtChallan: false
  },
  {
    challanNumber: 'DL-2024-005',
    challanType: 'ONLINE',
    amount: 300,
    paymentStatus: 'DISPOSED',
    sentToVirtualCourt: false,
    courtChallan: false
  }
];

describe('Delhi OTP - Virtual Court Filtering', () => {
  it('excludes sentToVirtualCourt challans', () => {
    const result = transformDelhiChallans(sampleChallans, 'DL05CX4567');
    assert.equal(result.find(c => c.id === 'DL-2024-004'), undefined);
  });
});

describe('Delhi OTP - Paid challans included', () => {
  it('includes PAID challans with PAID status', () => {
    const result = transformDelhiChallans(sampleChallans, 'DL05CX4567');
    const paid = result.find(c => c.id === 'DL-2024-003');
    assert.ok(paid);
    assert.equal(paid.status, 'PAID');
    assert.equal(paid.noticeId, 'DL-2024-003');
  });

  it('shows DISPOSED as paid and excludes virtual court', () => {
    const result = transformDelhiChallans(sampleChallans, 'DL05CX4567');
    assert.equal(result.find(c => c.id === 'DL-2024-004'), undefined);
    const disposed = result.find(c => c.id === 'DL-2024-005');
    assert.ok(disposed);
    assert.equal(disposed.status, 'PAID');
  });
});

describe('Delhi OTP - Display Type Labeling', () => {
  it('labels ONLINE as E-Challan', () => {
    assert.equal(getChallanDisplayType({ courtChallan: false, challanType: 'ONLINE' }), 'E-Challan');
  });

  it('labels court challan correctly', () => {
    assert.equal(getChallanDisplayType({ courtChallan: true, challanType: 'OFFLINE' }), 'Court Challan');
  });

  it('labels OFFLINE non-court as Physical Challan', () => {
    assert.equal(getChallanDisplayType({ courtChallan: false, challanType: 'OFFLINE' }), 'Physical Challan');
  });

  it('applies court fee from data or default 50', () => {
    const result = transformDelhiChallans(sampleChallans, 'DL05CX4567');
    const court = result.find(c => c.id === 'DL-2024-002');
    assert.equal(court.courtFee, 75);
    assert.equal(court.displayType, 'Court Challan');
  });

  it('maps offence details and time', () => {
    const result = transformDelhiChallans(sampleChallans, 'DL05CX4567');
    const first = result.find(c => c.id === 'DL-2024-001');
    assert.equal(first.offenceDetails, 'Red Light Jump');
    assert.ok(first.time);
  });
});

describe('Delhi OTP - Run States', () => {
  it('identifies terminal states', () => {
    TERMINAL_STATES.forEach(s => assert.ok(isTerminalRunStatus(s)));
    assert.ok(!isTerminalRunStatus('AWAITING_OTP'));
  });

  it('buildRunPollResult for COMPLETED includes challans', () => {
    const result = buildRunPollResult('run-1', {
      status: 'COMPLETED',
      vehicleNumber: 'DL05CX4567',
      challans: [sampleChallans[0]]
    }, 'Done');
    assert.equal(result.isTerminal, true);
    assert.equal(result.challans.length, 1);
    assert.equal(result.vehicleNumber, 'DL05CX4567');
  });

  it('buildRunPollResult for EXPIRED sets failure reason', () => {
    const result = buildRunPollResult('run-1', { status: 'EXPIRED' }, null);
    assert.match(result.failureReason, /expired/i);
  });
});

describe('Delhi OTP - Action Error Mapping', () => {
  it('maps INVALID_OTP to 422 retriable', () => {
    const mapped = mapOtpActionError({ error: { code: 'INVALID_OTP' } }, 400);
    assert.equal(mapped.status, 422);
    assert.equal(mapped.body.retriable, true);
  });

  it('maps RUN_EXPIRED to 410', () => {
    const mapped = mapOtpActionError({ error: { code: 'RUN_EXPIRED' } }, 410);
    assert.equal(mapped.status, 410);
    assert.equal(mapped.body.expired, true);
  });

  it('returns null for unmapped errors', () => {
    assert.equal(mapOtpActionError({ message: 'unknown' }, 500), null);
  });
});

describe('Delhi OTP - Input Validation', () => {
  it('validates Indian mobile numbers', () => {
    assert.ok(isValidIndianMobile('9876543210'));
    assert.ok(!isValidIndianMobile('5123456789'));
  });

  it('normalizes vehicle numbers', () => {
    assert.equal(normalizeVehicleNumber('DL 05-CX 4567'), 'DL05CX4567');
  });
});
