/**
 * Временный тестовый файл для проверки функциональности users.change.password.ts
 */

import { Request, Response } from 'express';
import changeUserPassword from '../middleware/users.change.password';

// Мок-данные для запроса
const mockRequest: any = {
  body: {
    username: 'ii', // Используем существующего пользователя
    currentPassword: 'password123', // Это должен быть актуальный пароль пользователя
    newPassword: 'NewPassword123!'
  }
};

// Мок для ответа
const mockResponse: any = {
  status: function(code: number) {
    console.log(`Response status set to: ${code}`);
    this.statusCode = code;
    return this;
  },
  json: function(data: any) {
    console.log('Response data:', JSON.stringify(data, null, 2));
    this.responseData = data;
    return this;
  },
  statusCode: 0,
  responseData: null
};

async function testChangeUserPassword() {
  console.log('Testing users.change.password.ts with mock request and response');
  console.log('Attempting to change password for username:', mockRequest.body.username);
  
  try {
    // Вызываем функцию changeUserPassword с мок-объектами
    await changeUserPassword(mockRequest, mockResponse);
    console.log('Test completed with status:', mockResponse.statusCode);
    
    // Проверка ответа
    if (mockResponse.statusCode === 200) {
      console.log('Password change successful');
    } else {
      console.log('Password change failed with status:', mockResponse.statusCode);
    }
  } catch (error) {
    console.error('Test failed with unexpected error:', error);
  }
}

// Запускаем тест
testChangeUserPassword();