/**
 * Version: 1.0.0
 * 
 * Test Sequencer for grouping and ordering tests by modules
 * This backend file provides custom test execution order to ensure logical flow:
 * 1. Type checking tests first
 * 2. Core module tests
 * 3. Authentication tests
 * 4. Admin module tests
 * 5. Main application modules
 * 
 * File: test-sequencer.ts
 */

const TestSequencer = require('@jest/test-sequencer').default;

class CustomTestSequencer extends TestSequencer {
  sort(tests: any[]): any[] {
    // Define priorities for different test types
    const getTestPriority = (testPath: string): number => {
      if (testPath.includes('ts-check')) return 1; // Type checking first
      if (testPath.includes('core/')) return 2; // Core modules
      if (testPath.includes('auth/')) return 3; // Auth modules
      if (testPath.includes('admin/')) return 4; // Admin modules
      if (testPath.includes('modules/')) return 5; // Main modules
      return 10; // Other tests
    };

    return tests.sort((testA, testB) => {
      const priorityA = getTestPriority(testA.path);
      const priorityB = getTestPriority(testB.path);
      
      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }
      
      // If priorities are the same, sort alphabetically
      return testA.path.localeCompare(testB.path);
    });
  }
}

module.exports = CustomTestSequencer; 