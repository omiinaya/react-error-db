import request from 'supertest';
import { app, createTestUser, createTestError, createTestSolution, getAuthToken, prisma } from './setup';

describe('Solution Routes', () => {
  let adminToken: string;
  let userToken: string;
  let otherUserToken: string;
  let adminId: string;
  let userId: string;
  let otherUserId: string;
  let errorId: string;
  let solutionId: string;
  let verifiedSolutionId: string;

  beforeAll(async () => {
    // Create test users
    const adminUser = await createTestUser('admin@test.com', 'adminuser', true);
    const regularUser = await createTestUser('user@test.com', 'regularuser', false);
    const otherUser = await createTestUser('other@test.com', 'otheruser', false);
    
    adminToken = getAuthToken(adminUser);
    userToken = getAuthToken(regularUser);
    otherUserToken = getAuthToken(otherUser);
    adminId = adminUser.id;
    userId = regularUser.id;
    otherUserId = otherUser.id;

    // Create test error
    const error = await createTestError();
    errorId = error.id;

    // Create test solutions
    const solution = await createTestSolution(errorId, userId);
    solutionId = solution.id;

    const verifiedSolution = await createTestSolution(errorId, userId);
    await prisma.solution.update({
      where: { id: verifiedSolution.id },
      data: {
        isVerified: true,
        verifiedById: adminId,
        verifiedAt: new Date()
      }
    });
    verifiedSolutionId = verifiedSolution.id;
  });

  afterAll(async () => {
    await prisma.vote.deleteMany();
    await prisma.solution.deleteMany();
    await prisma.errorCode.deleteMany();
    await prisma.application.deleteMany();
    await prisma.category.deleteMany();
    await prisma.user.deleteMany();
    await prisma.$disconnect();
  });

  describe('PUT /solutions/:solutionId', () => {
    it('should allow author to edit their own unverified solution', async () => {
      const response = await request(app)
        .put(`/api/solutions/${solutionId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          solutionText: 'Updated solution text with more than 10 characters'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.solution.solutionText).toBe('Updated solution text with more than 10 characters');
      expect(response.body.data.solution.editCount).toBe(1);
      expect(response.body.data.solution.lastEditedById).toBe(userId);
    });

    it('should prevent author from editing their own verified solution', async () => {
      const response = await request(app)
        .put(`/api/solutions/${verifiedSolutionId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          solutionText: 'Attempt to edit verified solution'
        });

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('SOLUTION_VERIFIED');
    });

    it('should prevent non-author from editing any solution', async () => {
      const response = await request(app)
        .put(`/api/solutions/${solutionId}`)
        .set('Authorization', `Bearer ${otherUserToken}`)
        .send({
          solutionText: 'Unauthorized edit attempt'
        });

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('FORBIDDEN');
    });

    it('should allow admin to edit any solution (including verified)', async () => {
      const response = await request(app)
        .put(`/api/solutions/${verifiedSolutionId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          solutionText: 'Admin edited this verified solution with proper content'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.solution.solutionText).toBe('Admin edited this verified solution with proper content');
      expect(response.body.data.solution.isVerified).toBe(false); // Should reset verification
      expect(response.body.data.solution.verifiedById).toBeNull();
      expect(response.body.data.solution.editCount).toBe(1);
    });

    it('should validate solution text length (min 10 characters)', async () => {
      const response = await request(app)
        .put(`/api/solutions/${solutionId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          solutionText: 'Short'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should validate solution text length (max 10000 characters)', async () => {
      const longText = 'a'.repeat(10001);
      const response = await request(app)
        .put(`/api/solutions/${solutionId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          solutionText: longText
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 404 for non-existent solution', async () => {
      const response = await request(app)
        .put('/api/solutions/nonexistent-id')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          solutionText: 'Valid solution text with enough characters'
        });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NOT_FOUND');
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .put(`/api/solutions/${solutionId}`)
        .send({
          solutionText: 'Unauthenticated edit attempt'
        });

      expect(response.status).toBe(401);
    });
  });

  describe('DELETE /solutions/:solutionId', () => {
    it('should allow author to delete their own solution', async () => {
      const solutionToDelete = await createTestSolution(errorId, userId);
      const response = await request(app)
        .delete(`/api/solutions/${solutionToDelete.id}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify solution was actually deleted
      const deletedSolution = await prisma.solution.findUnique({
        where: { id: solutionToDelete.id }
      });
      expect(deletedSolution).toBeNull();
    });

    it('should allow admin to delete any solution', async () => {
      const solutionToDelete = await createTestSolution(errorId, otherUserId);
      const response = await request(app)
        .delete(`/api/solutions/${solutionToDelete.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should prevent non-author from deleting solutions', async () => {
      const solutionToDelete = await createTestSolution(errorId, userId);
      const response = await request(app)
        .delete(`/api/solutions/${solutionToDelete.id}`)
        .set('Authorization', `Bearer ${otherUserToken}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /solutions/:solutionId/verify', () => {
    it('should allow admin to verify solution', async () => {
      const solutionToVerify = await createTestSolution(errorId, userId);
      const response = await request(app)
        .post(`/api/solutions/${solutionToVerify.id}/verify`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.solution.isVerified).toBe(true);
      expect(response.body.data.solution.verifiedById).toBe(adminId);
    });

    it('should prevent non-admin from verifying solution', async () => {
      const solutionToVerify = await createTestSolution(errorId, userId);
      const response = await request(app)
        .post(`/api/solutions/${solutionToVerify.id}/verify`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(403);
    });
  });
});