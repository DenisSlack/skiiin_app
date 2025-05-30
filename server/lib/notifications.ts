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

  // Отправка email
  async sendEmail(to: string, subject: string, html: string): Promise<void> {
    try {
      await transporter.sendMail({
        from: process.env.SMTP_USER,
        to,
        subject,
        html,
      });
      logger.info('Email sent successfully', { to, subject });
    } catch (error) {
      logger.error('Failed to send email:', { to, subject, error });
      throw error;
    }
  }

  // Отправка уведомления о новом анализе
  async sendAnalysisNotification(userEmail: string, analysisId: string, productName: string): Promise<void> {
    const subject = 'Новый анализ продукта';
    const html = `
      <h1>Анализ продукта завершен</h1>
      <p>Здравствуйте!</p>
      <p>Анализ продукта "${productName}" успешно завершен.</p>
      <p>Вы можете просмотреть результаты по ссылке: <a href="${process.env.APP_URL}/analysis/${analysisId}">Перейти к результатам</a></p>
    `;
    await this.sendEmail(userEmail, subject, html);
  }

  // Отправка уведомления о проблемах с API
  async sendApiErrorNotification(error: Error, route: string): Promise<void> {
    const subject = 'Ошибка API';
    const html = `
      <h1>Обнаружена ошибка в API</h1>
      <p>Маршрут: ${route}</p>
      <p>Ошибка: ${error.message}</p>
      <p>Стек: ${error.stack}</p>
    `;
    await this.sendEmail(process.env.ADMIN_EMAIL!, subject, html);
  }

  // Отправка уведомления о подозрительной активности
  async sendSecurityAlertNotification(ip: string, action: string, details: string): Promise<void> {
    const subject = 'Предупреждение безопасности';
    const html = `
      <h1>Обнаружена подозрительная активность</h1>
      <p>IP: ${ip}</p>
      <p>Действие: ${action}</p>
      <p>Детали: ${details}</p>
    `;
    await this.sendEmail(process.env.ADMIN_EMAIL!, subject, html);
  }
}

export const notifications = NotificationService.getInstance(); 