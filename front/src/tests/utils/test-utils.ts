import { mount, type MountingOptions } from '@vue/test-utils';
import type { ComponentMountingOptions } from '@vue/test-utils';

/**
 * Вспомогательная функция для монтирования компонентов
 */
export function mountComponent<T>(
  component: T,
  options: ComponentMountingOptions<T> = {}
) {
  return mount(component, {
    global: {
      plugins: [],
      ...options.global
    },
    ...options
  });
}

/**
 * Создает мок для axios
 */
export function createAxiosMock() {
  return {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    patch: jest.fn(),
    interceptors: {
      request: {
        use: jest.fn(),
        eject: jest.fn()
      },
      response: {
        use: jest.fn(),
        eject: jest.fn()
      }
    }
  };
}

/**
 * Создает мок для localStorage
 */
export function createLocalStorageMock() {
  const store: Record<string, string> = {};
  
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      Object.keys(store).forEach(key => delete store[key]);
    }),
    length: Object.keys(store).length,
    key: jest.fn((index: number) => Object.keys(store)[index] || null)
  };
}

/**
 * Создает мок для sessionStorage
 */
export function createSessionStorageMock() {
  return createLocalStorageMock();
}

/**
 * Ожидание асинхронных операций
 */
export function waitForNextTick() {
  return new Promise(resolve => setTimeout(resolve, 0));
}

/**
 * Очистка всех моков
 */
export function clearAllMocks() {
  jest.clearAllMocks();
  jest.clearAllTimers();
} 