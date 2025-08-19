# EV2 Project

**Version:** [See VERSION file]

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

#### Option 1: Local Development (recommended for coding)
Для локальной разработки с менее строгими настройками cookies:

```bash
# Backend
npm run dev:backend

# Frontend (in another terminal)
npm run dev:frontend
```

#### Option 2: Docker Development (recommended for testing)
Для тестирования полного приложения в контейнерах:

```bash
# Interactive Docker build
npm run dev:docker

# Follow the prompts to build images
# Then start containers:
docker-compose -f deployment/docker-compose.local.yml --env-file .env.local up -d

# Useful commands:
# docker-compose -f deployment/docker-compose.local.yml ps          # Check status
# docker-compose -f deployment/docker-compose.local.yml logs -f    # View logs
# docker-compose -f deployment/docker-compose.local.yml down       # Stop containers
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

### Automatic Versioning
Versions are automatically managed during GitHub releases:
1. Create a release tag (e.g., `v1.0.0`)
2. GitHub Actions automatically updates all version files
3. Docker images are built with the new version
4. Deployment package is created

### Manual Version Sync (if needed)
```bash
npm run version:sync
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

5. **Create release:**
   ```bash
   # Create and push tag
   git tag v1.0.0
   git push origin v1.0.0
   
   # Create release on GitHub (this triggers automatic build)
   ```