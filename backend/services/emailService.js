const nodemailer = require('nodemailer');

// Thin wrapper around nodemailer for the Notification & Alert Engine's Email
// channel (Requirements §10 — Notification.channels / NotificationRule.channels
// can include 'Email' alongside the always-on 'InApp' channel). Reads SMTP
// config from environment variables (see backend/.env: EMAIL_HOST, EMAIL_PORT,
// EMAIL_USE_TLS, EMAIL_USE_SSL, EMAIL_HOST_USER, EMAIL_HOST_PASSWORD,
// DEFAULT_FROM_EMAIL).
let transporter = null;
let configWarningLogged = false;

function isConfigured() {
  return Boolean(process.env.EMAIL_HOST && process.env.EMAIL_HOST_USER && process.env.EMAIL_HOST_PASSWORD);
}

function getTransporter() {
  if (transporter) return transporter;
  if (!isConfigured()) return null;

  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT) || 587,
    secure: String(process.env.EMAIL_USE_SSL).toLowerCase() === 'true',
    requireTLS: String(process.env.EMAIL_USE_TLS).toLowerCase() === 'true',
    auth: {
      user: process.env.EMAIL_HOST_USER,
      pass: process.env.EMAIL_HOST_PASSWORD
    }
  });

  return transporter;
}

// Sends a single email. Never throws — a failed/unconfigured Email channel
// must not break the Notification & Alert Engine's in-app delivery, which is
// always the primary channel; Email/SMS are supplementary (§10).
async function sendEmail({ to, subject, text, html }) {
  if (!to) return { sent: false, reason: 'no-recipient' };

  const transport = getTransporter();
  if (!transport) {
    if (!configWarningLogged) {
      console.warn(
        '[email-service] EMAIL_HOST / EMAIL_HOST_USER / EMAIL_HOST_PASSWORD are not fully configured — ' +
          'emails will not be sent (in-app notifications are unaffected).'
      );
      configWarningLogged = true;
    }
    return { sent: false, reason: 'not-configured' };
  }

  try {
    await transport.sendMail({
      from: process.env.DEFAULT_FROM_EMAIL || process.env.EMAIL_HOST_USER,
      to,
      subject,
      text,
      html: html || undefined
    });
    return { sent: true };
  } catch (err) {
    console.error('[email-service] failed to send email:', err.message);
    return { sent: false, reason: err.message };
  }
}

module.exports = { sendEmail, isConfigured };
