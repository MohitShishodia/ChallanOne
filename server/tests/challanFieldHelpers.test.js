import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getOffenceDetails, getOffenceSection } from '../utils/challanFieldHelpers.js';

describe('challanFieldHelpers - getOffenceDetails', () => {
  it('reads ChallanWala offenseDetails (American spelling)', () => {
    assert.equal(
      getOffenceDetails({ offenseDetails: 'Not using Seat-belt' }),
      'Not using Seat-belt'
    );
  });

  it('reads offence_details array with act and name', () => {
    const details = getOffenceDetails({
      offence_details: [
        { act: 'MV act 1988 S 122', name: 'violation of parking rules.' }
      ]
    });
    assert.match(details, /parking rules/i);
    assert.match(details, /MV act/i);
  });

  it('returns N/A when nothing found', () => {
    assert.equal(getOffenceDetails({ amount: 500 }), 'N/A');
  });
});

describe('challanFieldHelpers - getOffenceSection', () => {
  it('reads section from offence_details list', () => {
    assert.equal(
      getOffenceSection({ offence_details: [{ act: 'Section 177' }] }),
      'Section 177'
    );
  });
});
