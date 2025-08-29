// Simple test script to verify token refresh functionality
const axios = require('axios');

const BASE_URL = 'http://localhost:3010/api';
let accessToken = '';
let refreshToken = '';

async function testTokenRefresh() {
  try {
    console.log('Testing token refresh functionality...');
    
    // 1. First, login to get tokens
    console.log('\n1. Logging in to get initial tokens...');
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
    } else {
      throw new Error('Login failed');
    }
    
    // 2. Test that we can make an authenticated request
    console.log('\n2. Testing authenticated request...');
    const authResponse = await axios.get(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    
    if (authResponse.data.success) {
      console.log('✅ Authenticated request successful');
      console.log('   User:', authResponse.data.data.user.email);
    }
    
    // 3. Test token refresh endpoint
    console.log('\n3. Testing token refresh endpoint...');
    const refreshResponse = await axios.post(`${BASE_URL}/auth/refresh`, {
      refreshToken
    });
    
    if (refreshResponse.data.success) {
      const newAccessToken = refreshResponse.data.data.token;
      const newRefreshToken = refreshResponse.data.data.refreshToken;
      console.log('✅ Token refresh successful');
      console.log('   New Access Token:', newAccessToken.substring(0, 20) + '...');
      console.log('   New Refresh Token:', newRefreshToken.substring(0, 20) + '...');
      
      // Update tokens
      accessToken = newAccessToken;
      refreshToken = newRefreshToken;
    }
    
    // 4. Test that we can use the new token
    console.log('\n4. Testing request with refreshed token...');
    const refreshedAuthResponse = await axios.get(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    
    if (refreshedAuthResponse.data.success) {
      console.log('✅ Refreshed token works correctly');
    }
    
    console.log('\n🎉 All token refresh tests passed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    process.exit(1);
  }
}

// Run the test
testTokenRefresh();