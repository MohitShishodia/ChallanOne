import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { resolveChallanAmount } from '../utils/challanPricing.js';

describe('challanPricing - resolveChallanAmount', () => {
  it('uses API amount when wasZeroAmount is false', () => {
    assert.equal(resolveChallanAmount({ amount: 500, wasZeroAmount: false }), 500);
    assert.equal(resolveChallanAmount({ amount: 750 }), 750);
  });

  it('applies fixed fines when wasZeroAmount is true', () => {
    assert.equal(
      resolveChallanAmount({ amount: 0, wasZeroAmount: true, offenceDetails: 'Red light jump' }),
      1000
    );
    assert.equal(
      resolveChallanAmount({ amount: 0, wasZeroAmount: true, offenceDetails: 'No entry violation' }),
      20000
    );
    assert.equal(
      resolveChallanAmount({ amount: 0, wasZeroAmount: true, offenceDetails: 'Drink and drive' }),
      10000
    );
    assert.equal(
      resolveChallanAmount({ amount: 0, wasZeroAmount: true, offenceDetails: 'Not using seat belt' }),
      1000
    );
    assert.equal(
      resolveChallanAmount({ amount: 0, wasZeroAmount: true, offenceDetails: 'Overspeeding' }),
      2000
    );
  });

  it('falls back to API amount when offence is not mapped', () => {
    assert.equal(
      resolveChallanAmount({ amount: 300, wasZeroAmount: true, offenceDetails: 'Parking violation' }),
      300
    );
  });
});
