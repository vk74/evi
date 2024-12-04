/* eslint-disable */
module.exports = {
  root: true,
  env: {
    node: true,
    es2022: true,
    'vue/setup-compiler-macros': true,
    es6: true  // Добавляем это
  },
  extends: [
    'plugin:vue/vue3-essential',
    'eslint:recommended',
    '@vue/typescript/recommended'
  ],
  parserOptions: {
    parser: '@typescript-eslint/parser',
    ecmaVersion: 2022,  // Изменим на конкретную версию
    sourceType: 'module'
  },
  rules: {
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-var-requires': 'off',
    'no-const-assign': 'error',  // Разрешаем использование const
    'prefer-const': 'warn'       // Предпочитаем const
  }
}