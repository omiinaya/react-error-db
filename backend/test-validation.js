// Test script to reproduce validation errors and capture detailed logs
const axios = require('axios');
const fs = require('fs');

const USE_HTTPS = process.env.USE_HTTPS === 'true';
const BASE_URL = `${USE_HTTPS ? 'https' : 'http'}://localhost:3001/api`;

async function testValidation() {
  console.log('Testing validation scenarios...\n');
  
  // Test 1: Empty solution text
  console.log('Test 1: Empty solution text');
  try {
    const response = await axios.post(`${BASE_URL}/errors/some-error-id/solutions`, {
      solutionText: ''
    }, {
      headers: {
        'Authorization': 'Bearer test-token', // This will fail auth but should show validation first
        'Content-Type': 'application/json'
      }
    });
    console.log('Unexpected success:', response.data);
  } catch (error) {
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Error details:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.log('Network error:', error.message);
    }
  }
  console.log('---\n');

  // Test 2: Solution text too short
  console.log('Test 2: Solution text too short (9 chars)');
  try {
    const response = await axios.post(`${BASE_URL}/errors/some-error-id/solutions`, {
      solutionText: 'Too short'
    }, {
      headers: {
        'Authorization': 'Bearer test-token',
        'Content-Type': 'application/json'
      }
    });
    console.log('Unexpected success:', response.data);
  } catch (error) {
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Error details:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.log('Network error:', error.message);
    }
  }
  console.log('---\n');

  // Test 3: Missing solution text
  console.log('Test 3: Missing solution text field');
  try {
    const response = await axios.post(`${BASE_URL}/errors/some-error-id/solutions`, {
      // Intentionally missing solutionText
    }, {
      headers: {
        'Authorization': 'Bearer test-token',
        'Content-Type': 'application/json'
      }
    });
    console.log('Unexpected success:', response.data);
  } catch (error) {
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Error details:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.log('Network error:', error.message);
    }
  }
  console.log('---\n');

  // Test 4: Valid solution text
  console.log('Test 4: Valid solution text (10+ chars)');
  try {
    const response = await axios.post(`${BASE_URL}/errors/some-error-id/solutions`, {
      solutionText: 'This is a valid solution text that meets the minimum length requirement'
    }, {
      headers: {
        'Authorization': 'Bearer test-token',
        'Content-Type': 'application/json'
      }
    });
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Error details:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.log('Network error:', error.message);
    }
  }
}

// Check if backend is running and test validation
testValidation().catch(console.error);