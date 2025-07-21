# Backend Server

## Запуск в разных режимах

### Development режим (для локальной разработки)
```bash
npm run dev
```
- `NODE_ENV=development`
- `sameSite: 'lax'` - менее строгие настройки cookies
- Подходит для локальной разработки

### Production режим
```bash
npm start
```
- `NODE_ENV=production` (по умолчанию)
- `sameSite: 'strict'` - строгие настройки безопасности
- Подходит для production среды

### Production сборка
```bash
npm run build:prod
npm run serve
```

## Настройки Cookies

### Development (NODE_ENV=development)
```typescript
{
  httpOnly: true,
  secure: false,  // Разрешает HTTP для localhost
  sameSite: 'lax', // Менее строгие настройки
  maxAge: 7 * 24 * 60 * 60 * 1000
}
```

### Production (NODE_ENV=production)
```typescript
{
  httpOnly: true,
  secure: true,   // Требует HTTPS
  sameSite: 'strict', // Строгие настройки безопасности
  maxAge: 7 * 24 * 60 * 60 * 1000
}
```

## Проблемы с Cookies

Если возникают проблемы с cookies в development режиме:

1. Убедитесь, что запускаете сервер командой `npm run dev`
2. Проверьте, что фронтенд и бэкенд работают на правильных портах
3. Проверьте настройки CORS в `server.ts`
4. Убедитесь, что axios настроен с `withCredentials: true` 