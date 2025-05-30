import { z } from 'zod';

export const loginSchema = z.object({
  username: z.string().min(1, 'Логин или email обязателен').trim().describe('Логин или email пользователя'),
  password: z.string().min(1, 'Пароль обязателен').describe('Пароль пользователя'),
}).describe('Схема входа пользователя');

export const registerSchema = z.object({
  username: z.string().min(3, 'Логин должен содержать минимум 3 символа').trim().describe('Логин пользователя'),
  password: z.string()
    .min(8, 'Пароль должен содержать минимум 8 символов')
    .regex(/[A-Z]/, 'Пароль должен содержать хотя бы одну заглавную букву')
    .regex(/[a-z]/, 'Пароль должен содержать хотя бы одну строчную букву')
    .regex(/[0-9]/, 'Пароль должен содержать хотя бы одну цифру')
    .describe('Пароль пользователя'),
  email: z.string().email('Некорректный email').trim().describe('Email пользователя'),
  firstName: z.string().min(2, 'Имя должно содержать минимум 2 символа').trim().describe('Имя пользователя'),
  lastName: z.string().min(2, 'Фамилия должна содержать минимум 2 символа').trim().describe('Фамилия пользователя'),
}).describe('Схема регистрации пользователя');

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>; 