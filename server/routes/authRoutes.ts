import { Router } from 'express';
import { storage } from '../storage';
import { loginSchema, registerSchema } from '../schemas/auth';
import { validate } from '../middleware/validate';

const router = Router();

// User login
router.post('/api/auth/login', validate(loginSchema), async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await storage.getUserByEmail(email);
    if (!user || user.password !== password) {
      return res.status(401).json({ message: 'Неверные учетные данные' });
    }
    req.session.userId = user.id;
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка входа' });
  }
});

// User logout
router.post('/api/auth/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ message: 'Ошибка выхода' });
    }
    res.json({ message: 'Выход выполнен успешно' });
  });
});

// Get current session user
router.get('/api/auth/session', async (req: any, res) => {
  try {
    if (req.session?.userId) {
      const user = await storage.getUser(req.session.userId);
      if (user) {
        return res.json(user);
      }
    }
    res.status(401).json({ message: 'Not authenticated' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch user' });
  }
});

// Admin login
router.post('/api/admin/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      (req.session as any).adminSession = { isAuthenticated: true, username };
      res.json({ success: true, message: 'Admin login successful' });
    } else {
      res.status(401).json({ message: 'Invalid admin credentials' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Login failed' });
  }
});

// Admin logout
router.post('/api/admin/logout', (req: any, res) => {
  req.session.adminSession = null;
  res.json({ success: true });
});

// User registration
router.post('/api/auth/register', validate(registerSchema), async (req, res) => {
  try {
    const { username, email, password, firstName, lastName } = req.body;
    // Проверка на существование пользователя с таким username
    const existingUser = await storage.getUserByUsername(username);
    if (existingUser) {
      return res.status(400).json({ message: 'Пользователь с таким логином уже существует' });
    }
    // Проверка на существование пользователя с таким email
    const existingEmailUser = await storage.getUserByEmail(email);
    if (existingEmailUser) {
      return res.status(400).json({ message: 'Пользователь с таким email уже существует' });
    }
    // Создание пользователя
    const user = await storage.createUser({ username, email, password, firstName, lastName });
    req.session.userId = user.id;
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка регистрации' });
  }
});

export default router; 