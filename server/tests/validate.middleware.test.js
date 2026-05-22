import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { z } from 'zod';
import { validate } from '../middleware/validate.js';

function createMockRes() {
  const res = {
    statusCode: null,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    }
  };
  return res;
}

describe('validate middleware', () => {
  it('parses valid body and calls next', () => {
    const schema = z.object({
      email: z.string().email(),
      password: z.string().min(6)
    });
    const middleware = validate({ body: schema });
    const req = { body: { email: 'admin@test.com', password: 'secret12' } };
    const res = createMockRes();
    let nextCalled = false;

    middleware(req, res, () => { nextCalled = true; });

    assert.equal(nextCalled, true);
    assert.equal(req.body.email, 'admin@test.com');
  });

  it('returns 400 with field errors for invalid body', () => {
    const schema = z.object({
      email: z.string().email(),
      password: z.string().min(6)
    });
    const middleware = validate({ body: schema });
    const req = { body: { email: 'not-an-email', password: '123' } };
    const res = createMockRes();
    let nextCalled = false;

    middleware(req, res, () => { nextCalled = true; });

    assert.equal(nextCalled, false);
    assert.equal(res.statusCode, 400);
    assert.equal(res.body.success, false);
    assert.equal(res.body.message, 'Validation failed');
    assert.ok(Array.isArray(res.body.errors));
    assert.ok(res.body.errors.length >= 1);
  });

  it('validates query params', () => {
    const schema = z.object({ page: z.coerce.number().min(1) });
    const middleware = validate({ query: schema });
    const req = { query: { page: '2' } };
    const res = createMockRes();
    let nextCalled = false;

    middleware(req, res, () => { nextCalled = true; });

    assert.equal(nextCalled, true);
    assert.equal(req.query.page, 2);
  });
});
