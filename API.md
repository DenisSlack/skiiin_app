# API Documentation

## Аутентификация

### Вход пользователя
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

Ответ:
```json
{
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "role": "user"
  },
  "session": {
    "access_token": "access_token",
    "refresh_token": "refresh_token"
  }
}
```

### Регистрация
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "name": "User Name"
}
```

### Выход
```http
POST /api/auth/logout
Authorization: Bearer access_token
```

## Продукты

### Получение списка продуктов
```http
GET /api/products
Authorization: Bearer access_token
```

Параметры запроса:
- `page` (опционально): номер страницы (по умолчанию 1)
- `limit` (опционально): количество продуктов на странице (по умолчанию 10)
- `search` (опционально): поиск по названию

### Добавление продукта
```http
POST /api/products
Authorization: Bearer access_token
Content-Type: application/json

{
  "name": "Product Name",
  "barcode": "123456789",
  "ingredients": ["ingredient1", "ingredient2"],
  "image": "base64_encoded_image"
}
```

### Получение информации о продукте
```http
GET /api/products/:id
Authorization: Bearer access_token
```

### Обновление продукта
```http
PUT /api/products/:id
Authorization: Bearer access_token
Content-Type: application/json

{
  "name": "Updated Product Name",
  "ingredients": ["updated_ingredient1", "updated_ingredient2"]
}
```

### Удаление продукта
```http
DELETE /api/products/:id
Authorization: Bearer access_token
```

## Анализ

### Сканирование продукта
```http
POST /api/analysis/scan
Authorization: Bearer access_token
Content-Type: application/json

{
  "image": "base64_encoded_image"
}
```

Ответ:
```json
{
  "text": "Распознанный текст с изображения",
  "confidence": 0.95
}
```

### Анализ состава
```http
POST /api/analysis/ingredients
Authorization: Bearer access_token
Content-Type: application/json

{
  "text": "Текст состава продукта"
}
```

Ответ:
```json
{
  "ingredients": [
    {
      "name": "Ингредиент 1",
      "description": "Описание ингредиента",
      "harmfulness": "low",
      "details": "Дополнительная информация"
    }
  ],
  "summary": "Общий анализ состава"
}
```

## Коды ошибок

- `400` - Неверный запрос
- `401` - Не авторизован
- `403` - Доступ запрещен
- `404` - Ресурс не найден
- `429` - Слишком много запросов
- `500` - Внутренняя ошибка сервера

## Ограничения

- Rate limiting: 100 запросов с одного IP за 15 минут
- Максимальный размер изображения: 5MB
- Максимальный размер JSON: 50MB 