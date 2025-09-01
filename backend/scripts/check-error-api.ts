import axios from 'axios';

async function checkErrorApi() {
  try {
    const response = await axios.get('http://localhost:3010/api/errors/67fe241d-9aa5-405b-8331-612cc0a0cbbc');
    console.log('API Response:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('Error fetching API:', error.response?.data || error.message);
  }
}

checkErrorApi();