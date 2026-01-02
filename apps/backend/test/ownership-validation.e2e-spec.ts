
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';


describe('Ownership Validation (e2e)', () => {
  let app: INestApplication;
  let user1Token: string;
  let user2Token: string;
  let user1LoanId: string;
  let user1CollateralId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
    await app.init();

    
    const user1Response = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'user1@test.com',
        password: 'password123',
        walletAddress: '0x1234567890123456789012345678901234567890',
      });
    user1Token = user1Response.body.access_token;

    const user2Response = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'user2@test.com',
        password: 'password456',
        walletAddress: '0x0987654321098765432109876543210987654321',
      });
    user2Token = user2Response.body.access_token;

    
    const loanResponse = await request(app.getHttpServer())
      .post('/loans')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({
        amount: '1000',
        chain: 'ethereum',
        collateralTokenAddress: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
        collateralAmount: '2000',
        durationDays: 30,
      });
    user1LoanId = loanResponse.body.id;

    
    const collateralResponse = await request(app.getHttpServer())
      .post('/collateral')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({
        tokenAddress: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
        amount: '2000',
      });
    user1CollateralId = collateralResponse.body.id;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Loan Ownership Validation', () => {
    it('should allow user1 to access their own loan', async () => {
      const response = await request(app.getHttpServer())
        .get(`/loans/${user1LoanId}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      expect(response.body.id).toBe(user1LoanId);
    });

    it('should prevent user2 from accessing user1 loan', async () => {
      const response = await request(app.getHttpServer())
        .get(`/loans/${user1LoanId}`)
        .set('Authorization', `Bearer ${user2Token}`)
        .expect(403);

      expect(response.body.message).toContain('do not have permission');
    });

    it('should prevent user2 from repaying user1 loan', async () => {
      await request(app.getHttpServer())
        .put(`/loans/${user1LoanId}/repay`)
        .set('Authorization', `Bearer ${user2Token}`)
        .send({
          amount: '100',
          transactionHash: '0xabc123',
        })
        .expect(403);
    });

    it('should prevent user2 from liquidating user1 loan', async () => {
      await request(app.getHttpServer())
        .put(`/loans/${user1LoanId}/liquidate`)
        .set('Authorization', `Bearer ${user2Token}`)
        .expect(403);
    });
  });

  describe('Collateral Ownership Validation', () => {
    it('should allow user1 to access their own collateral', async () => {
      const response = await request(app.getHttpServer())
        .get(`/collateral/${user1CollateralId}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      expect(response.body.id).toBe(user1CollateralId);
    });

    it('should prevent user2 from accessing user1 collateral', async () => {
      const response = await request(app.getHttpServer())
        .get(`/collateral/${user1CollateralId}`)
        .set('Authorization', `Bearer ${user2Token}`)
        .expect(403);

      expect(response.body.message).toContain('do not have permission');
    });

    it('should prevent user2 from unlocking user1 collateral', async () => {
      await request(app.getHttpServer())
        .post(`/collateral/${user1CollateralId}/unlock`)
        .set('Authorization', `Bearer ${user2Token}`)
        .expect(403);
    });

    it('should prevent user2 from getting user1 collateral value', async () => {
      await request(app.getHttpServer())
        .get(`/collateral/${user1CollateralId}/value`)
        .set('Authorization', `Bearer ${user2Token}`)
        .expect(403);
    });
  });

  describe('Unauthenticated Access', () => {
    it('should prevent unauthenticated access to loans', async () => {
      await request(app.getHttpServer())
        .get(`/loans/${user1LoanId}`)
        .expect(401);
    });

    it('should prevent unauthenticated access to collateral', async () => {
      await request(app.getHttpServer())
        .get(`/collateral/${user1CollateralId}`)
        .expect(401);
    });
  });

  describe('Non-existent Resources', () => {
    it('should return 404 for non-existent loan', async () => {
      await request(app.getHttpServer())
        .get('/loans/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(404);
    });

    it('should return 404 for non-existent collateral', async () => {
      await request(app.getHttpServer())
        .get('/collateral/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(404);
    });
  });
});
