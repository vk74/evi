/* eslint-disable */
module.exports = {
  root: true,
  env: {
    node: true,
    es2022: true,           // Добавляем поддержку современного JS
    'vue/setup-compiler-macros': true  // Добавляем поддержку Vue 3 макросов
  },
  extends: [
    'plugin:vue/vue3-essential',
    'eslint:recommended'
  ],
  parserOptions: {
    parser: '@babel/eslint-parser',
    requireConfigFile: false,
    babelOptions: {
      configFile: './babel.config.js'
    },
    ecmaVersion: 'latest'    // Явно указываем использование последней версии ECMAScript
  },
  rules: {
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off'
  }
}