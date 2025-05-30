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
    
    // Try different authentication method - using form data instead of basic auth
    const formData = new URLSearchParams({
      user: process.env.SMSAERO_EMAIL,
      password: process.env.SMSAERO_API_KEY,
      to: phone,
      text: message,
      from: 'SMS Aero'
    });
    
    const response = await fetch('https://gate.smsaero.ru/v2/sms/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
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