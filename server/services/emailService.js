const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail', // or use host/port for generic SMTP
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

const emailTemplate = (title, message, buttonText, buttonLink) => `
  <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
    <div style="text-align: center; margin-bottom: 24px;">
      <h1 style="color: #0f172a; margin: 0; font-size: 24px; font-weight: 900; letter-spacing: -0.5px;">INK THE <span style="color: #2563eb;">DEAL</span></h1>
      <p style="color: #64748b; font-size: 14px; margin-top: 4px;">DealFlow360 Operations</p>
    </div>
    <h2 style="color: #0f172a; font-size: 20px; margin-bottom: 16px;">${title}</h2>
    <p style="color: #334155; font-size: 16px; line-height: 1.5; margin-bottom: 24px;">
      ${message}
    </p>
    <div style="text-align: center; margin-bottom: 24px;">
      <a href="${buttonLink}" style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-size: 16px; font-weight: 600;">
        ${buttonText}
      </a>
    </div>
    <p style="color: #94a3b8; font-size: 13px; line-height: 1.5; text-align: center;">
      If you did not request this email, you can safely ignore it. For security, this link will expire soon.
    </p>
  </div>
`;

exports.sendVerificationEmail = async (email, token) => {
  if (!process.env.EMAIL_USER) {
    console.log(`[Email Mock] Verification sent to ${email}. Link: ${CLIENT_URL}/verify-email?token=${token}`);
    return;
  }
  
  const link = `${CLIENT_URL}/verify-email?token=${token}`;
  
  await transporter.sendMail({
    from: `"DealFlow360" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Verify your DealFlow360 account',
    html: emailTemplate(
      'Welcome to DealFlow360',
      'Please verify your email address to activate your account and access the platform.',
      'Verify Email',
      link
    ),
  });
};

exports.sendPasswordResetEmail = async (email, token) => {
  if (!process.env.EMAIL_USER) {
    console.log(`[Email Mock] Password reset sent to ${email}. Link: ${CLIENT_URL}/reset-password?token=${token}`);
    return;
  }

  const link = `${CLIENT_URL}/reset-password?token=${token}`;
  
  await transporter.sendMail({
    from: `"DealFlow360" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Reset your DealFlow360 password',
    html: emailTemplate(
      'Password Reset Request',
      'We received a request to reset your password. Click the button below to choose a new one.',
      'Reset Password',
      link
    ),
  });
};
