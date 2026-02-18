import request from 'supertest';
import { app, getAuthToken, createTestUser, createTestError, createTestSolution, prisma } from './setup';

describe('Debug Test', () => {
  let userToken: string;
  let userId: string;
  let errorId: string;
  let solutionId: string;

  beforeAll(async () => {
    const regularUser = await createTestUser('user@test.com', 'regularuser', false);
    userToken = getAuthToken(regularUser);
    userId = regularUser.id;

    const error = await createTestError();
    errorId = error.id;

    const solution = await createTestSolution(errorId, userId);
    solutionId = solution.id;
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

  it('should validate short text and return 400', async () => {
    const response = await request(app)
      .put(`/api/solutions/${solutionId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ solutionText: 'Short' });
    
    console.log('Response Status:', response.status);
    console.log('Response Body:', JSON.stringify(response.body, null, 2));
    
    // Check logged errors
    const mockedLogger = require('../utils/logger');
    console.log('Logger calls:', mockedLogger.logger.warn.mock.calls);
    
    expect(response.status).toBe(400);
  });
});
