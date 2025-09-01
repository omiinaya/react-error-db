// Simple verification test
const axios = require('axios');

const BASE_URL = 'http://localhost:3010/api';

async function verifyFix() {
  try {
    console.log('✅ Verifying the token refresh fix...');
    
    // 1. Login
    const login = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@errdb.com',
      password: 'admin123'
    });
    
    const { token, refreshToken } = login.data.data;
    
    // 2. Test refresh endpoint
    const refresh = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken });
    const newToken = refresh.data.data.token;
    
    // 3. Test new token works
    const timestamp = Date.now();
    const category = await axios.post(`${BASE_URL}/categories`, {
      name: `Verify ${timestamp}`,
      slug: `verify-${timestamp}`,
      description: 'Verification test'
    }, {
      headers: { Authorization: `Bearer ${newToken}` }
    });
    
    console.log('🎉 SUCCESS: Token refresh and category creation working!');
    console.log('   Category ID:', category.data.data.category.id);
    
  } catch (error) {
    console.error('❌ FAILED:', error.response?.data || error.message);
    process.exit(1);
  }
}

verifyFix();
