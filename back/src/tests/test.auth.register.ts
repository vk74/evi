/**
 * Temporary test file to check auth.register.user.ts functionality
 */

import { Request, Response } from 'express';
import register from '../middleware/auth.register.user';

// Mock request with registration data
const mockRequest: any = {
  body: {
    username: 'testuser_' + Date.now(),
    password: 'password123',
    surname: 'TestSurname',
    name: 'TestName',
    email: 'test_' + Date.now() + '@example.com',
    phone: '+1234567890',
    address: 'Test Address 123'
  }
};

// Mock response
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

async function testRegister() {
  console.log('Testing auth.register.user.ts with mock request and response');
  console.log('Mock request body:', mockRequest.body);
  
  try {
    // Call register function with mock objects
    await register(mockRequest, mockResponse);
    console.log('Test completed with status:', mockResponse.statusCode);
    
    // If we got successful registration, try to register the same user again to test uniqueness checks
    if (mockResponse.statusCode === 201) {
      console.log('\nTesting username uniqueness check...');
      await register(mockRequest, mockResponse);
      console.log('Second test completed with status:', mockResponse.statusCode);
    }
  } catch (error) {
    console.error('Test failed with error:', error);
  }
}

// Run the test
testRegister();