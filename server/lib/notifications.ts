import nodemailer from 'nodemailer';
import logger from '../logger';

if (!process.env.SMTP_HOST || !process.env.SMTP_PORT || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
  throw new Error('SMTP configuration is required');
}

// Создаем транспортер для отправки email
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT),
  secure: process.env.SMTP_PORT === '465',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export class NotificationService {
  private static instance: NotificationService;

  private constructor() {}

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  // Заглушка вместо отправки email
  async sendEmail(to: string, subject: string, html: string): Promise<void> {
    // Email отключён
    return;
  }

  // Отправка уведомления о новом анализе
  async sendAnalysisNotification(userEmail: string, analysisId: string, productName: string): Promise<void> {
    return;
  }

  // Отправка уведомления о проблемах с API
  async sendApiErrorNotification(error: Error, route: string): Promise<void> {
    return;
  }

  // Отправка уведомления о подозрительной активности
  async sendSecurityAlertNotification(ip: string, action: string, details: string): Promise<void> {
    return;
  }
}

export const notifications = NotificationService.getInstance(); 