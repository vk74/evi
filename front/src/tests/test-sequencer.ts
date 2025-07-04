/**
 * Version: 1.0.0
 * 
 * Test Sequencer for grouping and ordering tests by modules
 * This frontend file provides custom test execution order to ensure logical flow:
 * 1. Core module tests
 * 2. Services tests
 * 3. Components tests
 * 4. Module tests
 * 
 * File: test-sequencer.ts
 */

const TestSequencer = require('@jest/test-sequencer').default;

class CustomTestSequencer extends TestSequencer {
  sort(tests: any[]): any[] {
    // Define priorities for different test types
    const getTestPriority = (testPath: string): number => {
      if (testPath.includes('/core/')) return 1; // Core modules first
      if (testPath.includes('/services/')) return 2; // Services
      if (testPath.includes('/components/')) return 3; // Components
      if (testPath.includes('/modules/')) return 4; // Main modules
      if (testPath.includes('/utils/')) return 5; // Utils
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