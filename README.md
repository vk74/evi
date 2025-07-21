# EV2 Project

## Запуск в Development режиме

Для локальной разработки с менее строгими настройками cookies:

### Backend
```bash
cd back
npm run dev
```

### Frontend
```bash
cd front
npm run serve:dev
```

## Запуск в Production режиме

### Backend
```bash
cd back
npm start
```

### Frontend
```bash
cd front
npm run serve
```

## Различия между режимами

### Development режим
- `NODE_ENV=development`
- `sameSite: 'lax'` - менее строгие настройки cookies
- Подходит для локальной разработки
- Разрешает HTTP для localhost

### Production режим
- `NODE_ENV=production` (по умолчанию)
- `sameSite: 'strict'` - строгие настройки безопасности
- Подходит для production среды
- Требует HTTPS

## Устранение проблем с Cookies

Если refresh token не передается:

1. Убедитесь, что используете правильные команды запуска
2. Проверьте логи в консоли браузера и сервера
3. Проверьте настройки CORS в `back/src/server.ts`
4. Убедитесь, что axios настроен с `withCredentials: true`