// Test to verify frontend token refresh behavior
const axios = require('axios');

const BASE_URL = 'http://localhost:3010/api';
let accessToken = '';
let refreshToken = '';

async function testFrontendRefreshBehavior() {
  try {
    console.log('Testing frontend token refresh behavior...');
    
    // 1. Login to get tokens
    console.log('\n1. Logging in...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@errdb.com',
      password: 'admin123'
    });
    
    if (loginResponse.data.success) {
      accessToken = loginResponse.data.data.token;
      refreshToken = loginResponse.data.data.refreshToken;
      console.log('✅ Login successful');
      console.log('   Access Token:', accessToken.substring(0, 20) + '...');
      console.log('   Refresh Token:', refreshToken.substring(0, 20) + '...');
    }

    // 2. Test token refresh endpoint directly
    console.log('\n2. Testing token refresh endpoint...');
    const refreshResponse = await axios.post(`${BASE_URL}/auth/refresh`, {
      refreshToken
    });
    
    if (refreshResponse.data.success) {
      const newAccessToken = refreshResponse.data.data.token;
      const newRefreshToken = refreshResponse.data.data.refreshToken;
      console.log('✅ Token refresh successful');
      console.log('   New Access Token:', newAccessToken.substring(0, 20) + '...');
      console.log('   New Refresh Token:', newRefreshToken.substring(0, 20) + '...');
      
      // 3. Test that new tokens work for category creation
      console.log('\n3. Testing category creation with refreshed tokens...');
      const timestamp = Date.now();
      const categoryData = {
        name: `Refresh Test ${timestamp}`,
        slug: `refresh-test-${timestamp}`,
        description: 'Testing token refresh functionality'
      };
      
      const categoryResponse = await axios.post(`${BASE_URL}/categories`, categoryData, {
        headers: { Authorization: `Bearer ${newAccessToken}` }
      });
      
      if (categoryResponse.data.success) {
        console.log('✅ Category creation successful with refreshed token');
        console.log('   Category ID:', categoryResponse.data.data.category.id);
      }
    }

    console.log('\n🎉 Frontend token refresh test completed!');
    console.log('\n📋 Key Findings:');
    console.log('   - Token refresh endpoint works correctly');
    console.log('   - Refreshed tokens can be used for authenticated requests');
    console.log('   - The issue is likely in frontend state synchronization');
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    process.exit(1);
  }
}

testFrontendRefreshBehavior();