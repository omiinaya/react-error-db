import request from 'supertest';
import app from '../app';
import databaseService from '../services/database.service';

describe('Error Routes API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/errors', () => {
    it('should return paginated list of errors', async () => {
      const mockErrors = [
        {
          id: 1,
          code: 'ERR001',
          message: 'Test error message',
          application: { name: 'Test App' },
          solutions: [{ id: 1, content: 'Test solution' }],
          _count: { solutions: 1 },
        },
      ];

      (databaseService.errorCode.findMany as jest.Mock).mockResolvedValue(mockErrors);
      (databaseService.errorCode.count as jest.Mock).mockResolvedValue(1);

      const response = await request(app)
        .get('/api/errors')
        .query({ page: 1, limit: 10 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.errors).toHaveLength(1);
      expect(response.body.data.pagination.total).toBe(1);
      expect(response.body.data.pagination.page).toBe(1);
      expect(response.body.data.pagination.limit).toBe(10);
    });

    it('should filter errors by application', async () => {
      const mockErrors = [
        {
          id: 1,
          code: 'ERR001',
          message: 'Test error message',
          application: { name: 'Test App' },
          solutions: [],
          _count: { solutions: 0 },
        },
      ];

      (databaseService.errorCode.findMany as jest.Mock).mockResolvedValue(mockErrors);
      (databaseService.errorCode.count as jest.Mock).mockResolvedValue(1);

      const response = await request(app)
        .get('/api/errors')
        .query({ application: 'Test App' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(databaseService.errorCode.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            application: expect.objectContaining({
              name: expect.objectContaining({
                contains: 'Test App',
                mode: 'insensitive',
              }),
            }),
          }),
        })
      );
    });
  });

  describe('GET /api/errors/:id', () => {
    it('should return error details', async () => {
      const mockError = {
        id: 1,
        code: 'ERR001',
        message: 'Test error message',
        description: 'Test error description',
        application: { id: 1, name: 'Test App' },
        solutions: [
          {
            id: 1,
            content: 'Test solution',
            user: { username: 'testuser' },
            votes: [],
            _count: { votes: 0 },
          },
        ],
        _count: { solutions: 1 },
      };

      (databaseService.errorCode.findUnique as jest.Mock).mockResolvedValue(mockError);

      const response = await request(app).get('/api/errors/1');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.error.code).toBe('ERR001');
      expect(response.body.data.error.solutions).toHaveLength(1);
    });

    it('should return 404 for non-existent error', async () => {
      (databaseService.errorCode.findUnique as jest.Mock).mockResolvedValue(null);

      const response = await request(app).get('/api/errors/999');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Error not found');
    });
  });

  describe('POST /api/errors', () => {
    it('should create a new error', async () => {
      const mockError = {
        id: 1,
        code: 'ERR001',
        message: 'Test error message',
        description: 'Test error description',
        applicationId: 1,
      };

      (databaseService.errorCode.create as jest.Mock).mockResolvedValue(mockError);

      const response = await request(app)
        .post('/api/errors')
        .send({
          code: 'ERR001',
          message: 'Test error message',
          description: 'Test error description',
          applicationId: 1,
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.error.code).toBe('ERR001');
    });

    it('should return error for duplicate error code', async () => {
      const existingError = {
        id: 1,
        code: 'ERR001',
        message: 'Existing error',
      };

      (databaseService.errorCode.findUnique as jest.Mock).mockResolvedValue(existingError);

      const response = await request(app)
        .post('/api/errors')
        .send({
          code: 'ERR001',
          message: 'Test error message',
          description: 'Test error description',
          applicationId: 1,
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Error code already exists');
    });
  });

  describe('PUT /api/errors/:id', () => {
    it('should update an existing error', async () => {
      const mockError = {
        id: 1,
        code: 'ERR001',
        message: 'Updated error message',
        description: 'Updated error description',
        applicationId: 1,
      };

      (databaseService.errorCode.findUnique as jest.Mock).mockResolvedValue(mockError);
      (databaseService.errorCode.update as jest.Mock).mockResolvedValue(mockError);

      const response = await request(app)
        .put('/api/errors/1')
        .send({
          message: 'Updated error message',
          description: 'Updated error description',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.error.message).toBe('Updated error message');
    });

    it('should return 404 for non-existent error', async () => {
      (databaseService.errorCode.findUnique as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .put('/api/errors/999')
        .send({
          message: 'Updated error message',
        });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Error not found');
    });
  });

  describe('DELETE /api/errors/:id', () => {
    it('should delete an error', async () => {
      const mockError = {
        id: 1,
        code: 'ERR001',
        message: 'Test error message',
      };

      (databaseService.errorCode.findUnique as jest.Mock).mockResolvedValue(mockError);
      (databaseService.errorCode.delete as jest.Mock).mockResolvedValue(mockError);

      const response = await request(app).delete('/api/errors/1');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Error deleted successfully');
    });

    it('should return 404 for non-existent error', async () => {
      (databaseService.errorCode.findUnique as jest.Mock).mockResolvedValue(null);

      const response = await request(app).delete('/api/errors/999');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Error not found');
    });
  });
});