import { describe, it, beforeAll, afterAll, expect } from '@jest/globals';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';

describe('Auth and Loan Flow (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;
  let userId: string;

  beforeAll(async () => {
    app = await NestFactory.create(AppModule, { logger: false });
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.listen(0);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Authentication Flow', () => {
    it('should register a new user via wallet', async () => {
      const walletAddress = '0x' + '1'.repeat(40);
      const signature = 'mock-signature';

      const server = app.getHttpServer();
      const addr = server.address();
      const port = typeof addr === 'string' ? 80 : addr.port;
      const response = await fetch(`http://127.0.0.1:${port}/api/v1/auth/wallet`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress,
          signature,
          message: 'Sign in to LYNQ',
          chain: 'ethereum',
        }),
      });
      expect(response.status).toBe(201);

      const body = await response.json();
      expect(body).toHaveProperty('accessToken');
      expect(body).toHaveProperty('user');
      
      accessToken = body.accessToken;
      userId = body.user.id;
    });

    it('should get current user profile', async () => {
      const server = app.getHttpServer();
      const addr = server.address();
      const port = typeof addr === 'string' ? 80 : addr.port;
      const response = await fetch(`http://127.0.0.1:${port}/api/v1/users/me`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      expect(response.status).toBe(200);

      const body = await response.json();
      expect(body).toHaveProperty('id', userId);
      expect(body).toHaveProperty('email');
    });
  });

  describe('Loan Flow', () => {
    let loanId: string;

    it('should create a loan', async () => {
      const server = app.getHttpServer();
      const addr = server.address();
      const port = typeof addr === 'string' ? 80 : addr.port;
      const response = await fetch(`http://127.0.0.1:${port}/api/v1/loans`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          amount: '1000',
          collateralAmount: '1500',
          collateralTokenAddress: '0x' + 'a'.repeat(40),
          durationDays: 30,
          chain: 'ethereum',
        }),
      });
      expect(response.status).toBe(201);

      const body = await response.json();
      expect(body).toHaveProperty('id');
      expect(body).toHaveProperty('amount', '1000');
      expect(body).toHaveProperty('status');
      
      loanId = body.id;
    });

    it('should fetch user loans', async () => {
      const server = app.getHttpServer();
      const addr = server.address();
      const port = typeof addr === 'string' ? 80 : addr.port;
      const response = await fetch(`http://127.0.0.1:${port}/api/v1/loans/user/${userId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      expect(response.status).toBe(200);

      const body = await response.json();
      expect(Array.isArray(body)).toBe(true);
      expect(body.length).toBeGreaterThan(0);
      expect(body[0]).toHaveProperty('id', loanId);
    });

    it('should get loan by id', async () => {
      const server = app.getHttpServer();
      const addr = server.address();
      const port = typeof addr === 'string' ? 80 : addr.port;
      const response = await fetch(`http://127.0.0.1:${port}/api/v1/loans/${loanId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      expect(response.status).toBe(200);

      const body = await response.json();
      expect(body).toHaveProperty('id', loanId);
      expect(body).toHaveProperty('amount', '1000');
    });
  });
});
