import sgMail from '@sendgrid/mail';

if (!process.env.SENDGRID_API_KEY) {
  throw new Error("SENDGRID_API_KEY environment variable must be set");
}

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

interface SendVerificationCodeParams {
  email: string;
  code: string;
}

export async function sendVerificationCode({ email, code }: SendVerificationCodeParams): Promise<boolean> {
  try {
    const msg = {
      to: email,
      from: 'noreply@skiniq.app', // Можно настроить домен в SendGrid
      subject: 'Код подтверждения для входа в Skiiin IQ',
      text: `Ваш код подтверждения: ${code}. Код действителен в течение 10 минут.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Код подтверждения</h2>
          <p>Ваш код подтверждения для входа в Skiiin IQ:</p>
          <div style="background: #f5f5f5; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
            <h1 style="color: #007bff; font-size: 32px; margin: 0; letter-spacing: 4px;">${code}</h1>
          </div>
          <p style="color: #666;">Код действителен в течение 10 минут.</p>
          <p style="color: #666; font-size: 12px;">Если вы не запрашивали этот код, проигнорируйте это письмо.</p>
        </div>
      `,
    };

    await sgMail.send(msg);
    console.log(`Verification code sent to ${email}`);
    return true;
  } catch (error) {
    console.error('SendGrid email error:', error);
    return false;
  }
}

export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}