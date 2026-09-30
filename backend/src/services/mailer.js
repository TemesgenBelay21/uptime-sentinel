const nodemailer = require('nodemailer');

let transporter;

const getTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return transporter;
};

/**
 * Send a "site is down" alert email.
 * @param {object} params - { to, siteName, siteUrl, detectedAt, errorMessage, statusCode }
 */
const sendDownAlert = async ({ to, siteName, siteUrl, detectedAt, errorMessage, statusCode }) => {
  const detail = statusCode ? `HTTP ${statusCode}` : errorMessage || 'Unknown error';
  const timeStr = new Date(detectedAt).toUTCString();

  await getTransporter().sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject: `[Uptime Sentinel] ${siteName} is DOWN`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:auto">
        <h2 style="color:#ef4444">${siteName} is Down</h2>
        <p>Your monitored site has become unreachable.</p>
        <table style="width:100%;border-collapse:collapse">
          <tr><td style="padding:6px;font-weight:bold">URL</td><td>${siteUrl}</td></tr>
          <tr><td style="padding:6px;font-weight:bold">Detected at</td><td>${timeStr}</td></tr>
          <tr><td style="padding:6px;font-weight:bold">Reason</td><td>${detail}</td></tr>
        </table>
        <p style="margin-top:24px;color:#6b7280;font-size:12px">
          You will receive another email when the site recovers.<br/>
          — Uptime Sentinel
        </p>
      </div>
    `,
  });
};

module.exports = { sendDownAlert };
