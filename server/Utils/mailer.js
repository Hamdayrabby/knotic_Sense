const nodemailer = require('nodemailer');

/**
 * Nodemailer transporter.
 *
 * Required environment variables (.env):
 *
 *   SMTP_HOST=smtp.gmail.com          # or smtp.sendgrid.net, smtp.mailtrap.io, etc.
 *   SMTP_PORT=587                      # 587 for TLS, 465 for SSL
 *   SMTP_SECURE=false                  # true only if port 465
 *   SMTP_USER=you@gmail.com
 *   SMTP_PASS=your_app_password        # Gmail: use an App Password, not your real password
 *   SMTP_FROM="Knotic Sense <you@gmail.com>"
 *
 * Quick-start options:
 *   - Gmail:    SMTP_HOST=smtp.gmail.com, SMTP_PORT=587, generate an App Password at
 *               https://myaccount.google.com/apppasswords
 *   - Mailtrap: free sandbox at https://mailtrap.io — great for dev/testing
 *   - SendGrid: SMTP_HOST=smtp.sendgrid.net, SMTP_USER=apikey, SMTP_PASS=<your_api_key>
 */
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587', 10),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/**
 * Send an email.
 *
 * @param {object} options
 * @param {string}   options.to       - Recipient email address
 * @param {string}   options.subject  - Email subject
 * @param {string}   options.text     - Plain-text body
 * @param {string}   [options.html]   - Optional HTML body (falls back to text)
 * @returns {Promise<object>}         - Nodemailer send info object
 */
const sendMail = async ({ to, subject, text, html }) => {
  // Developer/Test Fallback: if no SMTP credentials are configured, mock send to console
  if (!process.env.SMTP_USER || process.env.SMTP_USER === 'you@gmail.com') {
    console.log('\n==================================================');
    console.log('📧 [MOCK EMAIL SENT]');
    console.log(`TO:      ${to}`);
    console.log(`SUBJECT: ${subject}`);
    console.log(`BODY:`);
    console.log(text);
    console.log('==================================================\n');
    return { messageId: `mock-msg-${Date.now()}`, response: '250 Ok: Mock Sent' };
  }

  const info = await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject,
    text,
    html: html || text,
  });
  return info;
};

module.exports = { transporter, sendMail };
