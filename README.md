# Food Scanner API

API для сканирования и анализа состава продуктов питания с использованием искусственного интеллекта.

## Технологии

- **Backend**: Node.js, Express, TypeScript
- **Frontend**: React, Vite, TailwindCSS
- **База данных**: PostgreSQL (Neon)
- **Аутентификация**: Supabase Auth
- **AI**: Perplexity AI, Google AI
- **Тестирование**: Jest
- **Логирование**: Winston
- **Линтинг**: ESLint + Prettier

## Требования

- Node.js 18+
- PostgreSQL
- Ключи API для:
  - Perplexity AI
  - Google AI
  - Supabase

## Установка

1. Клонируйте репозиторий:
```bash
git clone [url-репозитория]
cd food-scanner-api
```

2. Установите зависимости:
```bash
npm install
```

3. Создайте файл `.env` на основе `.env.example`:
```bash
cp .env.example .env
```

4. Заполните необходимые переменные окружения в `.env`

5. Примените миграции базы данных:
```bash
npm run db:push
```

## Разработка

Запуск сервера разработки:
```bash
npm run dev
```

Сборка проекта:
```bash
npm run build
```

Запуск в production:
```bash
npm start
```

## Тестирование

Запуск тестов:
```bash
npm test
```

## Линтинг и форматирование

Проверка кода:
```bash
npm run lint
```

Автоматическое исправление проблем:
```bash
npm run lint:fix
```

Форматирование кода:
```bash
npm run format
```

## Структура проекта

```
├── client/                 # Frontend приложение
│   ├── src/
│   │   ├── components/    # React компоненты
│   │   ├── pages/        # Страницы приложения
│   │   └── utils/        # Вспомогательные функции
│   └── index.html
├── server/                # Backend приложение
│   ├── routes/           # API роуты
│   ├── services/         # Бизнес-логика
│   ├── utils/            # Вспомогательные функции
│   └── index.ts          # Точка входа
├── tests/                # Тесты
└── logs/                 # Логи приложения
```

## API Endpoints

### Аутентификация
- `POST /api/auth/login` - Вход пользователя
- `POST /api/auth/register` - Регистрация
- `POST /api/auth/logout` - Выход

### Продукты
- `GET /api/products` - Список продуктов
- `POST /api/products` - Добавление продукта
- `GET /api/products/:id` - Информация о продукте
- `PUT /api/products/:id` - Обновление продукта
- `DELETE /api/products/:id` - Удаление продукта

### Анализ
- `POST /api/analysis/scan` - Сканирование продукта
- `POST /api/analysis/ingredients` - Анализ состава

## Логирование

Логи сохраняются в директории `logs/`:
- `error-YYYY-MM-DD.log` - Логи ошибок
- `all-YYYY-MM-DD.log` - Все логи

## Безопасность

- Rate limiting: 100 запросов с одного IP за 15 минут
- CSP настроен для защиты от XSS
- Валидация входных данных через Zod
- Безопасное хранение паролей через Supabase Auth

## Лицензия

MIT 

## 📖 Документация API (Swagger/OpenAPI)

- Актуальная документация и тестирование API доступны по адресу:
  
  ```
  http://localhost:5000/api/docs
  ```
  или на вашем сервере по пути `/api/docs`.

- Документация генерируется автоматически на основе схем валидации (Zod) и всегда соответствует актуальному состоянию API.

## ⚙️ Переменные окружения

Для корректной работы сервера необходимо задать следующие переменные окружения:

- `SUPABASE_URL` — URL вашего проекта Supabase
- `SUPABASE_ANON_KEY` — публичный ключ Supabase
- `SUPABASE_SERVICE_ROLE_KEY` — сервисный ключ Supabase (для админских операций)
- `PERPLEXITY_API_KEY` — ключ для интеграции с Perplexity AI (если используется)
- `GEMINI_API_KEY` — ключ для Google Gemini (если используется)
- `ADMIN_USERNAME` и `ADMIN_PASSWORD` — логин и пароль администратора (опционально)
- `SESSION_SECRET` — секрет для сессий (если используется cookie-based аутентификация)
- `SMSAERO_API_KEY`, `SMSAERO_EMAIL` — для интеграции с SMS Aero (если используется) 