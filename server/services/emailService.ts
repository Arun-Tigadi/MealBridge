/**
 * MealBridge Belagavi - Email Delivery Service
 *
 * Implements real email dispatch via legitimate email delivery providers:
 * 1. Resend API (RESEND_API_KEY)
 * 2. SendGrid API (SENDGRID_API_KEY)
 * 3. SMTP Transport (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM)
 *
 * Strict Compliance:
 * If no email provider is configured in environment variables, this service
 * explicitly reports that email delivery is unconfigured. It NEVER pretends
 * an email was sent.
 */

import nodemailer from 'nodemailer';

export interface EmailDeliveryResult {
  delivered: boolean;
  configured: boolean;
  provider: 'RESEND' | 'SENDGRID' | 'SMTP' | 'NONE';
  messageId?: string;
  error?: string;
  dependencyNotice?: string;
}

export class EmailService {
  public isConfigured(): boolean {
    return !!(
      process.env.RESEND_API_KEY ||
      process.env.SENDGRID_API_KEY ||
      (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS)
    );
  }

  public getActiveProviderName(): 'RESEND' | 'SENDGRID' | 'SMTP' | 'NONE' {
    if (process.env.RESEND_API_KEY) return 'RESEND';
    if (process.env.SENDGRID_API_KEY) return 'SENDGRID';
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) return 'SMTP';
    return 'NONE';
  }

  /**
   * Dispatches verification OTP email to new registrant.
   * Note: The OTP is NEVER logged to stdout or exposed in telemetry.
   */
  public async sendVerificationOtp(
    to: string,
    otp: string,
    recipientName: string
  ): Promise<EmailDeliveryResult> {
    const provider = this.getActiveProviderName();

    if (provider === 'NONE') {
      console.warn(
        `[EmailService] Notice: Email delivery provider not configured. Real email to ${to} could not be dispatched.`
      );
      return {
        delivered: false,
        configured: false,
        provider: 'NONE',
        dependencyNotice:
          'Email delivery provider is unconfigured. Please configure RESEND_API_KEY, SENDGRID_API_KEY, or SMTP_* environment variables.',
      };
    }

    const subject = 'MealBridge Belagavi - Your 6-Digit Email Verification Code';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 540px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; rounded: 12px; color: #1e293b;">
        <h2 style="color: #2563eb; margin-bottom: 8px;">MealBridge Belagavi</h2>
        <p style="font-size: 14px; color: #64748b; margin-top: 0;">Food Redistribution & Community Relief Network</p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p>Hello <strong>${recipientName}</strong>,</p>
        <p>Thank you for registering on MealBridge. Please enter the following 6-digit One-Time Password (OTP) to activate your account:</p>
        <div style="background-color: #f8fafc; border: 2px dashed #93c5fd; padding: 18px; text-align: center; margin: 24px 0; border-radius: 8px;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1d4ed8;">${otp}</span>
        </div>
        <p style="font-size: 13px; color: #64748b;">This OTP is valid for <strong>5 minutes</strong>. For security reasons, do not share this code with anyone.</p>
        <p style="font-size: 12px; color: #94a3b8; margin-top: 30px;">Belagavi District Food Rescue Cell &copy; ${new Date().getFullYear()} MealBridge</p>
      </div>
    `;

    return this.dispatchEmail(to, subject, html, provider);
  }

  /**
   * Dispatches password reset OTP email.
   */
  public async sendPasswordResetOtp(
    to: string,
    otp: string,
    recipientName: string
  ): Promise<EmailDeliveryResult> {
    const provider = this.getActiveProviderName();

    if (provider === 'NONE') {
      console.warn(
        `[EmailService] Notice: Email delivery provider not configured. Password reset email to ${to} could not be dispatched.`
      );
      return {
        delivered: false,
        configured: false,
        provider: 'NONE',
        dependencyNotice:
          'Email delivery provider is unconfigured. Please configure RESEND_API_KEY, SENDGRID_API_KEY, or SMTP_* environment variables.',
      };
    }

    const subject = 'MealBridge Belagavi - Password Reset Verification Code';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 540px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; rounded: 12px; color: #1e293b;">
        <h2 style="color: #2563eb; margin-bottom: 8px;">MealBridge Belagavi</h2>
        <p style="font-size: 14px; color: #64748b; margin-top: 0;">Password Recovery Verification</p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p>Hello <strong>${recipientName}</strong>,</p>
        <p>We received a request to reset your MealBridge account password. Use the following 6-digit verification code:</p>
        <div style="background-color: #f8fafc; border: 2px dashed #93c5fd; padding: 18px; text-align: center; margin: 24px 0; border-radius: 8px;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1d4ed8;">${otp}</span>
        </div>
        <p style="font-size: 13px; color: #64748b;">This OTP expires in <strong>10 minutes</strong>. If you did not request a password reset, you can safely ignore this email.</p>
        <p style="font-size: 12px; color: #94a3b8; margin-top: 30px;">Belagavi District Food Rescue Cell &copy; ${new Date().getFullYear()} MealBridge</p>
      </div>
    `;

    return this.dispatchEmail(to, subject, html, provider);
  }

  private async dispatchEmail(
    to: string,
    subject: string,
    html: string,
    provider: 'RESEND' | 'SENDGRID' | 'SMTP'
  ): Promise<EmailDeliveryResult> {
    try {
      if (provider === 'RESEND') {
        const apiKey = process.env.RESEND_API_KEY!;
        const from = process.env.RESEND_FROM || 'MealBridge <onboarding@resend.dev>';
        const resp = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from,
            to: [to],
            subject,
            html,
          }),
        });
        const data = (await resp.json()) as any;
        if (!resp.ok) {
          throw new Error(data.message || 'Resend API error');
        }
        return {
          delivered: true,
          configured: true,
          provider: 'RESEND',
          messageId: data.id,
        };
      }

      if (provider === 'SENDGRID') {
        const apiKey = process.env.SENDGRID_API_KEY!;
        const from = process.env.SENDGRID_FROM || 'noreply@mealbridge.org';
        const resp = await fetch('https://api.sendgrid.com/v3/mail/send', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            personalizations: [{ to: [{ email: to }] }],
            from: { email: from, name: 'MealBridge Belagavi' },
            subject,
            content: [{ type: 'text/html', value: html }],
          }),
        });
        if (!resp.ok) {
          const errText = await resp.text();
          throw new Error(`SendGrid API error: ${errText}`);
        }
        return {
          delivered: true,
          configured: true,
          provider: 'SENDGRID',
          messageId: `sendgrid-${Date.now()}`,
        };
      }

      if (provider === 'SMTP') {
        const port = Number(process.env.SMTP_PORT) || 587;
        const secure = port === 465;
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port,
          secure,
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
          tls: {
            rejectUnauthorized: process.env.NODE_ENV === 'production',
          },
        });

        const from = process.env.SMTP_FROM || 'MealBridge <noreply@mealbridge.org>';
        const info = await transporter.sendMail({
          from,
          to,
          subject,
          html,
        });

        return {
          delivered: true,
          configured: true,
          provider: 'SMTP',
          messageId: info.messageId,
        };
      }

      return {
        delivered: false,
        configured: false,
        provider: 'NONE',
        error: 'No valid email provider matched.',
      };
    } catch (err: any) {
      console.error(`[EmailService] Failed to send email via ${provider}:`, err.message);
      return {
        delivered: false,
        configured: true,
        provider,
        error: err.message,
      };
    }
  }
}

export const emailService = new EmailService();
