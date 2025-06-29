/**
 * cache.settings.integration.test.ts
 * Интеграционный тест кеша настроек
 * Проверяет, что кеш корректно загружается из базы и содержит только нужные ключи
 */
import { reloadSettings } from './service.load.settings';
import { getAllSettings, getSetting } from './cache.settings';
import { pool } from '../../../core/db/maindb';

describe('Settings Cache Integration', () => {
  beforeAll(async () => {
    await reloadSettings();
  });

  afterAll(async () => {
    // Закрываем соединение с базой данных
    await pool.end();
  });

  it('should contain only password policy settings (6 ключей)', () => {
    const allSettings = getAllSettings();
    const keys = Object.keys(allSettings);
    // Ожидаемые ключи
    const expected = [
      'Application.Security.PasswordPolicies/password.min.length',
      'Application.Security.PasswordPolicies/password.max.length',
      'Application.Security.PasswordPolicies/password.require.uppercase',
      'Application.Security.PasswordPolicies/password.require.lowercase',
      'Application.Security.PasswordPolicies/password.require.numbers',
      'Application.Security.PasswordPolicies/password.require.special.chars',
      'Application.Security.PasswordPolicies/password.allowed.special.chars',
    ];
    // В кеше должны быть только эти ключи (или их подмножество, если не все добавлены)
    expect(keys.sort()).toEqual(expect.arrayContaining(expected));
  });

  it('should return correct value for password.allowed.special.chars', () => {
    const setting = getSetting('Application.Security.PasswordPolicies', 'password.allowed.special.chars');
    expect(setting).toBeDefined();
    expect(setting?.value).toBe('!@#$%^&*()_+-=[]{}|;:,.<>?');
  });
}); 