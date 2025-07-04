/**
 * Version: 1.0.0
 * 
 * Global test index for centralized test management
 * This frontend file imports and registers all test utilities for unified execution.
 * Provides a single entry point for running all tests and ensures proper
 * test discovery and organization across the application modules.
 * 
 * File: tests.index.ts
 */

// Экспорт утилит для тестов
export * from './utils/test-utils';
export * from './utils/mock-utils';

// Экспорт типов
export * from './types/test-types';

// Экспорт глобальных настроек
export { testUtils } from './tests.setup';

console.log('🧪 Frontend test utilities loaded'); 