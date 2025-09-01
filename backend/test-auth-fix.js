// Test script to verify authentication fix is working
const axios = require('axios');

const BASE_URL = 'http://localhost:3010/api'; // Backend running on port 3010

// Test with an expired token (this should return 401 now instead of 400)
async function testAuthFix() {
  console.log('Testing authentication fix...\n');
  
  // Using an obviously expired/invalid token
  const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyMzkwMjJ9.4Adcj3UFYzPUVaVF43FmMab6RlaQD3A5n9tLMN-7eEo';
  
  try {
    const response = await axios.post(`${BASE_URL}/errors/test-error-id/solutions`, {
      solutionText: 'This is a test solution that should be valid'
    }, {
      headers: {
        'Authorization': `Bearer ${expiredToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Unexpected success - should have failed with 401:');
    console.log('Status:', response.status);
    console.log('Response:', response.data);
  } catch (error) {
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Error Code:', error.response.data?.error?.code);
      console.log('Error Message:', error.response.data?.error?.message);
      console.log('Full Response:', JSON.stringify(error.response.data, null, 2));
      
      if (error.response.status === 401) {
        console.log('\n✅ SUCCESS: Authentication fix is working! Returning 401 for expired tokens.');
      } else if (error.response.status === 400) {
        console.log('\n❌ FAILURE: Still returning 400 instead of 401 for authentication errors.');
      }
    } else {
      console.log('Network error:', error.message);
    }
  }
}

// Also test without any token
async function testNoToken() {
  console.log('\nTesting without any token...\n');
  
  try {
    const response = await axios.post(`${BASE_URL}/errors/test-error-id/solutions`, {
      solutionText: 'This is a test solution'
    });
    
    console.log('Unexpected success - should have failed with 401:');
    console.log('Status:', response.status);
    console.log('Response:', response.data);
  } catch (error) {
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Error Code:', error.response.data?.error?.code);
      console.log('Error Message:', error.response.data?.error?.message);
      
      if (error.response.status === 401) {
        console.log('\n✅ SUCCESS: Properly returning 401 for missing tokens.');
      }
    } else {
      console.log('Network error:', error.message);
    }
  }
}

// Run tests
testAuthFix().then(() => {
  setTimeout(testNoToken, 1000);
}).catch(console.error);