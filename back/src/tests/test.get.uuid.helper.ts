/**
 * Temporary test file to check the getUuidByUsername helper function
 */

import { getUuidByUsername } from '../core/helpers/get.uuid.by.username';

async function testGetUuidByUsername() {
  try {
    // Test for user "ii"
    const uuid = await getUuidByUsername("ii");
    console.log("UUID for user 'ii':", uuid);
    
    return uuid;
  } catch (error) {
    console.error("Test failed:", error);
    return null;
  }
}

// Execute the test
testGetUuidByUsername()
  .then(result => {
    console.log("Test completed with result:", result);
    process.exit(0);
  })
  .catch(err => {
    console.error("Test failed with error:", err);
    process.exit(1);
  });