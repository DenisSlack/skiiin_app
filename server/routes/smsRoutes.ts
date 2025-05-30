import { Router } from 'express';
import { sendSMSCode, generateSMSCode } from '../smsService';
import { storage } from '../storage';
import { smsLoginSchema, smsVerifySchema } from '@shared/schema';

const router = Router();

// Тест подключения к SMS Aero
router.get('/api/auth/sms/test', async (req, res) => {
  try {
    if (!process.env.SMSAERO_API_KEY || !process.env.SMSAERO_EMAIL) {
      return res.status(500).json({ 
        message: "SMS Aero API credentials not configured",
        hasApiKey: !!process.env.SMSAERO_API_KEY,
        hasEmail: !!process.env.SMSAERO_EMAIL
      });
    }
    const credentials = Buffer.from(`${process.env.SMSAERO_EMAIL}:${process.env.SMSAERO_API_KEY}`).toString('base64');
    const response = await fetch('https://gate.smsaero.ru/v2/balance', {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/json',
      },
    });
    const result = await response.json();
    res.json({
      status: response.status,
      success: response.ok,
      data: result,
      credentials: `${process.env.SMSAERO_EMAIL}:***`
    });
  } catch (error: any) {
    res.status(500).json({ 
      message: "Error testing SMS Aero connection",
      error: error.message 
    });
  }
});

// Отправка SMS-кода
router.post('/api/auth/sms/send', async (req, res) => {
  try {
    const result = smsLoginSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ 
        message: "Некорректные данные", 
        errors: result.error.issues 
      });
    }
    const { phone } = result.data;
    const code = generateSMSCode();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);
    await storage.cleanupExpiredSmsCodes();
    await storage.createSmsCode({ phone, code, expiresAt, verified: false });
    const smsSent = await sendSMSCode({ phone, code });
    if (!smsSent) {
      return res.json({ 
        message: "SMS сервис временно недоступен. Для демонстрации используйте код: " + code,
        phone,
        demoCode: code
      });
    }
    res.json({ message: "SMS с кодом отправлен", phone });
  } catch (error) {
    res.status(500).json({ message: "Ошибка отправки SMS" });
  }
});

// Верификация SMS-кода
router.post('/api/auth/sms/verify', async (req, res) => {
  try {
    const result = smsVerifySchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ 
        message: "Некорректные данные", 
        errors: result.error.issues 
      });
    }
    const { phone, code } = result.data;
    const smsCode = await storage.getValidSmsCode(phone, code);
    if (!smsCode) {
      return res.status(400).json({ message: "Неверный или истекший код" });
    }
    await storage.markSmsCodeAsVerified(smsCode.id);
    let user = await storage.getUserByPhone(phone);
    if (!user) {
      user = await storage.createUserWithPhone(phone);
    }
    (req.session as any).userId = user.id;
    (req.session as any).username = user.username;
    res.json({ user, message: "Вход выполнен успешно" });
  } catch (error) {
    res.status(500).json({ message: "Ошибка верификации SMS" });
  }
});

export default router; 