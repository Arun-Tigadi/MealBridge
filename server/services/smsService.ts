/**
 * MealBridge Belagavi - Mobile SMS OTP Provider Integration Interface
 *
 * Implements an extensible integration interface for legitimate SMS OTP providers:
 * - Twilio SMS (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER)
 * - MSG91 / Fast2SMS (MSG91_AUTH_KEY, MSG91_SENDER_ID)
 *
 * Strict Compliance:
 * Until a valid SMS gateway provider is actively configured with valid credentials,
 * the service reports unconfigured status and DOES NOT claim SMS verification works.
 */

export interface ISmsProvider {
  name: string;
  isConfigured(): boolean;
  sendOtp(phone: string, otp: string): Promise<SmsDispatchResult>;
}

export interface SmsDispatchResult {
  sent: boolean;
  configured: boolean;
  providerName: string;
  messageId?: string;
  error?: string;
  notice?: string;
}

export class TwilioSmsProvider implements ISmsProvider {
  public name = 'Twilio SMS';

  public isConfigured(): boolean {
    return !!(
      process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      process.env.TWILIO_PHONE_NUMBER
    );
  }

  public async sendOtp(phone: string, otp: string): Promise<SmsDispatchResult> {
    if (!this.isConfigured()) {
      return {
        sent: false,
        configured: false,
        providerName: this.name,
        error:
          'Twilio SMS is not configured. Missing TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, or TWILIO_PHONE_NUMBER in server environment.',
      };
    }

    try {
      const accountSid = process.env.TWILIO_ACCOUNT_SID!;
      const authToken = process.env.TWILIO_AUTH_TOKEN!;
      const fromNumber = process.env.TWILIO_PHONE_NUMBER!;

      const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
      const body = new URLSearchParams({
        To: phone,
        From: fromNumber,
        Body: `MealBridge Belagavi: Your mobile verification OTP is ${otp}. Valid for 5 minutes.`,
      });

      const resp = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
        {
          method: 'POST',
          headers: {
            Authorization: `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: body.toString(),
        }
      );

      const data = (await resp.json()) as any;
      if (!resp.ok) {
        throw new Error(data.message || 'Twilio API failed');
      }

      return {
        sent: true,
        configured: true,
        providerName: this.name,
        messageId: data.sid,
      };
    } catch (err: any) {
      return {
        sent: false,
        configured: true,
        providerName: this.name,
        error: err.message,
      };
    }
  }
}

export class Msg91SmsProvider implements ISmsProvider {
  public name = 'MSG91 SMS Gateway';

  public isConfigured(): boolean {
    return !!(process.env.MSG91_AUTH_KEY && process.env.MSG91_TEMPLATE_ID);
  }

  public async sendOtp(phone: string, otp: string): Promise<SmsDispatchResult> {
    if (!this.isConfigured()) {
      return {
        sent: false,
        configured: false,
        providerName: this.name,
        error:
          'MSG91 SMS Gateway is not configured. Missing MSG91_AUTH_KEY or MSG91_TEMPLATE_ID in server environment.',
      };
    }

    try {
      const authKey = process.env.MSG91_AUTH_KEY!;
      const templateId = process.env.MSG91_TEMPLATE_ID!;

      const resp = await fetch(`https://control.msg91.com/api/v5/otp?template_id=${templateId}&mobile=${phone}&otp=${otp}`, {
        method: 'POST',
        headers: {
          authkey: authKey,
          'Content-Type': 'application/json',
        },
      });

      const data = (await resp.json()) as any;
      if (data.type === 'error') {
        throw new Error(data.message);
      }

      return {
        sent: true,
        configured: true,
        providerName: this.name,
        messageId: data.message,
      };
    } catch (err: any) {
      return {
        sent: false,
        configured: true,
        providerName: this.name,
        error: err.message,
      };
    }
  }
}

export class SmsService {
  private providers: ISmsProvider[] = [
    new TwilioSmsProvider(),
    new Msg91SmsProvider(),
  ];

  public isConfigured(): boolean {
    return this.providers.some((p) => p.isConfigured());
  }

  public getActiveProvider(): ISmsProvider | null {
    return this.providers.find((p) => p.isConfigured()) || null;
  }

  public async sendVerificationOtp(phone: string, otp: string): Promise<SmsDispatchResult> {
    const active = this.getActiveProvider();
    if (!active) {
      return {
        sent: false,
        configured: false,
        providerName: 'NONE',
        notice:
          'SMS OTP provider is not configured. Integration interface is ready for Twilio and MSG91, but SMS verification cannot function until valid provider credentials are provided.',
      };
    }

    return active.sendOtp(phone, otp);
  }
}

export const smsService = new SmsService();
