/**
 * Version: 1.0.0
 * 
 * Global test setup configuration for Jest testing framework
 * This frontend file configures global mocks, timeouts, and environment settings
 * that are applied before each test execution. Handles DOM mocking,
 * test timeouts, and cleanup procedures for isolated test execution.
 * 
 * File: tests.setup.ts
 */

import { config } from '@vue/test-utils';

// Глобальная настройка Vue Test Utils
config.global.plugins = [];

// Global mocks for testing
global.console = {
  ...console,
  // Disable some logs in tests
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};

// Timeout configuration
jest.setTimeout(10000);

// Environment setup for tests
process.env.NODE_ENV = 'test';

// DOM mocks for frontend testing
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock for window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock for IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Clear all mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
});

// Restore all mocks after all tests
afterAll(() => {
  jest.restoreAllMocks();
});

// Глобальные утилиты для тестов
export const testUtils = {
  // Вспомогательная функция для создания компонента
  createComponent: (component: any, options: any = {}) => {
    return {
      ...options,
      global: {
        plugins: [],
        ...(options.global || {})
      }
    };
  }
}; 