/**
 * Временный тестовый файл для проверки функциональности users.update.profile.ts
 */

import { Request, Response } from 'express';
import updateUserProfile from '../middleware/users.update.profile';

// Мок-данные для запроса
const mockRequest: any = {
  user: {
    username: 'ii'  // Используем существующего пользователя
  },
  body: {
    first_name: 'Иван',
    last_name: 'Иванов',
    middle_name: 'Иванович',
    gender: 'm',
    phone_number: '+7 916 543 9078',
    address: 'Улица Тестовая, 123',
    company_name: 'Тестовая Компания',
    position: 'Тестировщик'
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

async function testUpdateUserProfile() {
  console.log('Testing users.update.profile.ts with mock request and response');
  console.log('Attempting to update profile for username:', mockRequest.user.username);
  console.log('Update data:', JSON.stringify(mockRequest.body, null, 2));
  
  try {
    // Вызываем функцию updateUserProfile с мок-объектами
    await updateUserProfile(mockRequest, mockResponse);
    console.log('Test completed with status:', mockResponse.statusCode);
    
    // Проверка ответа
    if (mockResponse.statusCode === 0) {
      console.log('Profile update successful');
    } else {
      console.log('Profile update failed with status:', mockResponse.statusCode);
    }
  } catch (error) {
    console.error('Test failed with unexpected error:', error);
  }
}

// Запускаем тест
testUpdateUserProfile();