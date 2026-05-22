import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildCreateRunPayload,
  buildActionRequestBody,
  extractRunEnvelope,
  formatChallanWalaError,
  resolveActionsFromChallenge
} from '../utils/delhiOtpApi.js';

describe('delhiOtpApi - buildCreateRunPayload', () => {
  it('uses rc_number and otpSource for ChallanWala', () => {
    const payload = buildCreateRunPayload({
      vehicleNumber: 'DL2FHM1111',
      mobileNumber: '9810307007',
      chassisNumber: '6153',
      engineNumber: '4233'
    });

    assert.equal(payload.rc_number, 'DL2FHM1111');
    assert.equal(payload.otpSource.code, 'DELHI_OTP');
    assert.equal(payload.mobileNumber, '9810307007');
    assert.equal(payload.chassisLast4, '6153');
    assert.equal(payload.engineLast4, '4233');
    assert.equal(payload.vehicleNumber, undefined);
    assert.equal(payload.chassisNumber, undefined);
  });
});

describe('delhiOtpApi - buildActionRequestBody', () => {
  it('builds SUBMIT_FETCH_OTP payload with otp', () => {
    const body = buildActionRequestBody('SUBMIT_FETCH_OTP', { otp: '605279' });
    assert.equal(body.action, 'SUBMIT_FETCH_OTP');
    assert.equal(body.payload.otp, '605279');
  });

  it('maps SUBMIT_MOBILE payload to chassisLast4 and engineLast4', () => {
    const body = buildActionRequestBody('SUBMIT_MOBILE', {
      mobileNumber: '9810307007',
      chassisNumber: '6153',
      engineNumber: '4233'
    });

    assert.equal(body.payload.mobileNumber, '9810307007');
    assert.equal(body.payload.chassisLast4, '6153');
    assert.equal(body.payload.engineLast4, '4233');
  });
});

describe('delhiOtpApi - extractRunEnvelope', () => {
  it('reads nested interactiveChallenge from API response', () => {
    const envelope = extractRunEnvelope({
      runId: 'run-1',
      status: 'ACTION_REQUIRED',
      data: {
        interactiveChallenge: { nextAction: 'SUBMIT_MOBILE', stage: 'AWAITING_MOBILE' }
      }
    });

    assert.equal(envelope.runId, 'run-1');
    assert.equal(envelope.interactiveChallenge.nextAction, 'SUBMIT_MOBILE');
  });
});

describe('delhiOtpApi - resolveActionsFromChallenge', () => {
  it('resolves Delhi OTP actions from challenge', () => {
    const actions = resolveActionsFromChallenge({
      nextAction: 'SUBMIT_FETCH_OTP',
      availableActions: ['SUBMIT_FETCH_OTP', 'RESEND_FETCH_OTP', 'CANCEL_RUN']
    });
    assert.equal(actions.nextOtpAction, 'SUBMIT_FETCH_OTP');
    assert.equal(actions.resendAction, 'RESEND_FETCH_OTP');
    assert.equal(actions.cancelAction, 'CANCEL_RUN');
  });
});

describe('delhiOtpApi - formatChallanWalaError', () => {
  it('formats validation errors array', () => {
    const msg = formatChallanWalaError({
      message: 'Validation error',
      errors: [{ field: 'rc_number', message: 'Invalid input: expected string, received undefined' }]
    });
    assert.match(msg, /rc_number/);
  });
});
