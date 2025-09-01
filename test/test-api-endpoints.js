const axios = require('axios');

const API_BASE = 'http://localhost:3001/api';

async function testAPI() {
  console.log('🧪 Testing Error Database API Endpoints\n');

  try {
    // Test 1: Health endpoint
    console.log('1. Testing health endpoint...');
    const healthResponse = await axios.get(`${API_BASE}/health`);
    console.log('✅ Health endpoint:', healthResponse.data.status);
    
    // Test 2: Register user
    console.log('\n2. Testing user registration...');
    try {
      const registerResponse = await axios.post(`${API_BASE}/auth/register`, {
        email: 'testuser@example.com',
        username: 'testuser',
        password: 'Password123', // Must have uppercase, lowercase, and number
        displayName: 'Test User'
      });
      console.log('✅ User registered:', registerResponse.data.data.user.email);
    } catch (error) {
      if (error.response?.data?.error?.code === 'USER_EXISTS') {
        console.log('ℹ️  User already exists, testing login instead...');
      } else {
        console.log('❌ Registration failed:', error.response?.data?.error?.message || error.message);
      }
    }

    // Test 3: Login user
    console.log('\n3. Testing user login...');
    try {
      const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
        email: 'testuser@example.com',
        password: 'Password123'
      });
      const { token, user } = loginResponse.data.data;
      console.log('✅ Login successful:', user.email);
      console.log('   Token received:', token ? 'Yes' : 'No');
      
      // Test 4: Get current user
      console.log('\n4. Testing get current user...');
      const meResponse = await axios.get(`${API_BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('✅ Current user:', meResponse.data.data.user.email);

      // Test 5: Get applications
      console.log('\n5. Testing get applications...');
      const appsResponse = await axios.get(`${API_BASE}/applications`);
      console.log('✅ Applications found:', appsResponse.data.data.applications.length);

      // Test 6: Search error codes
      console.log('\n6. Testing error code search...');
      const errorsResponse = await axios.get(`${API_BASE}/errors`);
      console.log('✅ Error codes found:', errorsResponse.data.data.errors.length);

      // Test 7: Get user profile
      console.log('\n7. Testing user profile...');
      const profileResponse = await axios.get(`${API_BASE}/users/${user.id}`);
      console.log('✅ User profile:', profileResponse.data.data.user.username);

      console.log('\n🎉 All API endpoint tests completed successfully!');

    } catch (error) {
      console.log('❌ Test failed:', error.response?.data?.error?.message || error.message);
    }

  } catch (error) {
    console.log('❌ API test failed:', error.message);
  }
}

// Run the tests
testAPI();