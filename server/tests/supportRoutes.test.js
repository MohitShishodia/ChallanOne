import { afterEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import supportRoutes from '../routes/support.js';
import SupportTicketModel from '../models/SupportTicket.js';

const originalCreate = SupportTicketModel.create;
const httpFetch = global.fetch;

function createTestApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/support', supportRoutes);
  return app;
}

async function request(app, body) {
  const server = app.listen(0);
  const { port } = server.address();

  try {
    const response = await httpFetch(`http://127.0.0.1:${port}/api/support/contact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return { status: response.status, body: await response.json() };
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

describe('Support contact route - challan settlement', () => {
  afterEach(() => {
    SupportTicketModel.create = originalCreate;
  });

  it('creates a settlement ticket using RC number and mobile without email or message', async () => {
    let createdTicket;
    SupportTicketModel.create = async (ticket) => {
      createdTicket = ticket;
      return { ...ticket, _id: { toString: () => 'ticket-123' } };
    };

    const response = await request(createTestApp(), {
      name: 'DL01AB1234',
      mobileNumber: '9876543210',
      source: 'challan-settlement',
    });

    assert.equal(response.status, 201);
    assert.equal(response.body.success, true);
    assert.equal(createdTicket.guest_phone, '9876543210');
    assert.equal(createdTicket.guest_email, null);
    assert.match(createdTicket.description, /DL01AB1234/);
    assert.match(createdTicket.description, /9876543210/);
  });

  it('rejects a settlement request with an invalid mobile number', async () => {
    SupportTicketModel.create = async () => {
      assert.fail('Ticket should not be created for an invalid phone number');
    };

    const response = await request(createTestApp(), {
      name: 'DL01AB1234',
      mobileNumber: '12345',
      source: 'challan-settlement',
    });

    assert.equal(response.status, 400);
    assert.match(response.body.message, /mobile/i);
  });
});
