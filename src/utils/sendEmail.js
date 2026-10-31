/**
 * Email Utility Service
 * Sends transactional emails via SMTP (if configured) or falls back to styled console logging
 * for easy local development and testing.
 */

export const sendEmail = async ({ to, subject, html, text }) => {
  const smtpConfigured =
    process.env.SMTP_HOST &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS;

  if (smtpConfigured) {
    try {
      // Dynamic import in case nodemailer is installed in the environment
      const nodemailer = await import("nodemailer");
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === "true", // true for 465, false for other ports
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      const mailOptions = {
        from: process.env.EMAIL_FROM || `"YouTube Clone" <no-reply@youtubeclone.com>`,
        to,
        subject,
        text,
        html,
      };

      const info = await transporter.sendMail(mailOptions);
      console.log(`✉️ Email sent successfully to ${to} (MessageId: ${info.messageId})`);
      return { success: true, messageId: info.messageId };
    } catch (err) {
      console.warn("⚠️ SMTP failed, falling back to console log:", err.message);
    }
  }

  // Development/Testing fallback output
  console.log("\n==================== [OUTGOING EMAIL] ====================");
  console.log(`To:      ${to}`);
  console.log(`Subject: ${subject}`);
  console.log(`Content: ${text || html}`);
  console.log("==========================================================\n");

  return { success: true, simulated: true };
};

/**
 * Send email verification link
 */
export const sendVerificationEmail = async (email, unHashedToken) => {
  const clientUrl = process.env.CLIENT_URL || `http://localhost:${process.env.PORT || 8000}`;
  const verificationUrl = `${clientUrl}/api/v1/users/verify-email/${unHashedToken}`;

  const subject = "Verify your YouTube Clone Account";
  const text = `Welcome! Please verify your email by clicking the following link or pasting it into your browser:\n\n${verificationUrl}\n\nThis link will expire in 24 hours.\n\nToken: ${unHashedToken}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
      <h2 style="color: #ff0000;">YouTube Clone Email Verification</h2>
      <p>Thank you for signing up! Please verify your email address to activate your account features.</p>
      <div style="margin: 25px 0;">
        <a href="${verificationUrl}" style="background-color: #ff0000; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">Verify Email</a>
      </div>
      <p style="color: #666; font-size: 14px;">Or copy and paste this link in your browser:</p>
      <p style="word-break: break-all; color: #0066cc; font-size: 13px;">${verificationUrl}</p>
      <p style="color: #888; font-size: 12px; margin-top: 20px;">This link expires in 24 hours.</p>
    </div>
  `;

  await sendEmail({ to: email, subject, text, html });
  return { verificationUrl, token: unHashedToken };
};

/**
 * Send password reset link
 */
export const sendPasswordResetEmail = async (email, unHashedToken) => {
  const clientUrl = process.env.CLIENT_URL || `http://localhost:${process.env.PORT || 8000}`;
  const resetUrl = `${clientUrl}/api/v1/users/reset-password/${unHashedToken}`;

  const subject = "Reset your YouTube Clone Password";
  const text = `You requested a password reset. Please click the following link to reset your password:\n\n${resetUrl}\n\nThis link will expire in 15 minutes.\nIf you did not request this, please ignore this email.\n\nToken: ${unHashedToken}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
      <h2 style="color: #ff0000;">YouTube Clone Password Reset</h2>
      <p>We received a request to reset your password. Click the button below to set a new password:</p>
      <div style="margin: 25px 0;">
        <a href="${resetUrl}" style="background-color: #ff0000; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">Reset Password</a>
      </div>
      <p style="color: #666; font-size: 14px;">Or copy and paste this link in your browser:</p>
      <p style="word-break: break-all; color: #0066cc; font-size: 13px;">${resetUrl}</p>
      <p style="color: #888; font-size: 12px; margin-top: 20px;">This link expires in 15 minutes. If you did not request a password reset, you can safely ignore this email.</p>
    </div>
  `;

  await sendEmail({ to: email, subject, text, html });
  return { resetUrl, token: unHashedToken };
};
