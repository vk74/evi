/**
 * Утилиты для создания моков в тестах
 */

/**
 * Создает мок для Vue Router
 */
export function createRouterMock() {
  return {
    push: jest.fn(),
    replace: jest.fn(),
    go: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    currentRoute: {
      value: {
        path: '/',
        name: 'home',
        params: {},
        query: {},
        hash: ''
      }
    },
    route: {
      path: '/',
      name: 'home',
      params: {},
      query: {},
      hash: ''
    }
  };
}

/**
 * Создает мок для Pinia store
 */
export function createPiniaMock() {
  return {
    install: jest.fn(),
    state: {},
    _s: new Map(),
    _p: [],
    use: jest.fn()
  };
}

/**
 * Создает мок для i18n
 */
export function createI18nMock() {
  return {
    t: jest.fn((key: string) => key),
    te: jest.fn(() => false),
    d: jest.fn(),
    n: jest.fn(),
    locale: 'en',
    availableLocales: ['en', 'ru'],
    fallbackLocale: 'en'
  };
}

/**
 * Создает мок для события
 */
export function createEventMock(type: string, options: EventInit = {}) {
  return new Event(type, options);
}

/**
 * Создает мок для MouseEvent
 */
export function createMouseEventMock(type: string, options: MouseEventInit = {}) {
  return new MouseEvent(type, options);
}

/**
 * Создает мок для KeyboardEvent
 */
export function createKeyboardEventMock(type: string, options: KeyboardEventInit = {}) {
  return new KeyboardEvent(type, options);
}

/**
 * Создает мок для FormData
 */
export function createFormDataMock() {
  const formData = new FormData();
  return {
    append: jest.fn((key: string, value: any) => formData.append(key, value)),
    delete: jest.fn((key: string) => formData.delete(key)),
    get: jest.fn((key: string) => formData.get(key)),
    getAll: jest.fn((key: string) => formData.getAll(key)),
    has: jest.fn((key: string) => formData.has(key)),
    set: jest.fn((key: string, value: any) => formData.set(key, value)),
    entries: jest.fn(() => formData.entries()),
    keys: jest.fn(() => formData.keys()),
    values: jest.fn(() => formData.values()),
    forEach: jest.fn((callback: any) => formData.forEach(callback))
  };
}

/**
 * Создает мок для File
 */
export function createFileMock(name: string, content: string, type = 'text/plain') {
  return new File([content], name, { type });
}

/**
 * Создает мок для Blob
 */
export function createBlobMock(content: string, type = 'text/plain') {
  return new Blob([content], { type });
} 