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
  fallbackSMS?: boolean;
}

export async function sendTelegramCode({ 
  phone, 
  code, 
  fallbackSMS = true 
}: SendTelegramCodeParams): Promise<{ success: boolean; messageId?: number; error?: string }> {
  try {
    if (!process.env.SMSAERO_EMAIL || !process.env.SMSAERO_API_KEY) {
      throw new Error("SMSAERO_EMAIL и SMSAERO_API_KEY должны быть настроены");
    }

    // Очищаем номер телефона от лишних символов
    const cleanPhone = phone.replace(/[^\d]/g, '');
    
    // Формируем URL для API
    const baseUrl = 'https://gate.smsaero.ru/v2/telegram/send';
    
    const params = new URLSearchParams({
      number: cleanPhone,
      code: code
    });

    // Если включен fallback на SMS, добавляем параметры для SMS
    if (fallbackSMS) {
      params.append('text', `Ваш код подтверждения: ${code}`);
      // Убираем sign пока не зарегистрируем подпись в SMSAero
      // params.append('sign', 'SkiiinIQ');
    }

    console.log(`Sending Telegram code to ${cleanPhone}`);
    console.log(`Request URL: ${baseUrl}?${params}`);
    console.log(`Using email: ${process.env.SMSAERO_EMAIL}`);
    
    // Создаем базовую авторизацию
    const credentials = Buffer.from(`${process.env.SMSAERO_EMAIL}:${process.env.SMSAERO_API_KEY}`).toString('base64');
    
    const response = await fetch(`${baseUrl}?${params}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${credentials}`,
      },
    });

    console.log(`Response status: ${response.status}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API Error Response: ${errorText}`);
      throw new Error(`HTTP error! status: ${response.status}, response: ${errorText}`);
    }

    const result: TelegramCodeResponse = await response.json();
    
    if (result.success && result.data) {
      console.log(`Telegram code sent successfully. Message ID: ${result.data.id}, Status: ${result.data.extendStatus}`);
      return { 
        success: true, 
        messageId: result.data.id 
      };
    } else {
      console.error('Failed to send Telegram code:', result.message);
      return { 
        success: false, 
        error: result.message || 'Не удалось отправить код в Telegram' 
      };
    }
  } catch (error) {
    console.error('Error sending Telegram code:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Неизвестная ошибка при отправке кода в Telegram' 
    };
  }
}

export async function checkTelegramCodeStatus(messageId: number): Promise<{ 
  success: boolean; 
  status?: number; 
  extendStatus?: string; 
  error?: string 
}> {
  try {
    if (!process.env.SMSAERO_EMAIL || !process.env.SMSAERO_API_KEY) {
      throw new Error("SMSAERO_EMAIL и SMSAERO_API_KEY должны быть настроены");
    }

    const baseUrl = 'https://gate.smsaero.ru/v2/telegram/status';
    
    // Создаем базовую авторизацию
    const credentials = Buffer.from(`${process.env.SMSAERO_EMAIL}:${process.env.SMSAERO_API_KEY}`).toString('base64');
    
    const response = await fetch(`${baseUrl}?id=${messageId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${credentials}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result: TelegramCodeResponse = await response.json();
    
    if (result.success && result.data) {
      return { 
        success: true, 
        status: result.data.status,
        extendStatus: result.data.extendStatus 
      };
    } else {
      return { 
        success: false, 
        error: result.message || 'Не удалось получить статус сообщения' 
      };
    }
  } catch (error) {
    console.error('Error checking Telegram code status:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Неизвестная ошибка при проверке статуса' 
    };
  }
}

export function generateTelegramCode(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

// Статусы сообщений для понимания
export const TELEGRAM_STATUS = {
  QUEUE: 0,       // в очереди
  DELIVERED: 1,   // доставлено
  FAILED: 2,      // не доставлено
  SENT: 3,        // передано
  WAITING: 4,     // ожидание статуса сообщения
  REJECTED: 6,    // сообщение отклонено
  MODERATION: 8   // на модерации
} as const;