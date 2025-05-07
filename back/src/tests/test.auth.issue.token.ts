/**
 * Временный тестовый файл для проверки функциональности auth.issue.token.ts
 */

import { Request, Response } from 'express';
import issueToken from '../middleware/auth.issue.token';

// Мок для global.privateKey, необходимый для подписи JWT
declare global {
  var privateKey: string;
}

// Устанавливаем мок-значение для privateKey
if (!global.privateKey) {
  global.privateKey = '-----BEGIN PRIVATE KEY-----\nTESTKEY\n-----END PRIVATE KEY-----';
}

// Создаем мок Express запроса с пользовательскими данными
const mockRequest: any = {
  user: {
    username: 'ii',
    someField: 'value'
  }
};

// Создаем мок Express ответа
const mockResponse: any = {
  status: function(code: number) {
    console.log(`Response status set to: ${code}`);
    return this;
  },
  json: function(data: any) {
    console.log('Response data:', JSON.stringify(data, null, 2));
    return this;
  }
};

async function testIssueToken() {
  console.log('Testing auth.issue.token.ts with mock request and response');
  console.log('Mock request user:', mockRequest.user);
  
  try {
    // Вызываем функцию issueToken с мок-объектами
    await issueToken(mockRequest, mockResponse);
    console.log('Test completed');
  } catch (error) {
    console.error('Test failed with error:', error);
  }
}

// Запускаем тест
testIssueToken();