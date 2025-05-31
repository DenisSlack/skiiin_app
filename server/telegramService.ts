interface TelegramCodeResponse {
  success: boolean;
  data?: {
    id: number;
    number: string;
    telegramCode: string;
    smsText?: string;
    smsFrom?: string;
    idSms?: number | null;
    status: number;
    extendStatus: string;
    cost: string;
    dateCreate: number;
  };
  message?: string;
}

interface SendTelegramCodeParams {
  phone: string;
  code: string;
}

interface CheckTelegramStatusParams {
  id: number;
}

export async function sendTelegramCode({ phone, code }: SendTelegramCodeParams): Promise<TelegramCodeResponse> {
  try {
    if (!process.env.SMSAERO_API_KEY || !process.env.SMSAERO_EMAIL) {
      throw new Error("SMS Aero API credentials not configured");
    }

    const credentials = Buffer.from(`${process.env.SMSAERO_EMAIL}:${process.env.SMSAERO_API_KEY}`).toString('base64');
    
    const url = new URL('https://gate.smsaero.ru/v2/telegram/send');
    url.searchParams.append('number', phone);
    url.searchParams.append('code', code);
    
    // Добавляем SMS резерв на случай недоставки в Telegram
    url.searchParams.append('text', `Ваш код верификации: ${code}`);
    url.searchParams.append('sign', 'Skiiin IQ');

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`SMS Aero API error: ${response.status}`);
    }

    const result: TelegramCodeResponse = await response.json();
    console.log('Telegram code sent:', result);
    
    return result;
  } catch (error) {
    console.error("Error sending Telegram code:", error);
    throw error;
  }
}

export async function checkTelegramStatus({ id }: CheckTelegramStatusParams): Promise<TelegramCodeResponse> {
  try {
    if (!process.env.SMSAERO_API_KEY || !process.env.SMSAERO_EMAIL) {
      throw new Error("SMS Aero API credentials not configured");
    }

    const credentials = Buffer.from(`${process.env.SMSAERO_EMAIL}:${process.env.SMSAERO_API_KEY}`).toString('base64');
    
    const url = new URL('https://gate.smsaero.ru/v2/telegram/status');
    url.searchParams.append('id', id.toString());

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`SMS Aero API error: ${response.status}`);
    }

    const result: TelegramCodeResponse = await response.json();
    console.log('Telegram status check:', result);
    
    return result;
  } catch (error) {
    console.error("Error checking Telegram status:", error);
    throw error;
  }
}

export function generateTelegramCode(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}