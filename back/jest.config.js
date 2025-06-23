module.exports = {
  // Используем ts-jest для работы с TypeScript
  preset: 'ts-jest',
  
  // Окружение Node.js для backend тестов
  testEnvironment: 'node',
  
  // Корневая директория для поиска тестов
  roots: ['<rootDir>/src'],
  
  // Паттерны для поиска тестовых файлов
  testMatch: [
    '**/*.test.ts',           // любые файлы с суффиксом .test.ts
    '**/*.spec.ts',           // любые файлы с суффиксом .spec.ts
    '**/__tests__/**/*.ts'    // любые .ts файлы в папках __tests__
  ],
  
  // Алиасы для импортов (соответствует настройкам в tsconfig.json)
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  
  // Файл настройки, выполняемый перед каждым тестом
  setupFilesAfterEnv: ['<rootDir>/src/tests/tests.setup.ts'],
  
  // Настройка покрытия кода
  collectCoverageFrom: [
    'src/**/*.ts',              // включаем все .ts файлы из src
    '!src/**/*.test.ts',        // исключаем тестовые файлы
    '!src/**/*.spec.ts',        // исключаем spec файлы
    '!src/**/__tests__/**',     // исключаем папки __tests__
    '!src/**/*.d.ts',           // исключаем файлы типов
    '!src/tests/**',            // исключаем отдельную папку tests
    '!dist/**'                  // исключаем продакшн сборку
  ],
  
  // Директория для отчетов покрытия кода
  coverageDirectory: 'coverage',
  
  // Форматы отчетов покрытия
  coverageReporters: ['text', 'lcov', 'html'],
  
  // Пороговые значения покрытия кода
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50
    }
  },
  
  // Очищать моки между тестами
  clearMocks: true,
  
  // Показывать покрытие кода в консоли
  collectCoverage: false, // по умолчанию выключено, включается через --coverage
  
  // Таймаут для тестов (в миллисекундах)
  testTimeout: 10000,
  
  // Параллельное выполнение тестов
  maxWorkers: '50%',
  
  // Группировка тестов по модулям
  testSequencer: '<rootDir>/src/tests/test-sequencer.ts'
}; 