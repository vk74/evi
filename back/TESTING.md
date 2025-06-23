# Тестирование проекта

## Структура тестирования

### Глобальная организация
- `src/tests/tests.index.ts` - главный индексный файл всех тестов
- `src/tests/tests.setup.ts` - глобальные настройки для всех тестов
- `src/tests/test-sequencer.ts` - упорядочивание выполнения тестов

### Расположение тестов
Тесты размещаются рядом с тестируемым кодом с суффиксом `.test.ts`:
```
src/
├── modules/
│   └── admin/
│       └── users/
│           └── userEditor/
│               ├── service.create.user.ts
│               └── service.create.user.test.ts
└── tests/
    ├── tests.index.ts
    ├── tests.setup.ts
    └── test-sequencer.ts
```

## Команды для тестирования

### Основные команды
```bash
# Запуск всех тестов
npm run test:all

# Запуск тестов в режиме наблюдения
npm run test:watch

# Запуск тестов с покрытием кода
npm run test:coverage

# Быстрая проверка типов
npm run test:quick
```

### Тестирование по модулям
```bash
# Тесты core модулей
npm run test:core

# Тесты auth модулей
npm run test:auth

# Тесты admin модулей
npm run test:admin

# Тесты основных модулей
npm run test:modules
```

### Отладка
```bash
# Подробный вывод с детекцией открытых хендлеров
npm run test:debug
```

## Конфигурация Jest

### Основные настройки
- **Preset**: `ts-jest` для TypeScript
- **Environment**: Node.js
- **Coverage**: HTML, LCOV, текстовые отчеты
- **Timeout**: 10 секунд на тест
- **Parallel**: 50% от доступных CPU

### Пороги покрытия кода
- Branches: 50%
- Functions: 50%
- Lines: 50%
- Statements: 50%

## Лучшие практики

### Наименование тестов
```typescript
describe('Service Name', () => {
  describe('Method Name', () => {
    it('should do something when condition', () => {
      // test implementation
    });
  });
});
```

### Моки и стабы
```typescript
// Мок модуля
jest.mock('@/core/db/database');

// Мок функции
const mockQuery = jest.fn();
jest.spyOn(db, 'query').mockImplementation(mockQuery);
```

### Тестовые данные
```typescript
const testUser = {
  username: `testuser_${Date.now()}`,
  email: `test_${Date.now()}@example.com`,
  password: 'TestPassword123!'
};
```

### Асинхронные тесты
```typescript
it('should handle async operation', async () => {
  const result = await service.asyncMethod();
  expect(result).toBeDefined();
});
```

## Структура тестового файла

```typescript
import { service } from './service';

// Моки
jest.mock('@/core/db/database');
jest.mock('@/core/eventBus/bus.events');

describe('Service Name', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Validation', () => {
    it('should validate input data', () => {
      // validation tests
    });
  });

  describe('Success cases', () => {
    it('should handle successful operation', () => {
      // success tests
    });
  });

  describe('Error handling', () => {
    it('should handle errors gracefully', () => {
      // error tests
    });
  });
});
```

## CI/CD интеграция

### GitHub Actions (пример)
```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test:coverage
```

## Отчеты

### Покрытие кода
Отчеты покрытия генерируются в папке `coverage/`:
- `coverage/lcov-report/index.html` - HTML отчет
- `coverage/lcov.info` - LCOV файл для CI/CD

### Результаты тестов
Jest выводит результаты в консоль с цветовой индикацией:
- ✅ PASS - тест прошел
- ❌ FAIL - тест провалился
- ⚠️ SKIP - тест пропущен

## Troubleshooting

### Частые проблемы
1. **Моки не работают** - проверьте правильность путей импорта
2. **Асинхронные тесты падают** - используйте `async/await` или `done` callback
3. **Покрытие кода не генерируется** - убедитесь что `collectCoverage: true`

### Отладка
```bash
# Подробный вывод Jest
npm run test:debug

# Запуск одного теста
npm test -- --testNamePattern="should create user"

# Запуск тестов из конкретного файла
npm test -- service.create.user.test.ts
``` 