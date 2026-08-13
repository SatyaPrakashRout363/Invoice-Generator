const test = require('node:test');
const assert = require('node:assert/strict');
const sgMail = require('@sendgrid/mail');

const { send } = require('../utils/email');

test('dry-run send returns Sent without calling SendGrid', async () => {
  const original = process.env.SEND_DRY_RUN;
  process.env.SEND_DRY_RUN = 'true';
  try {
    const result = await send({ to: 'client@example.com', subject: 'Hi', html: '<p>hi</p>' });
    assert.deepEqual(result, { outcome: 'Sent', error: null });
  } finally {
    process.env.SEND_DRY_RUN = original;
  }
});

test('exhausted retries return Failed with the last error', async () => {
  const originalDryRun = process.env.SEND_DRY_RUN;
  const originalSend = sgMail.send;
  process.env.SEND_DRY_RUN = 'false';
  sgMail.send = async () => {
    throw new Error('simulated SendGrid failure');
  };

  try {
    const result = await send({ to: 'client@example.com', subject: 'Hi', html: '<p>hi</p>' });
    assert.equal(result.outcome, 'Failed');
    assert.equal(result.error, 'simulated SendGrid failure');
  } finally {
    process.env.SEND_DRY_RUN = originalDryRun;
    sgMail.send = originalSend;
  }
});
