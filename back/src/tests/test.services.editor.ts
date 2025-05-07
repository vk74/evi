/**
 * Временный тестовый файл для проверки функциональности services.editor.ts
 */

import { Request, Response } from 'express';
import { serviceEditor } from '../middleware/services.editor';

// Мок-данные для запроса
const mockRequest: any = {
  user: {
    username: 'ii',
    uuid: '56054f30-799e-41f1-a593-9b3d03f68c6a'
  },
  body: {
    name: 'Тестовый сервис',
    status: 'active',
    visibility: 'public',
    shortDescription: 'Краткое описание тестового сервиса',
    priority: 3,
    fullDescription: 'Подробное описание тестового сервиса. Здесь должен быть более длинный текст с детальной информацией.',
    purpose: 'Тестирование функциональности',
    comments: 'Тестовые комментарии'
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

async function testServiceEditor() {
  console.log('Testing services.editor.ts with mock request and response');
  console.log('Request body:', JSON.stringify(mockRequest.body, null, 2));
  
  try {
    // Вызываем функцию serviceEditor с мок-объектами
    await serviceEditor(mockRequest, mockResponse);
    console.log('Test completed with status:', mockResponse.statusCode);
    
    // Проверка ответа
    if (mockResponse.statusCode === 201) {
      console.log('Service creation successful');
    } else {
      console.log('Service creation failed with status:', mockResponse.statusCode);
    }
  } catch (error) {
    console.error('Test failed with unexpected error:', error);
  }
}

// Запускаем тест
testServiceEditor();