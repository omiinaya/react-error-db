import request from 'supertest';
import app from '../app';
import databaseService from '../services/database.service';
import { hashPassword } from '../utils/auth.utils';

describe('Auth API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        username: 'testuser',
        password: 'hashedpassword',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (databaseService.user.findUnique as jest.Mock).mockResolvedValue(null);
      (databaseService.user.create as jest.Mock).mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          username: 'testuser',
          password: 'password123',
          confirmPassword: 'password123',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe('test@example.com');
      expect(response.body.data.user.username).toBe('testuser');
      expect(response.body.data.user).not.toHaveProperty('password');
    });

    it('should return error for existing email', async () => {
      const existingUser = {
        id: 1,
        email: 'test@example.com',
        username: 'existinguser',
      };

      (databaseService.user.findUnique as jest.Mock).mockResolvedValue(existingUser);

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          username: 'testuser',
          password: 'password123',
          confirmPassword: 'password123',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('User with this email already exists');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login user successfully', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        username: 'testuser',
        password: await hashPassword('password123'),
        isActive: true,
      };

      (databaseService.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (databaseService.userSession.create as jest.Mock).mockResolvedValue({});

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe('test@example.com');
      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data).toHaveProperty('refreshToken');
    });

    it('should return error for invalid credentials', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        username: 'testuser',
        password: await hashPassword('password123'),
        isActive: true,
      };

      (databaseService.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid email or password');
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('should refresh access token successfully', async () => {
      const mockSession = {
        id: 'session-id',
        userId: 1,
        refreshToken: 'valid-refresh-token',
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7), // 7 days from now
      };

      const mockUser = {
        id: 1,
        email: 'test@example.com',
        username: 'testuser',
        isActive: true,
      };

      (databaseService.userSession.findFirst as jest.Mock).mockResolvedValue(mockSession);
      (databaseService.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (databaseService.userSession.update as jest.Mock).mockResolvedValue({});

      const response = await request(app)
        .post('/api/auth/refresh')
        .set('Authorization', 'Bearer valid-refresh-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data).toHaveProperty('refreshToken');
    });

    it('should return error for invalid refresh token', async () => {
      (databaseService.userSession.findFirst as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .post('/api/auth/refresh')
        .set('Authorization', 'Bearer invalid-refresh-token');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid refresh token');
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should logout user successfully', async () => {
      const mockSession = {
        id: 'session-id',
        userId: 1,
      };

      (databaseService.userSession.findFirst as jest.Mock).mockResolvedValue(mockSession);
      (databaseService.userSession.deleteMany as jest.Mock).mockResolvedValue({ count: 1 });

      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', 'Bearer valid-access-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Logged out successfully');
    });
  });
});