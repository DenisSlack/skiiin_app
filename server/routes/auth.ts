import type { Request, Response, Router } from 'express';
import type { Session, SessionData } from 'express-session';
import express from 'express';
import { storage } from '../storage';
import { requireAuth } from '../middleware/auth';
import { loginSchema, registerSchema, smsLoginSchema, smsVerifySchema, telegramLoginSchema, telegramVerifySchema } from '@shared/schema';
import { sendSMSCode, generateSMSCode } from '../smsService';
import { sendTelegramCode, generateTelegramCode } from '../telegramService';
import { memoryCodeStorage } from '../memoryCodeStorage';

interface CustomSessionData extends SessionData {
  userId?: string;
  username?: string;
}

interface RequestWithSession extends Request {
  session: Session & CustomSessionData;
  body: any;
}

const router = express.Router();

// Registration route
router.post('/register', async (req: RequestWithSession, res: Response) => {
  try {
    const result = registerSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ 
        message: "Ошибка валидации", 
        errors: result.error.issues 
      });
    }

    const { username, password, email, firstName, lastName } = result.data;

    // Check if username already exists
    const existingUser = await storage.getUserByUsername(username);
    if (existingUser) {
      return res.status(400).json({ message: "Пользователь с таким логином уже существует" });
    }

    // Check if email already exists (if provided)
    if (email) {
      const existingEmailUser = await storage.getUserByEmail(email);
      if (existingEmailUser) {
        return res.status(400).json({ message: "Пользователь с таким email уже существует" });
      }
    }

    // Create user
    const user = await storage.createUser({
      username,
      password,
      email,
      firstName,
      lastName,
    });

    // Create session
    req.session.userId = user.id;
    req.session.username = user.username;

    res.json({ user, message: "Регистрация прошла успешно" });
  } catch (error) {
    console.error("Error registering user:", error);
    res.status(500).json({ message: "Ошибка регистрации" });
  }
});

// Login route
router.post('/login', async (req: RequestWithSession, res: Response) => {
  try {
    const result = loginSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ 
        message: "Ошибка валидации", 
        errors: result.error.issues 
      });
    }

    const { username, password } = result.data;

    // Find user by username
    const user = await storage.getUserByUsername(username);
    if (!user) {
      return res.status(400).json({ message: "Неверный логин или пароль" });
    }

    // Check password
    if (user.password !== password) {
      return res.status(400).json({ message: "Неверный логин или пароль" });
    }

    // Create session
    req.session.userId = user.id;
    req.session.username = user.username;
    
    // Force session save and provide a temporary token
    req.session.save((err: any) => {
      if (err) {
        console.error("Session save error:", err);
      }
      
      const tempToken = Buffer.from(`${user.id}:${Date.now()}`).toString('base64');
      res.json({ 
        user, 
        message: "Вход выполнен успешно",
        token: tempToken
      });
    });
  } catch (error) {
    console.error("Error logging in:", error);
    res.status(500).json({ message: "Ошибка входа" });
  }
});

// Get current session
router.get('/session', async (req: RequestWithSession, res: Response) => {
  try {
    if (req.session?.userId) {
      const user = await storage.getUser(req.session.userId);
      if (user) {
        return res.json(user);
      }
    }
    res.status(401).json({ message: "Not authenticated" });
  } catch (error) {
    console.error("Error fetching session user:", error);
    res.status(500).json({ message: "Failed to fetch user" });
  }
});

// Logout route
router.post('/logout', (req: RequestWithSession, res: Response) => {
  req.session.destroy((err: Error | null) => {
    if (err) {
      return res.status(500).json({ message: "Ошибка выхода" });
    }
    res.json({ message: "Выход выполнен успешно" });
  });
});

// SMS authentication routes
router.post('/sms/login', async (req: Request, res: Response) => {
  try {
    const result = smsLoginSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ 
        message: "Ошибка валидации", 
        errors: result.error.issues 
      });
    }

    const { phone } = result.data;
    const code = await generateSMSCode();
    memoryCodeStorage.saveSmsCode(phone, code);
    await sendSMSCode(phone);

    res.json({ message: "Код отправлен" });
  } catch (error) {
    console.error("Error sending SMS code:", error);
    res.status(500).json({ message: "Ошибка отправки кода" });
  }
});

router.post('/sms/verify', async (req: RequestWithSession, res: Response) => {
  try {
    const result = smsVerifySchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ 
        message: "Ошибка валидации", 
        errors: result.error.issues 
      });
    }

    const { phone, code } = result.data;
    const isValid = memoryCodeStorage.verifySmsCode(phone, code);

    if (!isValid) {
      return res.status(400).json({ message: "Неверный код" });
    }

    // Create or get user
    let user = await storage.getUserByPhone(phone);
    if (!user) {
      user = await storage.createUserWithPhone(phone);
    }

    // Create session
    req.session.userId = user.id;
    res.json({ user, message: "Вход выполнен успешно" });
  } catch (error) {
    console.error("Error verifying SMS code:", error);
    res.status(500).json({ message: "Ошибка верификации" });
  }
});

// Telegram authentication routes
router.post('/telegram/login', async (req: Request, res: Response) => {
  try {
    const result = telegramLoginSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ 
        message: "Ошибка валидации", 
        errors: result.error.issues 
      });
    }

    const { telegram_id } = result.data;
    const code = await generateTelegramCode();
    memoryCodeStorage.saveTelegramCode(telegram_id, code);
    await sendTelegramCode(telegram_id);

    res.json({ message: "Код отправлен" });
  } catch (error) {
    console.error("Error sending Telegram code:", error);
    res.status(500).json({ message: "Ошибка отправки кода" });
  }
});

router.post('/telegram/verify', async (req: RequestWithSession, res: Response) => {
  try {
    const result = telegramVerifySchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ 
        message: "Ошибка валидации", 
        errors: result.error.issues 
      });
    }

    const { telegram_id, code } = result.data;
    const isValid = memoryCodeStorage.verifyTelegramCode(telegram_id, code);

    if (!isValid) {
      return res.status(400).json({ message: "Неверный код" });
    }

    // Create or get user
    let user = await storage.getUserByTelegramId(telegram_id);
    if (!user) {
      user = await storage.createUser({ telegramId: telegram_id });
    }

    // Create session
    req.session.userId = user.id;
    res.json({ user, message: "Вход выполнен успешно" });
  } catch (error) {
    console.error("Error verifying Telegram code:", error);
    res.status(500).json({ message: "Ошибка верификации" });
  }
});

export default router; 