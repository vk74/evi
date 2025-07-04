# Система тестирования фронтенда

## Структура

```
front/src/tests/
├── jest.config.ts          # Конфигурация Jest
├── test-sequencer.ts       # Последовательность выполнения тестов
├── tests.setup.ts          # Глобальная настройка тестов
├── index.ts               # Экспорт всех утилит
├── utils/
│   ├── test-utils.ts      # Вспомогательные функции для тестов
│   └── mock-utils.ts      # Утилиты для моков
├── types/
│   └── test-types.ts      # Типы для тестов
└── README.md              # Эта документация
```

## Команды

```bash
# Запуск всех тестов фронтенда
npm run test-front:all
```

## Структура тестов

Тест файлы должны храниться рядом с тестируемыми файлами:

```
src/modules/admin/users/UserEditor/
├── UserEditor.vue
└── UserEditor.test.ts

src/core/services/
├── service.fetch.username.by.uuid.ts
└── service.fetch.username.by.uuid.test.ts
```

## Использование утилит

### Импорт утилит

```typescript
import { 
  mountComponent, 
  createAxiosMock, 
  createLocalStorageMock,
  createRouterMock,
  createPiniaMock,
  createI18nMock
} from '@/tests';
```

### Пример теста Vue компонента

```typescript
import { mountComponent } from '@/tests';
import UserEditor from './UserEditor.vue';

describe('UserEditor', () => {
  it('should render correctly', () => {
    const wrapper = mountComponent(UserEditor, {
      props: {
        user: { id: 1, name: 'Test User' }
      }
    });
    
    expect(wrapper.exists()).toBe(true);
  });
});
```

### Пример теста сервиса

```typescript
import { createAxiosMock } from '@/tests';
import { fetchUsernameByUuid } from './service.fetch.username.by.uuid';

describe('fetchUsernameByUuid', () => {
  it('should fetch username successfully', async () => {
    const mockAxios = createAxiosMock();
    mockAxios.get.mockResolvedValue({ data: { username: 'testuser' } });
    
    const result = await fetchUsernameByUuid('123');
    
    expect(result).toBe('testuser');
  });
});
```

## Последовательность тестов

Тесты выполняются в следующем порядке:
1. `core/` - основные утилиты и сервисы
2. `modules/` - модули приложения
3. `utils/` - вспомогательные функции
4. `services/` - сервисы
5. `components/` - компоненты

## Настройки

### Jest конфигурация
- TypeScript поддержка через `ts-jest`
- jsdom окружение для DOM тестирования
- Поддержка Vue файлов через `@vue/vue3-jest`
- Настройка путей и алиасов (`@/` → `src/`)

### Глобальные моки
- `ResizeObserver`
- `window.matchMedia`
- `IntersectionObserver`

### Vue интеграция
Базовая настройка Vue Test Utils для тестирования компонентов.

## Типы

Все типы для тестов определены в `types/test-types.ts`:

- `TestComponentOptions` - опции для тестирования компонентов
- `MockAxiosResponse` - типы для моков axios
- `TestUtils` - интерфейс утилит для тестов
- `MockUtils` - интерфейс утилит для моков 