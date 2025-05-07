/**
 * Временный тестовый файл для проверки функциональности users.get.profile.ts
 */

import { Request, Response } from 'express';
import getUserProfile from '../middleware/users.get.profile';

// Мок-данные для запроса
const mockRequest: any = {
  user: {
    username: 'ii'  // Используем существующее имя пользователя для получения реального профиля
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

async function testGetUserProfile() {
  console.log('Testing users.get.profile.ts with mock request and response');
  console.log('Attempting to retrieve profile for username:', mockRequest.user.username);
  
  try {
    // Вызываем функцию getUserProfile с мок-объектами
    await getUserProfile(mockRequest, mockResponse);
    console.log('Test completed with status:', mockResponse.statusCode);
    
    // Проверка ответа
    if (mockResponse.statusCode === 0) {
      console.log('Profile retrieval successful');
    } else {
      console.log('Profile retrieval failed with status:', mockResponse.statusCode);
    }
  } catch (error) {
    console.error('Test failed with unexpected error:', error);
  }
}

// Запускаем тест
testGetUserProfile();