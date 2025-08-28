#!/usr/bin/env node

/**
 * Test script to verify admin functionality
 * This script tests the admin endpoints and functionality
 */

const axios = require('axios');
const { program } = require('commander');

const BASE_URL = 'http://localhost:3001/api';

// Test admin user credentials (you'll need to create this user first)
const ADMIN_USER = {
  email: 'admin@example.com',
  password: 'admin123'
};

let authToken = '';

// Helper function to make authenticated requests
async function makeRequest(method, url, data = null, headers = {}) {
  const config = {
    method,
    url: `${BASE_URL}${url}`,
    headers: {
      'Content-Type': 'application/json',
      ...headers
    }
  };

  if (authToken) {
    config.headers.Authorization = `Bearer ${authToken}`;
  }

  if (data) {
    config.data = data;
  }

  try {
    const response = await axios(config);
    return response.data;
  } catch (error) {
    console.error(`Error ${method} ${url}:`, error.response?.data || error.message);
    throw error;
  }
}

// Test functions
async function testAdminLogin() {
  console.log('Testing admin login...');
  const response = await makeRequest('post', '/auth/login', {
    email: ADMIN_USER.email,
    password: ADMIN_USER.password
  });

  if (response.success && response.token) {
    authToken = response.token;
    console.log('✅ Admin login successful');
    console.log(`User: ${response.user.email}, Admin: ${response.user.isAdmin}`);
    return true;
  } else {
    console.log('❌ Admin login failed');
    return false;
  }
}

async function testAdminDashboard() {
  console.log('\nTesting admin dashboard...');
  try {
    const response = await makeRequest('get', '/admin/dashboard/stats');
    console.log('✅ Admin dashboard accessible');
    console.log('Stats:', response.stats);
    return true;
  } catch (error) {
    console.log('❌ Admin dashboard access failed');
    return false;
  }
}

async function testUserManagement() {
  console.log('\nTesting user management...');
  try {
    const response = await makeRequest('get', '/admin/users');
    console.log('✅ User management accessible');
    console.log(`Total users: ${response.data.users.length}`);
    return true;
  } catch (error) {
    console.log('❌ User management access failed');
    return false;
  }
}

async function testContentModeration() {
  console.log('\nTesting content moderation...');
  try {
    const response = await makeRequest('get', '/admin/solutions/moderation');
    console.log('✅ Content moderation accessible');
    console.log(`Solutions for moderation: ${response.solutions.length}`);
    return true;
  } catch (error) {
    console.log('❌ Content moderation access failed');
    return false;
  }
}

async function testApplicationManagement() {
  console.log('\nTesting application management...');
  try {
    const response = await makeRequest('get', '/admin/applications/stats');
    console.log('✅ Application management accessible');
    console.log(`Applications: ${response.applications.length}`);
    return true;
  } catch (error) {
    console.log('❌ Application management access failed');
    return false;
  }
}

async function testSystemLogs() {
  console.log('\nTesting system logs...');
  try {
    const response = await makeRequest('get', '/admin/system/logs');
    console.log('✅ System logs accessible');
    console.log(`Log entries: ${response.logs.length}`);
    return true;
  } catch (error) {
    console.log('❌ System logs access failed');
    return false;
  }
}

async function runAllTests() {
  console.log('🚀 Starting admin functionality tests...\n');

  const tests = [
    testAdminLogin,
    testAdminDashboard,
    testUserManagement,
    testContentModeration,
    testApplicationManagement,
    testSystemLogs
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      const result = await test();
      if (result) passed++;
      else failed++;
    } catch (error) {
      console.log(`❌ Test failed with error: ${error.message}`);
      failed++;
    }
  }

  console.log('\n📊 Test Results:');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success rate: ${((passed / tests.length) * 100).toFixed(1)}%`);

  if (failed === 0) {
    console.log('\n🎉 All admin functionality tests passed!');
  } else {
    console.log('\n💥 Some tests failed. Please check the implementation.');
    process.exit(1);
  }
}

// CLI setup
program
  .name('test-admin')
  .description('Test script for admin functionality')
  .option('-e, --email <email>', 'Admin email', ADMIN_USER.email)
  .option('-p, --password <password>', 'Admin password', ADMIN_USER.password)
  .action(async (options) => {
    ADMIN_USER.email = options.email;
    ADMIN_USER.password = options.password;
    await runAllTests();
  });

program.parse();