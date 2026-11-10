import { after, describe, it } from 'node:test';
import assert from 'node:assert/strict';

const originalAuthKey = process.env.MSG91_AUTH_KEY;
const originalWidgetId = process.env.MSG91_WIDGET_ID;
const originalFetch = globalThis.fetch;

process.env.MSG91_AUTH_KEY = 'test-auth-key';
process.env.MSG91_WIDGET_ID = 'test-widget-id';

const {
  sendMsg91WidgetOtp,
  verifyMsg91WidgetOtp,
  verifyMsg91WidgetAccessToken
} = await import('../utils/sendOtp.js');

after(() => {
  globalThis.fetch = originalFetch;
  if (originalAuthKey === undefined) delete process.env.MSG91_AUTH_KEY;
  else process.env.MSG91_AUTH_KEY = originalAuthKey;
  if (originalWidgetId === undefined) delete process.env.MSG91_WIDGET_ID;
  else process.env.MSG91_WIDGET_ID = originalWidgetId;
});

describe('MSG91 OTP Widget', () => {
  let request;
  it('sends an OTP using the configured widget and identifier', async () => {
    globalThis.fetch = async (url, options) => {
      request = { url: new URL(url), options };
      return new Response(JSON.stringify({ type: 'success', reqId: 'request-1' }), { status: 200 });
    };

    const result = await sendMsg91WidgetOtp('919876543210');

    assert.equal(result.success, true);
    assert.equal(result.requestId, 'request-1');
    assert.equal(request.url.href, 'https://api.msg91.com/api/v5/widget/sendOtp');
    assert.equal(request.options.method, 'POST');
    assert.equal(request.options.headers.authkey, 'test-auth-key');
    assert.deepEqual(JSON.parse(request.options.body), {
      widgetId: 'test-widget-id',
      identifier: '919876543210'
    });
  });

  it('uses the send response message as the Widget request ID', async () => {
    globalThis.fetch = async () => new Response(
      JSON.stringify({ type: 'success', message: 'request-from-msg91' }),
      { status: 200 }
    );

    const result = await sendMsg91WidgetOtp('919876543210');
    assert.equal(result.success, true);
    assert.equal(result.requestId, 'request-from-msg91');
  });

  it('verifies the OTP using the widget request ID', async () => {
    let request;
    globalThis.fetch = async (url, options) => {
      request = { url: new URL(url), options };
      return new Response(JSON.stringify({ type: 'success', message: 'verified' }), { status: 200 });
    };

    const result = await verifyMsg91WidgetOtp('request-1', '123456');

    assert.equal(result.success, true);
    assert.equal(request.url.href, 'https://api.msg91.com/api/v5/widget/verifyOtp');
    assert.equal(request.options.method, 'POST');
    assert.equal(request.options.headers.authkey, 'test-auth-key');
    assert.deepEqual(JSON.parse(request.options.body), {
      widgetId: 'test-widget-id',
      reqId: 'request-1',
      otp: '123456'
    });
  });

  it('rejects OTPs that MSG91 does not verify', async () => {
    globalThis.fetch = async () => new Response(
      JSON.stringify({ type: 'error', message: 'OTP mismatch' }),
      { status: 200 }
    );

    const result = await verifyMsg91WidgetOtp('request-1', '000000');
    assert.equal(result.success, false);
    assert.equal(result.error, 'OTP mismatch');
  });

  it('returns the MSG91 error field when the widget rejects a send request', async () => {
    globalThis.fetch = async () => new Response(
      JSON.stringify({ error: 'Widget Not Found !' }),
      { status: 400 }
    );

    const result = await sendMsg91WidgetOtp('919876543210');
    assert.equal(result.success, false);
    assert.equal(result.error, 'Widget Not Found !');
  });

  it('validates the widget access token using the backend Authkey', async () => {
    let request;
    globalThis.fetch = async (url, options) => {
      request = { url: new URL(url), options };
      return new Response(JSON.stringify({
        type: 'success',
        data: { identifier: '919876543210' }
      }), { status: 200 });
    };

    const result = await verifyMsg91WidgetAccessToken('widget-access-token');

    assert.equal(result.success, true);
    assert.equal(request.url.href, 'https://api.msg91.com/api/v5/widget/verifyAccessToken');
    assert.equal(request.options.headers.authkey, 'test-auth-key');
    assert.deepEqual(JSON.parse(request.options.body), { 'access-token': 'widget-access-token' });
    assert.equal(result.data.data.identifier, '919876543210');
  });
});
