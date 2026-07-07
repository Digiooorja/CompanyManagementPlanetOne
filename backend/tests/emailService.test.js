// Unit tests for the Notification & Alert Engine's Email channel wrapper.
// No real SMTP server is contacted in tests — EMAIL_HOST_USER/EMAIL_HOST_PASSWORD
// are intentionally unset in .env.test, so sendEmail() must gracefully no-op.
describe('emailService', () => {
  const ORIGINAL_ENV = { ...process.env };

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
    jest.resetModules();
  });

  test('isConfigured() is false when SMTP env vars are missing', () => {
    delete process.env.EMAIL_HOST;
    delete process.env.EMAIL_HOST_USER;
    delete process.env.EMAIL_HOST_PASSWORD;
    const { isConfigured } = require('../services/emailService');
    expect(isConfigured()).toBe(false);
  });

  test('sendEmail() no-ops (does not throw) when not configured', async () => {
    delete process.env.EMAIL_HOST;
    delete process.env.EMAIL_HOST_USER;
    delete process.env.EMAIL_HOST_PASSWORD;
    const { sendEmail } = require('../services/emailService');

    const result = await sendEmail({ to: 'someone@example.com', subject: 'Test', text: 'Hello' });
    expect(result).toEqual({ sent: false, reason: 'not-configured' });
  });

  test('sendEmail() returns no-recipient when "to" is missing', async () => {
    const { sendEmail } = require('../services/emailService');
    const result = await sendEmail({ subject: 'Test', text: 'Hello' });
    expect(result).toEqual({ sent: false, reason: 'no-recipient' });
  });

  test('isConfigured() is true once all three SMTP env vars are set', () => {
    process.env.EMAIL_HOST = 'smtp.example.com';
    process.env.EMAIL_HOST_USER = 'user@example.com';
    process.env.EMAIL_HOST_PASSWORD = 'secret';
    const { isConfigured } = require('../services/emailService');
    expect(isConfigured()).toBe(true);
  });
});
