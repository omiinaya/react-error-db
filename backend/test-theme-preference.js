const axios = require('axios');

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3010/api';

async function testThemePreferenceFetching() {
  console.log('🧪 Testing theme preference fetching...\n');

  try {
    // Step 1: Login to get a valid token
    console.log('Step 1: Logging in to get authentication token...');
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: 'user@errdb.com',
      password: 'user123'
    });

    const { token, user } = loginResponse.data.data;
    console.log(`✅ Login successful for user: ${user.email}`);
    console.log(`   Token: ${token.substring(0, 20)}...`);

    // Step 2: Test theme preference endpoint
    console.log('\nStep 2: Testing theme preference endpoint...');
    
    try {
      const themeResponse = await axios.get(`${API_BASE_URL}/users/me/theme`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('✅ Theme preference fetched successfully!');
      console.log(`   Theme: ${themeResponse.data.data.themePreference}`);
    } catch (themeError) {
      console.log('❌ Failed to fetch theme preference');
      console.log(`   Error Status: ${themeError.response?.status}`);
      console.log(`   Error Code: ${themeError.response?.data?.error?.code}`);
      console.log(`   Error Message: ${themeError.response?.data?.error?.message}`);
      console.log(`   Full Error: ${JSON.stringify(themeError.response?.data, null, 2)}`);
    }

    // Step 3: Test with invalid token
    console.log('\nStep 3: Testing theme preference with invalid token...');
    
    try {
      const invalidThemeResponse = await axios.get(`${API_BASE_URL}/users/me/theme`, {
        headers: {
          'Authorization': `Bearer invalid_token_12345`
        }
      });
      console.log('❌ Expected 401 but got success response');
    } catch (invalidThemeError) {
      console.log('✅ Correctly rejected invalid token');
      console.log(`   Error Status: ${invalidThemeError.response?.status}`);
      console.log(`   Error Code: ${invalidThemeError.response?.data?.error?.code}`);
      console.log(`   Error Message: ${invalidThemeError.response?.data?.error?.message}`);
    }

    // Step 4: Test without token
    console.log('\nStep 4: Testing theme preference without token...');
    
    try {
      const noTokenResponse = await axios.get(`${API_BASE_URL}/users/me/theme`);
      console.log('❌ Expected 401 but got success response');
    } catch (noTokenError) {
      console.log('✅ Correctly rejected request without token');
      console.log(`   Error Status: ${noTokenError.response?.status}`);
      console.log(`   Error Code: ${noTokenError.response?.data?.error?.code}`);
      console.log(`   Error Message: ${noTokenError.response?.data?.error?.message}`);
    }

    // Step 5: Test with expired token scenario
    console.log('\nStep 5: Testing database query directly...');
    
    // Test if we can query the user table directly
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    try {
      const userWithTheme = await prisma.user.findUnique({
        where: { id: user.id },
        select: { themePreference: true }
      });
      
      console.log('✅ Direct database query successful!');
      console.log(`   Theme from DB: ${userWithTheme.themePreference}`);
    } catch (dbError) {
      console.log('❌ Direct database query failed');
      console.log(`   Error: ${dbError.message}`);
    } finally {
      await prisma.$disconnect();
    }

  } catch (error) {
    console.log('❌ Test failed with error:');
    console.log(`   Error: ${error.message}`);
    if (error.response) {
      console.log(`   Response Status: ${error.response.status}`);
      console.log(`   Response Data: ${JSON.stringify(error.response.data, null, 2)}`);
    }
  }
}

// Run the test
testThemePreferenceFetching().catch(console.error);