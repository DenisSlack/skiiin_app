import { Router } from 'express';
import { loginSchema, registerSchema } from '../schemas/auth';
import { validate } from '../middleware/validate';

const router = Router();

router.post('/login', validate(loginSchema), async (req, res) => {
  // ... существующий код ...
});

router.post('/register', validate(registerSchema), async (req, res) => {
  // ... существующий код ...
});

router.post('/logout', async (req, res) => {
  // ... существующий код ...
});

export default router; 