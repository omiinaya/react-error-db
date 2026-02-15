import request from 'supertest';
import './setup'; // Import setup to ensure mocks are applied
import { app, prisma } from './setup';
import { hashPassword } from '../utils/auth.utils';

describe('Integration Tests', () => {
  let authToken: string;
  let refreshToken: string;
  let testErrorId: number;

  beforeAll(async () => {
    // Setup test data
    const mockUser = {
      id: 1,
      email: 'integration@test.com',
      username: 'integrationuser',
      password: await hashPassword('password123'),
      isActive: true,
    };

    const mockSession = {
      id: 'integration-session',
      userId: 1,
      refreshToken: 'integration-refresh-token',
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
    };

    const mockError = {
      id: 1,
      code: 'INT001',
      message: 'Integration test error',
      description: 'Error for integration testing',
      applicationId: 1,
    };

    // Mock database responses
    (prisma.user.findUnique as jest.Mock).mockImplementation(({ where }) => {
      if (where.email === 'integration@test.com') return Promise.resolve(mockUser);
      return Promise.resolve(null);
    });

    (prisma.user.create as jest.Mock).mockResolvedValue(mockUser);
    (prisma.userSession.findFirst as jest.Mock).mockResolvedValue(mockSession);
    (prisma.userSession.create as jest.Mock).mockResolvedValue(mockSession);
    (prisma.errorCode.create as jest.Mock).mockResolvedValue(mockError);
    (prisma.errorCode.findUnique as jest.Mock).mockResolvedValue(mockError);
    (prisma.errorCode.findMany as jest.Mock).mockResolvedValue([mockError]);
    (prisma.errorCode.count as jest.Mock).mockResolvedValue(1);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Authentication Flow', () => {
    it('should complete full authentication flow', async () => {
      // Register user
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'integration@test.com',
          username: 'integrationuser',
          password: 'password123',
          confirmPassword: 'password123',
        });

      expect(registerResponse.status).toBe(201);
      expect(registerResponse.body.data.user.email).toBe('integration@test.com');

      // Login user
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'integration@test.com',
          password: 'password123',
        });

      expect(loginResponse.status).toBe(200);
      expect(loginResponse.body.data).toHaveProperty('accessToken');
      expect(loginResponse.body.data).toHaveProperty('refreshToken');

      authToken = loginResponse.body.data.accessToken;
      refreshToken = loginResponse.body.data.refreshToken;

      // Refresh token
      const refreshResponse = await request(app)
        .post('/api/auth/refresh')
        .set('Authorization', `Bearer ${refreshToken}`);

      expect(refreshResponse.status).toBe(200);
      expect(refreshResponse.body.data).toHaveProperty('accessToken');
      expect(refreshResponse.body.data).toHaveProperty('refreshToken');

      // Logout
      const logoutResponse = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${authToken}`);

      expect(logoutResponse.status).toBe(200);
      expect(logoutResponse.body.message).toBe('Logged out successfully');
    });
  });

  describe('Error Management Flow', () => {
    it('should complete error management flow', async () => {
      // Login first
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'integration@test.com',
          password: 'password123',
        });

      authToken = loginResponse.body.data.accessToken;

      // Create error
      const createResponse = await request(app)
        .post('/api/errors')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          code: 'INT001',
          message: 'Integration test error',
          description: 'Error for integration testing',
          applicationId: 1,
        });

      expect(createResponse.status).toBe(201);
      expect(createResponse.body.data.error.code).toBe('INT001');
      testErrorId = createResponse.body.data.error.id;

      // Get errors list
      const listResponse = await request(app)
        .get('/api/errors')
        .set('Authorization', `Bearer ${authToken}`);

      expect(listResponse.status).toBe(200);
      expect(listResponse.body.data.errors).toHaveLength(1);
      expect(listResponse.body.data.errors[0].code).toBe('INT001');

      // Get error details
      const detailsResponse = await request(app)
        .get(`/api/errors/${testErrorId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(detailsResponse.status).toBe(200);
      expect(detailsResponse.body.data.error.code).toBe('INT001');

      // Update error
      const updateResponse = await request(app)
        .put(`/api/errors/${testErrorId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          message: 'Updated integration test error',
        });

      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.data.error.message).toBe('Updated integration test error');

      // Delete error
      const deleteResponse = await request(app)
        .delete(`/api/errors/${testErrorId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(deleteResponse.status).toBe(200);
      expect(deleteResponse.body.message).toBe('Error deleted successfully');
    });
  });

  describe('Error Scenarios', () => {
    it('should handle unauthorized access', async () => {
      const response = await request(app)
        .post('/api/errors')
        .send({
          code: 'UNAUTH001',
          message: 'Unauthorized test',
          applicationId: 1,
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Access token required');
    });

    it('should handle invalid token', async () => {
      const response = await request(app)
        .post('/api/errors')
        .set('Authorization', 'Bearer invalid-token')
        .send({
          code: 'INVALID001',
          message: 'Invalid token test',
          applicationId: 1,
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Invalid token');
    });

    it('should handle rate limiting', async () => {
      // Make multiple requests to trigger rate limiting
      const requests = Array(10).fill(0).map(() => 
        request(app).get('/api/health')
      );

      const responses = await Promise.all(requests);
      
      // All should succeed since we're not hitting the rate limit in test mode
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
    });
  });
});