interface SMSAeroResponse {
  success: boolean;
  data?: any;
  message?: string;
}

interface SendSMSParams {
  phone: string;
  code: string;
}

export async function sendSMSCode({ phone, code }: SendSMSParams): Promise<boolean> {
  try {
    if (!process.env.SMSAERO_API_KEY || !process.env.SMSAERO_EMAIL) {
      console.error("SMS Aero credentials not configured");
      return false;
    }

    const message = `Ваш код для входа в Skiiin IQ: ${code}. Код действителен 10 минут.`;
    
    const credentials = Buffer.from(`${process.env.SMSAERO_EMAIL}:${process.env.SMSAERO_API_KEY}`).toString('base64');
    
    const response = await fetch('https://gate.smsaero.ru/v2/sms/send', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        number: phone,
        text: message,
        sign: 'SMS Aero',
      }),
    });

    const result: SMSAeroResponse = await response.json();
    
    if (!response.ok || !result.success) {
      console.error("SMS Aero API error:", result.message || "Unknown error");
      return false;
    }

    console.log("SMS sent successfully:", result.data);
    return true;
  } catch (error) {
    console.error("Error sending SMS:", error);
    return false;
  }
}

export function generateSMSCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}