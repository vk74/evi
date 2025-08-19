# EV2 Project

**Version:** 0.5.0

EV2 is a full-stack application with backend (Express.js + TypeScript), frontend (Vue.js + Vuetify), and PostgreSQL database.

## Project Structure

```
ev2/
├── back/           # Backend (Express.js + TypeScript)
├── front/          # Frontend (Vue.js + Vuetify)
├── db/             # Database schema and migrations
├── scripts/        # Build and version scripts
├── VERSION         # Current version
├── CHANGELOG.md    # Change history
└── RELEASE.md      # Release process
```

## Quick Start

### Install Dependencies
```bash
npm run install:all
```

### Development Mode

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
npm run start:backend
```

### Frontend
```bash
npm run start:frontend
```

## Version Management

### Check Current Version
```bash
cat VERSION
```

### Sync Versions Across Components
```bash
npm run version:sync
```

### Bump Version
```bash
npm run version:bump:patch    # 0.5.0 → 0.5.1
npm run version:bump:minor    # 0.5.0 → 0.6.0
npm run version:bump:major    # 0.5.0 → 1.0.0
```

## Build and Test

### Build All Components
```bash
npm run build:all
```

### Run All Tests
```bash
npm run test:all
```

### Individual Commands
```bash
# Backend
npm run build:backend
npm run test:backend
npm run dev:backend

# Frontend
npm run build:frontend
npm run test:frontend
npm run dev:frontend
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

## Documentation

- [Release Process](RELEASE.md) - How to create releases
- [Changelog](CHANGELOG.md) - History of changes
- [Database Documentation](db/DB_README.md) - Database structure and migrations

## Development Workflow

1. **Create feature branch:**
   ```bash
   git checkout main
   git pull origin main
   git checkout -b feature/new-feature
   ```

2. **Develop and test:**
   ```bash
   npm run dev:backend    # Terminal 1
   npm run dev:frontend   # Terminal 2
   ```

3. **Commit and push:**
   ```bash
   git add .
   git commit -m "Add new feature"
   git push origin feature/new-feature
   ```

4. **Create Pull Request on GitHub**

5. **After merge, bump version:**
   ```bash
   npm run version:bump:minor
   git add .
   git commit -m "Release v0.6.0"
   git tag v0.6.0
   git push origin main --tags
   ```