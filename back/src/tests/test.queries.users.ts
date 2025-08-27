/**
 * Temporary test file to check queries.users.ts functionality
 */

import { userQueries } from '../core/guards/queries.users';

function testQueriesUsersTs() {
  console.log('Testing queries.users.ts');
  
  // Check if the object was imported correctly
  console.log('userQueries object type:', typeof userQueries);
  
  // Check if all expected queries are present and have correct structure
  const expectedQueries = [
    'checkUsername', 
    'checkEmail', 
    'getUserPassword', 
    'updateProfile', 
    'insertUserWithNames'
  ];
  
  for (const queryName of expectedQueries) {
    if (userQueries[queryName]) {
      console.log(`✓ Found query: ${queryName}`);
      console.log(`  - Name: ${userQueries[queryName].name}`);
      console.log(`  - Has SQL text: ${userQueries[queryName].text ? 'Yes' : 'No'}`);
    } else {
      console.log(`✗ Missing query: ${queryName}`);
    }
  }
  
  console.log('\nTest completed for queries.users.ts');
}

// Run the test
testQueriesUsersTs();