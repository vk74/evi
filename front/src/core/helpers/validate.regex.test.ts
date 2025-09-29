/**
 * @file validate.regex.test.ts
 * Version: 1.0.0
 * Test file for regex validation helper.
 * Frontend file that provides unit tests for regex validation functionality.
 */

import { validateRegexString, validateRegexStringDetailed, testRegexMatch } from './validate.regex';

/**
 * Test cases for regex validation
 */
const testCases = [
  // Valid regex patterns
  { input: '^[a-zA-Z0-9]+$', expected: true, description: 'Simple alphanumeric pattern' },
  { input: '^[a-zA-Z0-9.!#$%&\'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$', expected: true, description: 'Email regex pattern' },
  { input: '^\\+?[1-9]\\d{1,14}$', expected: true, description: 'Phone number pattern' },
  
  // Invalid regex patterns
  { input: '^[a-qA-Z0-9.!#$%&\'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$', expected: true, description: 'Modified email regex (a-q instead of a-z)' },
  { input: '', expected: false, description: 'Empty string' },
  { input: '   ', expected: false, description: 'Whitespace only' },
  { input: '[', expected: false, description: 'Unclosed bracket' },
  { input: '**', expected: true, description: 'Double asterisk (valid but with warnings)' },
  { input: '++', expected: true, description: 'Double plus (valid but with warnings)' },
];

/**
 * Run validation tests
 */
export function runValidationTests(): void {
  console.log('🧪 Running regex validation tests...');
  
  testCases.forEach((testCase, index) => {
    const result = validateRegexString(testCase.input);
    const passed = result.isValid === testCase.expected;
    
    console.log(`Test ${index + 1}: ${testCase.description}`);
    console.log(`  Input: ${testCase.input}`);
    console.log(`  Expected: ${testCase.expected}, Got: ${result.isValid}`);
    console.log(`  Result: ${passed ? '✅ PASS' : '❌ FAIL'}`);
    if (!result.isValid && result.error) {
      console.log(`  Error: ${result.error}`);
    }
    console.log('');
  });
}

/**
 * Run detailed validation tests
 */
export function runDetailedValidationTests(): void {
  console.log('🧪 Running detailed regex validation tests...');
  
  const detailedTestCases = [
    { input: '**', description: 'Double asterisk pattern' },
    { input: '++', description: 'Double plus pattern' },
    { input: '??', description: 'Double question mark pattern' },
    { input: '.*.*', description: 'Multiple dot-asterisk pattern' },
  ];
  
  detailedTestCases.forEach((testCase, index) => {
    const result = validateRegexStringDetailed(testCase.input);
    
    console.log(`Detailed Test ${index + 1}: ${testCase.description}`);
    console.log(`  Input: ${testCase.input}`);
    console.log(`  Valid: ${result.isValid}`);
    if (result.warnings && result.warnings.length > 0) {
      console.log(`  Warnings: ${result.warnings.join(', ')}`);
    }
    console.log('');
  });
}

/**
 * Run regex match tests
 */
export function runMatchTests(): void {
  console.log('🧪 Running regex match tests...');
  
  const matchTestCases = [
    { regex: '^[a-zA-Z0-9]+$', testString: 'test123', expected: true, description: 'Alphanumeric match' },
    { regex: '^[a-zA-Z0-9]+$', testString: 'test-123', expected: false, description: 'Alphanumeric with dash' },
    { regex: '^\\+?[1-9]\\d{1,14}$', testString: '+1234567890', expected: true, description: 'Phone number match' },
    { regex: '^\\+?[1-9]\\d{1,14}$', testString: 'abc', expected: false, description: 'Phone number with letters' },
  ];
  
  matchTestCases.forEach((testCase, index) => {
    const result = testRegexMatch(testCase.regex, testCase.testString);
    
    console.log(`Match Test ${index + 1}: ${testCase.description}`);
    console.log(`  Regex: ${testCase.regex}`);
    console.log(`  Test String: ${testCase.testString}`);
    console.log(`  Expected: ${testCase.expected}, Got: ${result.matches}`);
    console.log(`  Result: ${result.matches === testCase.expected ? '✅ PASS' : '❌ FAIL'}`);
    if (result.error) {
      console.log(`  Error: ${result.error}`);
    }
    console.log('');
  });
}

/**
 * Run all tests
 */
export function runAllTests(): void {
  console.log('🚀 Starting comprehensive regex validation tests...\n');
  
  runValidationTests();
  runDetailedValidationTests();
  runMatchTests();
  
  console.log('🏁 All tests completed!');
}
