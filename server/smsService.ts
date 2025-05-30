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
    
    // Try with URL parameters according to SMS Aero documentation
    const url = new URL('https://gate.smsaero.ru/v2/sms/send');
    url.searchParams.append('user', process.env.SMSAERO_EMAIL);
    url.searchParams.append('password', process.env.SMSAERO_API_KEY);
    url.searchParams.append('to', phone);
    url.searchParams.append('text', message);
    url.searchParams.append('from', 'SMS Aero');
    
    console.log("Attempting SMS send with credentials:", {
      email: process.env.SMSAERO_EMAIL,
      apiKeyLength: process.env.SMSAERO_API_KEY?.length,
      phone,
      url: url.toString().replace(process.env.SMSAERO_API_KEY || '', '***')
    });
    
    const response = await fetch(url.toString(), {
      method: 'GET',
    });

    const result: SMSAeroResponse = await response.json();
    
    console.log("SMS Aero response:", {
      status: response.status,
      ok: response.ok,
      result
    });
    
    if (!response.ok || !result.success) {
      console.error("SMS Aero API error:", result.message || result || "Unknown error");
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