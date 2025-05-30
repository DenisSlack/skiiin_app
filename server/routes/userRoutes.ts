import { Router } from 'express';
import { registerSchema, updateSkinProfileSchema } from '@shared/schema';
import { container } from '../di/container';

const router = Router();
const { userService } = container;

// Регистрация пользователя
router.post('/api/auth/register', async (req, res) => {
  try {
    const result = registerSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ 
        message: "Ошибка валидации", 
        errors: result.error.issues 
      });
    }
    const { username, password, email, firstName, lastName } = result.data;
    const existingUser = await userService.getUserByUsername(username);
    if (existingUser) {
      return res.status(400).json({ message: "Пользователь с таким логином уже существует" });
    }
    if (email) {
      const existingEmailUser = await userService.getUserByEmail(email);
      if (existingEmailUser) {
        return res.status(400).json({ message: "Пользователь с таким email уже существует" });
      }
    }
    const user = await userService.createUser({ username, password, email, firstName, lastName });
    (req.session as any).userId = user.id;
    (req.session as any).username = user.username;
    res.json({ user, message: "Регистрация прошла успешно" });
  } catch (error) {
    res.status(500).json({ message: "Ошибка регистрации" });
  }
});

// Получение текущего пользователя
router.get('/api/auth/user', async (req: any, res) => {
  try {
    if (req.session?.userId) {
      const user = await userService.getUserById(req.session.userId);
      if (user) {
        return res.json(user);
      }
    }
    res.status(401).json({ message: "Not authenticated" });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch user" });
  }
});

// Обновление skin profile
router.put('/api/profile/skin', async (req: any, res) => {
  try {
    if (!req.session?.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    const userId = req.session.userId;
    const profileData = updateSkinProfileSchema.parse(req.body);
    const updatedUser = await userService.updateSkinProfile(userId, profileData);
    res.json(updatedUser);
  } catch (error) {
    res.status(400).json({ message: "Failed to update skin profile" });
  }
});

export default router; 