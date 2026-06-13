import nodemailer from 'nodemailer';

// Parse the request payload from the incoming form submission.
// Vercel may provide req.body for JSON bodies, but for form posts we may need
// to read the raw request stream and parse either JSON or URL-encoded data.
const parseBody = async (req) => {
  if (req.body) return req.body;
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }

  const raw = Buffer.concat(chunks).toString('utf8');
  const contentType = (req.headers['content-type'] || '').toLowerCase();

  if (contentType.includes('application/json')) {
    return JSON.parse(raw || '{}');
  }

  if (contentType.includes('application/x-www-form-urlencoded')) {
    return Object.fromEntries(new URLSearchParams(raw));
  }

  return {};
};

// Plain text email body for email clients that prefer text.
const textTemplate = ({ name, email, phone, message }) => `
New website contact request

Name: ${name}
Email: ${email}
Phone: ${phone || 'N/A'}

Message:
${message}
`;

// HTML email body for nicer formatting in email clients.
const htmlTemplate = ({ name, email, phone, message }) => `
  <h2>New website contact request</h2>
  <p><strong>Name:</strong> ${name}</p>
  <p><strong>Email:</strong> ${email}</p>
  <p><strong>Phone:</strong> ${phone || 'N/A'}</p>
  <p><strong>Message:</strong></p>
  <p>${message.replace(/\n/g, '<br/>')}</p>
`;

// Main function handler run by Vercel when the /api/contact endpoint is called.
export default async function handler(req, res) {
  // Only accept POST requests from the form.
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Allow', 'POST');
    return res.end(JSON.stringify({ error: 'Method not allowed' }));
  }

  let body;
  try {
    body = await parseBody(req);
  } catch (error) {
    res.statusCode = 400;
    return res.end(JSON.stringify({ error: 'Invalid request body' }));
  }

  // Pull the expected fields from the submitted form.
  const { name, email, phone, message, honey } = body;

  // If the hidden honeypot field is filled, treat it as spam and return success.
  if (honey) {
    res.statusCode = 200;
    return res.end(JSON.stringify({ ok: true }));
  }

  // Basic validation: required fields must be present.
  if (!name || !email || !message) {
    res.statusCode = 400;
    return res.end(JSON.stringify({ error: 'Name, email, and message are required.' }));
  }

  // Basic email format validation.
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.statusCode = 400;
    return res.end(JSON.stringify({ error: 'Email is invalid.' }));
  }

  // Read SMTP credentials from environment variables.
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = Number(process.env.SMTP_PORT || 587);
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  if (!smtpHost || !smtpUser || !smtpPass) {
    res.statusCode = 500;
    return res.end(JSON.stringify({ error: 'Email service is not configured.' }));
  }

  // Create the SMTP transporter using nodemailer.
  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });

  const recipient = process.env.CONTACT_RECIPIENT || smtpUser;
  const subject = process.env.EMAIL_SUBJECT || 'New website contact request';

  const mail = {
    from: `"Website Contact" <${smtpUser}>`,
    to: recipient,
    subject,
    text: textTemplate({ name, email, phone, message }),
    html: htmlTemplate({ name, email, phone, message }),
  };

  try {
    await transporter.sendMail(mail);
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ ok: true }));
  } catch (error) {
    console.error('Email send failed:', error);
    res.statusCode = 500;
    return res.end(JSON.stringify({ error: 'Failed to send your message. Please try again later.' }));
  }
}
